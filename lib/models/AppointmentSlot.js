import mongoose from 'mongoose';

const AppointmentSlotSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 60, // Default duration in minutes
    min: 15,     // Minimum 15 minutes
    max: 240     // Maximum 4 hours
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  }
}, {
  timestamps: true
});

// Create index for faster slot lookup
AppointmentSlotSchema.index({ doctorId: 1, date: 1, isAvailable: 1 });

// Use existing model or create new one
const AppointmentSlot = mongoose.models.AppointmentSlot || mongoose.model('AppointmentSlot', AppointmentSlotSchema);

export default AppointmentSlot; 