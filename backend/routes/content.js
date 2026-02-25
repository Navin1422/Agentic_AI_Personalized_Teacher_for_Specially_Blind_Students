const express = require('express');
const router = express.Router();
const {
  getClasses,
  getSubjects,
  getChapters,
  getChapter,
} = require('../controllers/contentController');

// GET /api/content/classes
router.get('/classes', getClasses);

// GET /api/content/:class/subjects
router.get('/:class/subjects', getSubjects);

// GET /api/content/:class/:subject/chapters
router.get('/:class/:subject/chapters', getChapters);

// GET /api/content/:class/:subject/:chapter
router.get('/:class/:subject/:chapter', getChapter);

module.exports = router;
