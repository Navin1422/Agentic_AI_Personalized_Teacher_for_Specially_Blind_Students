const mongoose = require('mongoose');

const BrixbeeLogSchema = new mongoose.Schema({
  query: { type: String, required: true },
  response: { type: String, required: true },
  type: { type: String, enum: ['teacher', 'assistant'], default: 'assistant' },
  timestamp: { type: Date, default: Date.now },
  device: { type: String, default: 'Desktop' }
});

module.exports = mongoose.model('BrixbeeLog', BrixbeeLogSchema);
