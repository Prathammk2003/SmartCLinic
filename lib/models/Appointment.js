import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
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
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppointmentSlot',
    required: true
  },
  type: {
    type: String,
    enum: ['in-person', 'video', 'phone'],
    default: 'in-person'
  },
  reason: {
    type: String,
    required: true
  },
  symptoms: {
    type: [String]
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['confirmed', 'completed', 'cancelled', 'rescheduled'],
    default: 'confirmed'
  },
  hasPrescription: {
    type: Boolean,
    default: false
  },
  doctorNotes: {
    type: String
  }
}, {
  timestamps: true
});

// Create a compound index on doctorId and slotId to ensure a doctor can't have multiple appointments 
// for the same slot
AppointmentSchema.index({ doctorId: 1, slotId: 1 }, { unique: true });

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);

export default Appointment; 