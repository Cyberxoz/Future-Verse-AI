const supabaseService = require('../services/supabase.service');

async function getTransactions(req, res, next) {
  try {
    const list = await supabaseService.getTransactions(req.user.id);
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    next(err);
  }
}

async function addTransaction(req, res, next) {
  try {
    const { title, amount, category, type, date } = req.body;
    const newTx = await supabaseService.addTransaction(req.user.id, {
      title: title.trim(),
      amount: Number(amount),
      category: (category || 'General').trim(),
      type: type.toLowerCase(),
      date: date || new Date().toISOString().split('T')[0]
    });
    res.status(201).json({ success: true, data: newTx, message: 'Transaction recorded successfully.' });
  } catch (err) {
    next(err);
  }
}

async function deleteTransaction(req, res, next) {
  try {
    const { id } = req.params;
    await supabaseService.deleteTransaction(req.user.id, id);
    res.json({ success: true, message: 'Transaction deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTransactions,
  addTransaction,
  deleteTransaction
};
