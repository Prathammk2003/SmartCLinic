import mongoose from 'mongoose';

const MedicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  instructions: {
    type: String
  }
});

const PrescriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  date: {
    type: Date,
    default: Date.now
  },
  diagnosis: {
    type: String,
    required: true
  },
  medications: [MedicationSchema],
  additionalNotes: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
}, {
  timestamps: true
});

const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', PrescriptionSchema);

export default Prescription;