const express = require('express');
const router = express.Router();
const {
  createStudent,
  getStudent,
  updateStudent,
  getProgress,
  saveNotes,
} = require('../controllers/studentController');

// POST /api/students - Create or find student
router.post('/', createStudent);

// GET /api/students/:id - Get student by studentId
router.get('/:id', getStudent);

// PUT /api/students/:id - Update student profile
router.put('/:id', updateStudent);

// GET /api/students/:id/progress - Get progress summary
router.get('/:id/progress', getProgress);

// POST /api/students/:id/notes - Save voice notes
router.post('/:id/notes', saveNotes);

module.exports = router;
