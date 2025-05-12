// This file ensures all models are loaded in the correct order to prevent
// MissingSchemaError problems with references between models

import mongoose from 'mongoose';

// Import all models - order matters for references
import User from './User';
import Doctor from './Doctor';
import AppointmentSlot from './AppointmentSlot';
import Appointment from './Appointment';
import Prescription from './Prescription';

// Export all models for convenience
export {
  User,
  Doctor,
  AppointmentSlot,
  Appointment,
  Prescription
};

// Simple function to check which models are registered
export function getRegisteredModels() {
  return Object.keys(mongoose.models);
}

// Export default just returns the mongoose models object
export default mongoose.models; 