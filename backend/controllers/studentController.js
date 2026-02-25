const Student = require('../models/Student');
const { v4: uuidv4 } = require('uuid');

// @route  POST /api/students
// @desc   Create new student or find by name
const createStudent = async (req, res) => {
  try {
    const { name, classLevel, language } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    // Check if student with same name exists (case-insensitive)
    let student = await Student.findOne({ name: new RegExp(`^${name}$`, 'i') });

    if (student) {
      // Return existing student
      return res.json({ student, isNew: false, message: `Welcome back, ${student.name}! 🎉` });
    }

    // Create new student
    const studentId = uuidv4();
    student = await Student.create({
      studentId,
      name: name.trim(),
      class: classLevel || '',
      language: language || 'english',
    });

    res.status(201).json({ student, isNew: true, message: `Hello ${student.name}! I am Akka, your AI teacher! 🌟` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route  GET /api/students/:id
// @desc   Get student profile by studentId
const getStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.id });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ student });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route  PUT /api/students/:id
// @desc   Update student profile / memory
const updateStudent = async (req, res) => {
  try {
    const { name, classLevel, language, weakTopics, masteredTopics } = req.body;
    const student = await Student.findOne({ studentId: req.params.id });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (name) student.name = name;
    if (classLevel) student.class = classLevel;
    if (language) student.language = language;
    if (weakTopics) student.weakTopics = weakTopics;
    if (masteredTopics) student.masteredTopics = masteredTopics;
    student.lastActiveAt = new Date();

    await student.save();
    res.json({ student });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route  GET /api/students/:id/progress
// @desc   Get student progress summary
const getProgress = async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.id });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const progress = {
      name: student.name,
      class: student.class,
      totalSessions: student.sessionHistory.length,
      weakTopics: student.weakTopics,
      masteredTopics: student.masteredTopics,
      lastSession: student.sessionHistory[student.sessionHistory.length - 1] || null,
      recentSessions: student.sessionHistory.slice(-5),
    };

    res.json({ progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createStudent, getStudent, updateStudent, getProgress };
