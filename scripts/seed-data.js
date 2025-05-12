import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// MongoDB connection
const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    console.log('Connecting to MongoDB...', MONGO_URI.replace(/\/\/([^:]+):[^@]+@/, '//***:***@'));
    
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define models
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient'
  },
  dateOfBirth: Date,
  gender: String,
  address: String,
  medicalHistory: Array,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const DoctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  specialization: String,
  qualifications: Array,
  experience: Number,
  licenseNumber: String,
  consultationFee: Number,
  availableSlots: Array,
  bio: String,
  ratings: Number,
  reviews: Array
}, {
  timestamps: true
});

const AppointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  date: Date,
  startTime: String,
  endTime: String,
  status: String,
  type: String,
  reason: String,
  notes: String,
  symptoms: Array
}, {
  timestamps: true
});

// Create models
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);

// Sample data function
const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    
    console.log('Deleted existing data');

    // Create sample patients
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const patient1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      phone: '+1234567890',
      role: 'patient',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'male',
      address: '123 Main St, Boston, MA, USA',
      medicalHistory: [
        {
          condition: 'Asthma',
          notes: 'Diagnosed in 2010, uses inhaler as needed',
          date: new Date('2010-03-10')
        },
        {
          condition: 'Allergies',
          notes: 'Seasonal allergies, pollen and dust',
          date: new Date('2012-06-22')
        }
      ]
    });
    
    const patient2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: hashedPassword,
      phone: '+1987654321',
      role: 'patient',
      dateOfBirth: new Date('1985-11-23'),
      gender: 'female',
      address: '456 Elm St, New York, NY, USA',
      medicalHistory: []
    });
    
    // Create doctor users
    const doctorUser1 = await User.create({
      name: 'Dr. Sarah Johnson',
      email: 'sarah@example.com',
      password: hashedPassword,
      phone: '+1122334455',
      role: 'doctor',
      dateOfBirth: new Date('1980-03-12'),
      gender: 'female',
      address: '789 Oak St, Chicago, IL, USA'
    });
    
    const doctorUser2 = await User.create({
      name: 'Dr. Michael Chen',
      email: 'michael@example.com',
      password: hashedPassword,
      phone: '+1554433221',
      role: 'doctor',
      dateOfBirth: new Date('1975-09-28'),
      gender: 'male',
      address: '101 Pine St, San Francisco, CA, USA'
    });
    
    // Create doctors
    const doctor1 = await Doctor.create({
      userId: doctorUser1._id,
      specialization: 'Cardiology',
      qualifications: ['MD', 'PhD', 'Board Certified'],
      experience: 12,
      licenseNumber: 'MD12345',
      consultationFee: 150,
      bio: 'Specialist in cardiovascular diseases with over 12 years of experience.',
      availableSlots: [
        {
          day: 'monday',
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true
        },
        {
          day: 'wednesday',
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true
        },
        {
          day: 'friday',
          startTime: '09:00',
          endTime: '13:00',
          isAvailable: true
        }
      ]
    });
    
    const doctor2 = await Doctor.create({
      userId: doctorUser2._id,
      specialization: 'Dermatology',
      qualifications: ['MD', 'Board Certified'],
      experience: 15,
      licenseNumber: 'MD67890',
      consultationFee: 180,
      bio: 'Experienced dermatologist specializing in skin conditions and cosmetic procedures.',
      availableSlots: [
        {
          day: 'tuesday',
          startTime: '10:00',
          endTime: '18:00',
          isAvailable: true
        },
        {
          day: 'thursday',
          startTime: '10:00',
          endTime: '18:00',
          isAvailable: true
        }
      ]
    });
    
    // Create appointments
    await Appointment.create({
      patientId: patient1._id,
      doctorId: doctor1._id,
      date: new Date(Date.now() + 86400000), // Tomorrow
      startTime: '10:00',
      endTime: '10:30',
      status: 'scheduled',
      type: 'in-person',
      reason: 'Annual checkup',
      symptoms: ['None', 'Routine visit']
    });
    
    await Appointment.create({
      patientId: patient1._id,
      doctorId: doctor2._id,
      date: new Date(Date.now() + 172800000), // Day after tomorrow
      startTime: '14:00',
      endTime: '14:30',
      status: 'scheduled',
      type: 'video',
      reason: 'Skin rash consultation',
      symptoms: ['Rash', 'Itching']
    });
    
    await Appointment.create({
      patientId: patient2._id,
      doctorId: doctor1._id,
      date: new Date(Date.now() + 259200000), // 3 days from now
      startTime: '11:00',
      endTime: '11:30',
      status: 'scheduled',
      type: 'in-person',
      reason: 'Chest pain investigation',
      symptoms: ['Chest pain', 'Shortness of breath']
    });
    
    console.log('Sample data created successfully');
    
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await seedData();
  console.log('Database seeded successfully');
  process.exit();
};

// Run the script
main(); 