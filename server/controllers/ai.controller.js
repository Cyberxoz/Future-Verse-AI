const geminiService = require('../services/gemini.service');
const supabaseService = require('../services/supabase.service');

async function chat(req, res, next) {
  try {
    const userId = req.user.id;
    const { message } = req.body;

    // Retrieve user's actual financial data
    const profile = await supabaseService.getFinancialProfile(userId);
    const userProfile = await supabaseService.getProfile(userId);
    const goals = await supabaseService.getGoals(userId);
    const history = await supabaseService.getChatMessages(userId);
    const recentSimulations = await supabaseService.getSimulations(userId);

    const financialContext = {
      name: userProfile?.name || 'Alex Morgan',
      monthly_income: profile.monthly_income,
      monthly_expenses: profile.monthly_expenses,
      starting_savings: profile.starting_savings,
      emergency_buffer: profile.emergency_buffer,
      currency: profile.currency || 'INR',
      goals
    };

    // Save user message in database
    await supabaseService.saveChatMessage(userId, 'user', message);

    // Call Gemini Service
    const aiResponse = await geminiService.chat({
      userMessage: message,
      history,
      financialContext,
      latestSimulation: recentSimulations[0]?.results_json || null
    });

    // Save assistant reply in database
    await supabaseService.saveChatMessage(
      userId,
      'assistant',
      aiResponse.reply,
      { actions: aiResponse.actions, simulatedInsight: aiResponse.simulatedInsight }
    );

    res.json({
      success: true,
      reply: aiResponse.reply,
      actions: aiResponse.actions || [],
      simulatedInsight: aiResponse.simulatedInsight || null,
      error: aiResponse.error || null
    });
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const messages = await supabaseService.getChatMessages(req.user.id);
    res.json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    next(err);
  }
}

async function clearHistory(req, res, next) {
  try {
    await supabaseService.clearChatMessages(req.user.id);
    res.json({ success: true, message: 'Chat history cleared successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  chat,
  getHistory,
  clearHistory
};
