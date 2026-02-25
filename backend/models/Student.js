const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  subject: String,
  chapter: String,
  summary: String,
  questionsAsked: [String],
  score: Number,
});

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  class: { type: String, default: '' },
  language: { type: String, default: 'english', enum: ['english', 'tamil'] },
  weakTopics: [String],
  masteredTopics: [String],
  sessionHistory: [sessionSchema],
  lastSubject: { type: String, default: '' },
  lastChapter: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Student', studentSchema);
