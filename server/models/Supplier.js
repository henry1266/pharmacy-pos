const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  contactPerson: {
    type: String
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  address: {
    type: String
  },
  taxId: {
    type: String
  },
  paymentTerms: {
    type: String
  },
  notes: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('supplier', SupplierSchema);
