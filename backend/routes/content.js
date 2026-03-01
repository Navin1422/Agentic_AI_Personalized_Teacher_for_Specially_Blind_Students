const express = require('express');
const router = express.Router();
const {
  getClasses,
  getSubjects,
  getChapters,
  getChapter,
  getChapterPdf,
} = require('../controllers/contentController');

// GET /api/content/classes
router.get('/classes', getClasses);

// GET /api/content/:class/subjects
router.get('/:class/subjects', getSubjects);

// GET /api/content/:class/:subject/chapters
router.get('/:class/:subject/chapters', getChapters);

// GET /api/content/pdf/:class/:subject
router.get('/pdf/:class/:subject', getChapterPdf);

// GET /api/content/:class/:subject/:chapter
router.get('/:class/:subject/:chapter', getChapter);

module.exports = router;
