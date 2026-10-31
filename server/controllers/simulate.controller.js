const simulationService = require('../services/simulation.service');
const supabaseService = require('../services/supabase.service');

async function runSimulation(req, res, next) {
  try {
    const userId = req.user.id;
    const profile = await supabaseService.getFinancialProfile(userId);
    const goals = await supabaseService.getGoals(userId);

    const {
      purchaseAmount = 50000,
      monthlyExpenseDelta = 0,
      incomeChangePct = 0,
      durationMonths = 6,
      purchaseMonth = 0,
      startingSavings,
      monthlyIncome,
      monthlyExpenses,
      emergencyBuffer
    } = req.body;

    const simResult = simulationService.runSimulation({
      purchaseAmount: Number(purchaseAmount),
      monthlyExpenseDelta: Number(monthlyExpenseDelta),
      incomeChangePct: Number(incomeChangePct),
      startingSavings: startingSavings !== undefined ? Number(startingSavings) : Number(profile.starting_savings),
      monthlyIncome: monthlyIncome !== undefined ? Number(monthlyIncome) : Number(profile.monthly_income),
      monthlyExpenses: monthlyExpenses !== undefined ? Number(monthlyExpenses) : Number(profile.monthly_expenses),
      emergencyBuffer: emergencyBuffer !== undefined ? Number(emergencyBuffer) : Number(profile.emergency_buffer),
      durationMonths: Number(durationMonths) || 6,
      purchaseMonth: Number(purchaseMonth) || 0,
      goals
    });

    // Save simulation record for user
    await supabaseService.saveSimulation(userId, {
      name: `Purchase Simulation ₹${Number(purchaseAmount).toLocaleString('en-IN')}`,
      purchase_amount: Number(purchaseAmount),
      monthly_expense_delta: Number(monthlyExpenseDelta),
      income_change_pct: Number(incomeChangePct),
      duration_months: Number(durationMonths) || 6,
      purchase_month: Number(purchaseMonth) || 0,
      results_json: simResult
    });

    res.json({
      success: true,
      data: simResult
    });
  } catch (err) {
    next(err);
  }
}

async function compareParallelFutures(req, res, next) {
  try {
    const userId = req.user.id;
    const profile = await supabaseService.getFinancialProfile(userId);
    const goals = await supabaseService.getGoals(userId);

    const {
      purchaseAmount = 50000,
      monthlyExpenseDelta = 0,
      incomeChangePct = 0,
      durationMonths = 6,
      startingSavings,
      monthlyIncome,
      monthlyExpenses,
      emergencyBuffer
    } = req.body;

    const comparison = simulationService.compareParallelFutures({
      purchaseAmount: Number(purchaseAmount),
      monthlyExpenseDelta: Number(monthlyExpenseDelta),
      incomeChangePct: Number(incomeChangePct),
      durationMonths: Number(durationMonths) || 6,
      startingSavings: startingSavings !== undefined ? Number(startingSavings) : Number(profile.starting_savings),
      monthlyIncome: monthlyIncome !== undefined ? Number(monthlyIncome) : Number(profile.monthly_income),
      monthlyExpenses: monthlyExpenses !== undefined ? Number(monthlyExpenses) : Number(profile.monthly_expenses),
      emergencyBuffer: emergencyBuffer !== undefined ? Number(emergencyBuffer) : Number(profile.emergency_buffer),
      goals
    });

    res.json({
      success: true,
      data: comparison
    });
  } catch (err) {
    next(err);
  }
}

async function getSimulationHistory(req, res, next) {
  try {
    const list = await supabaseService.getSimulations(req.user.id);
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  runSimulation,
  compareParallelFutures,
  getSimulationHistory
};
