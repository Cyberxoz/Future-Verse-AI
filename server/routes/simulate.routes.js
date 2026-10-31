const express = require('express');
const router = express.Router();
const simulateController = require('../controllers/simulate.controller');
const authenticate = require('../middleware/auth.middleware');
const { validateSimulation } = require('../middleware/validation.middleware');

router.post('/', authenticate, validateSimulation, simulateController.runSimulation);
router.post('/compare', authenticate, validateSimulation, simulateController.compareParallelFutures);
router.get('/history', authenticate, simulateController.getSimulationHistory);

module.exports = router;
