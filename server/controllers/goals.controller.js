const supabaseService = require('../services/supabase.service');

async function getGoals(req, res, next) {
  try {
    const list = await supabaseService.getGoals(req.user.id);
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    next(err);
  }
}

async function addGoal(req, res, next) {
  try {
    const { title, target_amount, current_amount, target_date, category, icon } = req.body;
    const newGoal = await supabaseService.addGoal(req.user.id, {
      title: title.trim(),
      target_amount: Number(target_amount),
      current_amount: Number(current_amount) || 0,
      target_date: target_date || 'Dec 2027',
      category: category || 'General',
      icon: icon || '◎'
    });
    res.status(201).json({ success: true, data: newGoal, message: 'Savings goal created.' });
  } catch (err) {
    next(err);
  }
}

async function updateGoal(req, res, next) {
  try {
    const { id } = req.params;
    const { title, target_amount, current_amount, target_date, category, icon } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (target_amount !== undefined) updateData.target_amount = Number(target_amount);
    if (current_amount !== undefined) updateData.current_amount = Number(current_amount);
    if (target_date !== undefined) updateData.target_date = target_date;
    if (category !== undefined) updateData.category = category;
    if (icon !== undefined) updateData.icon = icon;

    const updated = await supabaseService.updateGoal(req.user.id, id, updateData);
    if (!updated) return res.status(404).json({ success: false, error: 'Goal not found.' });

    res.json({ success: true, data: updated, message: 'Goal updated.' });
  } catch (err) {
    next(err);
  }
}

async function deleteGoal(req, res, next) {
  try {
    const { id } = req.params;
    await supabaseService.deleteGoal(req.user.id, id);
    res.json({ success: true, message: 'Goal removed.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getGoals,
  addGoal,
  updateGoal,
  deleteGoal
};
