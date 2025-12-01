// In server/routes/quiz.routes.js
const express = require('express');
const router = express.Router();

// --- IMPORT CORRECT FUNCTION NAMES ---
const { 
    createQuiz, 
    getAvailableQuizzes, 
    nextQuestion, 
    submitQuiz // <--- This must match the controller export
} = require('../controllers/quiz.controller');

const authMiddleware = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

// --- ROUTES ---

// Faculty: Create a new quiz
router.post(
    '/create', 
    [authMiddleware, checkRole(['Faculty', 'SuperAdmin'])], 
    createQuiz
);

// Student: List available quizzes
router.get(
    '/list', 
    authMiddleware, 
    getAvailableQuizzes
);

// Student: Get next adaptive question
router.post(
    '/next', 
    authMiddleware, 
    nextQuestion
);

// Student: Submit final score
router.post(
    '/submit', 
    authMiddleware, 
    submitQuiz // <--- Ensure this variable is not undefined
);

module.exports = router;