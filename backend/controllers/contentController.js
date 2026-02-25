const Textbook = require('../models/Textbook');

// @route  GET /api/content/classes
// @desc   Get all available classes
const getClasses = async (req, res) => {
  try {
    const classes = await Textbook.distinct('class');
    res.json({ classes: classes.sort((a, b) => parseInt(a) - parseInt(b)) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route  GET /api/content/:class/subjects
// @desc   Get subjects for a class
const getSubjects = async (req, res) => {
  try {
    const subjects = await Textbook.distinct('subject', { class: req.params.class });
    res.json({ class: req.params.class, subjects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route  GET /api/content/:class/:subject/chapters
// @desc   Get chapters list for class + subject
const getChapters = async (req, res) => {
  try {
    const chapters = await Textbook.find(
      { class: req.params.class, subject: req.params.subject.toLowerCase() },
      { chapterNumber: 1, title: 1, _id: 0 }
    ).sort({ chapterNumber: 1 });
    res.json({ class: req.params.class, subject: req.params.subject, chapters });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route  GET /api/content/:class/:subject/:chapter
// @desc   Get full chapter content
const getChapter = async (req, res) => {
  try {
    const chapter = await Textbook.findOne({
      class: req.params.class,
      subject: req.params.subject.toLowerCase(),
      chapterNumber: parseInt(req.params.chapter),
    });

    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    res.json({ chapter });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getClasses, getSubjects, getChapters, getChapter };
