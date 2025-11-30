const express = require('express');
const router = express.Router();
const { createQuiz, getAvailableQuizzes, nextQuestion, submitQuiz, getQuizDetails } = require('../controllers/quiz.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

// Faculty: Create
router.post('/create', [authMiddleware, checkRole(['Faculty', 'SuperAdmin'])], createQuiz);

// Student: List
router.get('/list', authMiddleware, getAvailableQuizzes);

// Student: Get Details (Before starting)
router.get('/:quizId/details', authMiddleware, getQuizDetails);

// Student: Play
router.post('/next', authMiddleware, nextQuestion);
router.post('/submit', authMiddleware, submitQuiz);

module.exports = router;