const express = require('express');
const router = express.Router();
const goalsController = require('../controllers/goals.controller');
const authenticate = require('../middleware/auth.middleware');
const { validateGoal } = require('../middleware/validation.middleware');

router.get('/', authenticate, goalsController.getGoals);
router.post('/', authenticate, validateGoal, goalsController.addGoal);
router.put('/:id', authenticate, goalsController.updateGoal);
router.delete('/:id', authenticate, goalsController.deleteGoal);

module.exports = router;
