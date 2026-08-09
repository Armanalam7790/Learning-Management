const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  country: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  fullAddress: { type: String, required: true }
}, { _id: false });

const instituteSchema = new mongoose.Schema({
  instituteName: { type: String, required: true },
  instituteCode: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  website: { type: String, default: '' },
  ownerName: { type: String, required: true },
  address: { type: addressSchema, required: true },
  logo: { type: String, default: '' },
  status: { type: String, default: 'active' },
  subscriptionPlan: { type: String, default: 'free' },
  maxStudents: { type: Number, default: 0 },
  maxTeachers: { type: Number, default: 0 },
  subscriptionExpiry: { type: Date, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('Institute', instituteSchema);
