import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    maxlength: [60, 'Name cannot be more than 60 characters'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if auth method is local
      return this.authMethod === 'local';
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  authMethod: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    trim: true
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient'
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  medicalHistory: [{
    condition: {
      type: String,
      required: true
    },
    diagnosedDate: {
      type: Date
    },
    medications: {
      type: [String]
    },
    notes: {
      type: String
    }
  }],
  allergies: {
    type: [String]
  },
  emergencyContact: {
    name: {
      type: String
    },
    relationship: {
      type: String
    },
    phone: {
      type: String
    }
  },
  profilePicture: {
    type: String
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving to database
UserSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new) and auth method is local
  if (!this.isModified("password") || this.authMethod !== 'local') {
    return next();
  }
  
  try {
    console.log("Hashing password before saving");
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash the password with salt
    this.password = await bcrypt.hash(this.password, salt);
    console.log("Password hashed successfully");
    next();
  } catch (error) {
    console.error("Error hashing password:", error);
    next(error);
  }
});

// Method to check if password is correct
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    console.error("No password field found on user model");
    return false;
  }
  
  try {
    // Use bcrypt's compare function
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
};

// Make sure we use an existing model or create a new one
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User; 