import mongoose from 'mongoose';
import User from './User';

const DoctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specialization: {
    type: String,
    required: [true, 'Please provide specialization']
  },
  qualifications: {
    type: [String],
    default: []
  },
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  licenseNumber: {
    type: String
  },
  consultationFee: {
    type: Number,
    required: [true, 'Please provide consultation fee'],
    min: 0,
    description: 'Consultation fee in Indian Rupees (₹)'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  paymentQrInfo: {
    accountName: {
      type: String,
      default: ''
    },
    accountDetails: {
      type: String,
      default: ''
    },
    qrCodeUrl: {
      type: String,
      default: ''
    }
  },
  availableSlots: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
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
    isAvailable: {
      type: Boolean,
      default: true
    }
  }],
  bio: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewsCount: {
    type: Number,
    default: 0
  },
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  education: {
    type: String,
    required: true,
  },
}, {
  timestamps: true
});

const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);

export default Doctor; 