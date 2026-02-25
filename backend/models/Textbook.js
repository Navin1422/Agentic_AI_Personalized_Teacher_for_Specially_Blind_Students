const mongoose = require('mongoose');

const textbookSchema = new mongoose.Schema({
  class: { type: String, required: true },       // e.g. "5", "6"
  subject: { type: String, required: true },     // e.g. "science", "maths"
  chapterNumber: { type: Number, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },     // Full readable text
  keyPoints: [String],
  vocabulary: [{ word: String, meaning: String }],
  examples: [String],
});

textbookSchema.index({ class: 1, subject: 1, chapterNumber: 1 }, { unique: true });

module.exports = mongoose.model('Textbook', textbookSchema);
