/**
 * Input validation helpers
 */

function validateTransaction(req, res, next) {
  const { title, amount, type } = req.body;
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ success: false, error: 'Transaction title is required.' });
  }
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Transaction amount must be a positive number.' });
  }
  if (!type || !['income', 'expense'].includes(type.toLowerCase())) {
    return res.status(400).json({ success: false, error: "Transaction type must be 'income' or 'expense'." });
  }
  next();
}

function validateGoal(req, res, next) {
  const { title, target_amount } = req.body;
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ success: false, error: 'Goal title is required.' });
  }
  const numTarget = Number(target_amount);
  if (isNaN(numTarget) || numTarget <= 0) {
    return res.status(400).json({ success: false, error: 'Target amount must be a positive number.' });
  }
  next();
}

function validateSimulation(req, res, next) {
  const { purchaseAmount, durationMonths } = req.body;
  if (purchaseAmount !== undefined) {
    const num = Number(purchaseAmount);
    if (isNaN(num) || num < 0) {
      return res.status(400).json({ success: false, error: 'Purchase amount must be a non-negative number.' });
    }
  }
  if (durationMonths !== undefined) {
    const d = Number(durationMonths);
    if (isNaN(d) || d < 1 || d > 60) {
      return res.status(400).json({ success: false, error: 'Duration months must be between 1 and 60.' });
    }
  }
  next();
}

function validateAiChat(req, res, next) {
  const { message } = req.body;
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ success: false, error: 'Message cannot be empty.' });
  }
  if (message.length > 2500) {
    return res.status(400).json({ success: false, error: 'Message exceeds 2500 characters limit.' });
  }
  next();
}

module.exports = {
  validateTransaction,
  validateGoal,
  validateSimulation,
  validateAiChat
};
