const express = require('express');
const router = express.Router();
const transactionsController = require('../controllers/transactions.controller');
const authenticate = require('../middleware/auth.middleware');
const { validateTransaction } = require('../middleware/validation.middleware');

router.get('/', authenticate, transactionsController.getTransactions);
router.post('/', authenticate, validateTransaction, transactionsController.addTransaction);
router.delete('/:id', authenticate, transactionsController.deleteTransaction);

module.exports = router;
