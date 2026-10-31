const supabaseService = require('../services/supabase.service');
const { roundMoney } = require('../services/simulation.service');

async function getSummary(req, res, next) {
  try {
    const userId = req.user.id;
    const profile = await supabaseService.getFinancialProfile(userId);
    const goals = await supabaseService.getGoals(userId);
    const transactions = await supabaseService.getTransactions(userId);

    const monthlyIncome = Number(profile.monthly_income) || 72000;
    const monthlyExpenses = Number(profile.monthly_expenses) || 53400;
    const startingSavings = Number(profile.starting_savings) || 84250;
    const emergencyBuffer = Number(profile.emergency_buffer) || 60000;

    const monthlySurplus = roundMoney(monthlyIncome - monthlyExpenses);
    const savingsRate = monthlyIncome > 0 ? Math.round((monthlySurplus / monthlyIncome) * 100) : 0;
    const runwayMonths = monthlyExpenses > 0 ? roundMoney(startingSavings / monthlyExpenses) : 0;

    // Calculate total saved across goals
    const totalGoalsTarget = goals.reduce((acc, g) => acc + Number(g.target_amount || 0), 0);
    const totalGoalsSaved = goals.reduce((acc, g) => acc + Number(g.current_amount || 0), 0);
    const overallGoalsProgress = totalGoalsTarget > 0 ? Math.round((totalGoalsSaved / totalGoalsTarget) * 100) : 0;

    // Financial health score calculation (0 - 100)
    // Factors: savings rate (weight 40), emergency runway (weight 30), goal progress (weight 30)
    const rateScore = Math.min(40, (savingsRate / 20) * 40); // 20% savings rate = 40 pts
    const runwayScore = Math.min(30, (runwayMonths / 3) * 30); // 3+ months runway = 30 pts
    const goalScore = Math.min(30, (overallGoalsProgress / 100) * 30);
    const healthScore = Math.round(rateScore + runwayScore + goalScore);

    res.json({
      success: true,
      data: {
        profile,
        metrics: {
          startingSavings,
          monthlyIncome,
          monthlyExpenses,
          monthlySurplus,
          savingsRate,
          emergencyBuffer,
          runwayMonths,
          healthScore
        },
        goalsSummary: {
          totalGoals: goals.length,
          totalGoalsTarget,
          totalGoalsSaved,
          overallGoalsProgress
        },
        recentTransactions: transactions.slice(0, 5)
      }
    });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      monthly_income,
      monthly_expenses,
      starting_savings,
      emergency_buffer,
      currency,
      planning_style
    } = req.body;

    const updateData = {};
    if (monthly_income !== undefined) updateData.monthly_income = Number(monthly_income);
    if (monthly_expenses !== undefined) updateData.monthly_expenses = Number(monthly_expenses);
    if (starting_savings !== undefined) updateData.starting_savings = Number(starting_savings);
    if (emergency_buffer !== undefined) updateData.emergency_buffer = Number(emergency_buffer);
    if (currency !== undefined) updateData.currency = currency;
    if (planning_style !== undefined) updateData.planning_style = planning_style;

    const updated = await supabaseService.updateFinancialProfile(userId, updateData);
    res.json({ success: true, data: updated, message: 'Financial profile updated successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSummary,
  updateProfile
};
