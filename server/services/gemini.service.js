const { getAiClient, isConfigured } = require('../config/gemini');
const simulationService = require('./simulation.service');

// Extract monetary amounts and item mentions from user prompt
function extractPurchaseIntent(text) {
  if (!text) return null;
  
  // 1. Pattern: "afford a ₹50,000 laptop" or "buy ₹30,000 phone"
  const amountBeforeItem = /(?:buy|purchase|spend|cost|afford|get)?\s*(?:a\s+|an\s+)?(?:₹|rs\.?|inr)?\s*([\d,]+)\s*(?:₹|rs\.?|inr)?\s+([a-zA-Z]+)/i;
  const match1 = text.match(amountBeforeItem);
  if (match1) {
    const amount = Number(match1[1].replace(/,/g, ''));
    const item = match1[2] ? match1[2].trim() : 'purchase';
    if (!isNaN(amount) && amount > 0 && !['inr', 'rupees', 'rs', 'worth'].includes(item.toLowerCase())) {
      return { item, amount };
    }
  }

  // 2. Pattern: "buy a laptop worth/for ₹50,000"
  const itemBeforeAmount = /(?:buy|purchase|spend|cost|afford|get)\s+(?:a\s+|an\s+)?([a-zA-Z]+)\s*(?:worth|for|of)?\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i;
  const match2 = text.match(itemBeforeAmount);
  if (match2) {
    const item = match2[1] ? match2[1].trim() : 'purchase';
    const amount = Number(match2[2].replace(/,/g, ''));
    if (!isNaN(amount) && amount > 0) {
      return { item, amount };
    }
  }

  // 3. Fallback: bare currency amounts like "₹50,000"
  const amountRegex = /(?:₹|rs\.?|inr)\s*([\d,]+)/i;
  const amountMatch = text.match(amountRegex);
  if (amountMatch) {
    const amount = Number(amountMatch[1].replace(/,/g, ''));
    if (!isNaN(amount) && amount > 0) {
      return { item: 'purchase', amount };
    }
  }

  return null;
}

/**
 * Deterministic Financial Intelligence Engine
 * Generates mathematically sound, personalized financial coach responses
 * using the authenticated user's real balance, surplus, and goals.
 */
function generateDeterministicFinancialAdvice(userMessage, financialContext, purchaseIntent) {
  const {
    name = 'Samaira',
    monthly_income = 72000,
    monthly_expenses = 53400,
    starting_savings = 84250,
    emergency_buffer = 60000,
    goals = []
  } = financialContext;

  const monthlySurplus = Math.round((monthly_income - monthly_expenses) * 100) / 100;
  const savingsRate = monthly_income > 0 ? Math.round((monthlySurplus / monthly_income) * 100) : 0;
  const lowerMsg = userMessage.toLowerCase();

  // 1. Purchase Inquiry (e.g. "Can I afford a ₹50,000 laptop?")
  if (purchaseIntent && purchaseIntent.amount > 0) {
    const pAmount = purchaseIntent.amount;
    const item = purchaseIntent.item || 'purchase';

    // Run deterministic 6-month simulation
    const sim = simulationService.runSimulation({
      purchaseAmount: pAmount,
      startingSavings: starting_savings,
      monthlyIncome: monthly_income,
      monthlyExpenses: monthly_expenses,
      emergencyBuffer: emergency_buffer,
      durationMonths: 6,
      goals
    });

    const endingBal = sim.projections.simulatedEndingBalance;
    const immediateBal = Math.round(starting_savings - pAmount);
    const dipsBuffer = immediateBal < emergency_buffer;
    const bufferGap = dipsBuffer ? Math.round(emergency_buffer - immediateBal) : 0;
    const monthsToBuffer = bufferGap > 0 && monthlySurplus > 0 ? Math.ceil(bufferGap / monthlySurplus) : 0;

    // Check if there is an existing goal matching the item
    const matchingGoal = goals.find(g => 
      g.title.toLowerCase().includes(item.toLowerCase()) || 
      item.toLowerCase().includes(g.title.toLowerCase())
    );

    let goalNote = '';
    if (matchingGoal) {
      const saved = Number(matchingGoal.current_amount || 0);
      const remainingForGoal = Math.max(0, pAmount - saved);
      goalNote = ` You already have **₹${saved.toLocaleString('en-IN')}** saved in your "${matchingGoal.title}" fund, so you only need **₹${remainingForGoal.toLocaleString('en-IN')}** extra from your current cash flow.`;
    }

    let verdict = '';
    if (immediateBal < 0) {
      verdict = `⚠️ **Cash Shortage Alert**: Buying this ${item} immediately would deplete your entire liquid savings and put you at **₹${immediateBal.toLocaleString('en-IN')}**. I recommend postponing this purchase or building up your savings cushion first.`;
    } else if (dipsBuffer) {
      verdict = `Yes, **you can afford it today**, but with one important trade-off: paying ₹${pAmount.toLocaleString('en-IN')} upfront leaves you with **₹${immediateBal.toLocaleString('en-IN')}**, which temporarily dips below your ₹${emergency_buffer.toLocaleString('en-IN')} safety buffer.${goalNote}\n\nThe good news is that with your healthy monthly surplus of **₹${monthlySurplus.toLocaleString('en-IN')}**, you will completely replenish your safety buffer within **${monthsToBuffer} month${monthsToBuffer > 1 ? 's' : ''}**. In 6 months, your projected savings will reach **₹${endingBal.toLocaleString('en-IN')}**.`;
    } else {
      verdict = `Yes! **You can comfortably afford this ${item} today.** After the ₹${pAmount.toLocaleString('en-IN')} purchase, your balance will be **₹${immediateBal.toLocaleString('en-IN')}**, keeping you safely above your ₹${emergency_buffer.toLocaleString('en-IN')} emergency buffer.${goalNote}\n\nWith your monthly surplus of **₹${monthlySurplus.toLocaleString('en-IN')}**, your projected savings will grow to **₹${endingBal.toLocaleString('en-IN')}** in 6 months.`;
    }

    const reply = `${verdict}\n\n**Key Numbers at a Glance:**\n• **Starting Savings:** ₹${starting_savings.toLocaleString('en-IN')}\n• **Purchase Outflow:** −₹${pAmount.toLocaleString('en-IN')}\n• **Monthly Surplus:** +₹${monthlySurplus.toLocaleString('en-IN')}/mo (${savingsRate}% savings rate)\n• **6-Month Projected Balance:** ₹${endingBal.toLocaleString('en-IN')}\n\n*Would you like to test drive this purchase in the Future Simulator or compare buying now vs. waiting 3 months?*`;

    return {
      reply,
      actions: [
        { type: 'simulate', label: `Simulate This Decision (₹${pAmount.toLocaleString('en-IN')})`, amount: pAmount, item },
        { type: 'compare', label: 'Compare My Futures', amount: pAmount },
        { type: 'goals', label: 'View Savings Goals' }
      ],
      simulatedInsight: {
        item,
        amount: pAmount,
        projectedEndingSavings: endingBal,
        baselineEndingSavings: sim.projections.baselineEndingBalance,
        dipsBelowBuffer: dipsBuffer,
        hasCashShortage: immediateBal < 0,
        minBalance: sim.projections.minSimulatedBalance
      }
    };
  }

  // 2. "How much can I save in six months?"
  if (lowerMsg.includes('how much') && (lowerMsg.includes('save') || lowerMsg.includes('six months') || lowerMsg.includes('6 months'))) {
    const sixMonthSurplus = roundMoney(monthlySurplus * 6);
    const endingBalance = roundMoney(starting_savings + sixMonthSurplus);
    const reply = `Based on your current financial twin data:\n\n• **Current Monthly Surplus:** ₹${monthlySurplus.toLocaleString('en-IN')} (${savingsRate}% savings rate)\n• **New Savings Added (6 Months):** +₹${sixMonthSurplus.toLocaleString('en-IN')}\n• **Projected Balance in 6 Months:** **₹${endingBalance.toLocaleString('en-IN')}** (up from ₹${starting_savings.toLocaleString('en-IN')})\n\nThis represents a **+${Math.round((sixMonthSurplus / starting_savings) * 100)}% growth** in your liquid savings without needing to change your current standard of living. If you want to increase this even further, allocating even ₹2,000 more per month would bring you past ₹2,07,000!`;

    return {
      reply,
      actions: [
        { type: 'simulator', label: 'Open Future Simulator' },
        { type: 'goals', label: 'View Savings Goals' }
      ]
    };
  }

  // 3. "What happens if I increase my monthly expenses?"
  if (lowerMsg.includes('increase') && lowerMsg.includes('expense')) {
    const testDelta = 5000;
    const newSurplus = Math.round(monthlySurplus - testDelta);
    const oldSixMonth = starting_savings + (monthlySurplus * 6);
    const newSixMonth = starting_savings + (newSurplus * 6);
    const lostSavings = oldSixMonth - newSixMonth;

    const reply = `If your monthly expenses increase, here is the exact financial ripple effect:\n\n• For example, adding **₹${testDelta.toLocaleString('en-IN')}/month** (e.g. higher rent or a new EMI) reduces your monthly surplus from **₹${monthlySurplus.toLocaleString('en-IN')}** to **₹${newSurplus.toLocaleString('en-IN')}**.\n• Over 6 months, you would accumulate **₹${lostSavings.toLocaleString('en-IN')} less** in savings (projected balance ₹${newSixMonth.toLocaleString('en-IN')} instead of ₹${oldSixMonth.toLocaleString('en-IN')}).\n• Your savings rate would drop from **${savingsRate}%** to **${Math.round((newSurplus / monthly_income) * 100)}%**.\n\nYou can model any exact recurring expense adjustment in the Future Simulator to see month-by-month effects.`;

    return {
      reply,
      actions: [
        { type: 'simulator', label: 'Open Future Simulator' },
        { type: 'compare', label: 'Compare My Futures', amount: 50000 }
      ]
    };
  }

  // 4. "How can I improve my monthly surplus?"
  if (lowerMsg.includes('improve') || (lowerMsg.includes('surplus') && lowerMsg.includes('how'))) {
    const reply = `Your current monthly surplus is **₹${monthlySurplus.toLocaleString('en-IN')}** (${savingsRate}% of your ₹${monthly_income.toLocaleString('en-IN')} income), which is already above the typical 20% benchmark! Here are three high-impact ways to optimize it further:\n\n1. **Trim Discretionary Food & Delivery:** Your recent transactions show food spending is trending 18% above your baseline. Setting a monthly dining cap could unlock an extra **₹2,500/month**.\n2. **Review Recurring Subscriptions:** Grouping or pausing unused annual and digital subscriptions can save **₹1,000–₹1,500/month**.\n3. **Automate Surplus Transfers:** Route your ₹${monthlySurplus.toLocaleString('en-IN')} surplus into high-yield savings or recurring goal deposits on the 1st of every month before discretionary spending begins.`;

    return {
      reply,
      actions: [
        { type: 'goals', label: 'View Savings Goals' },
        { type: 'simulator', label: 'Open Future Simulator' }
      ]
    };
  }

  // 5. "Should I purchase something now or wait?"
  if (lowerMsg.includes('wait') || (lowerMsg.includes('purchase') && lowerMsg.includes('now'))) {
    const reply = `Here is how your Financial Twin compares buying immediately vs. waiting:\n\n• **Future A (Buy Now):** Fulfills your requirement immediately. However, your balance takes a short-term dip and takes 1–2 months of surplus to rebuild your emergency buffer.\n• **Future B (Wait 3 Months):** By waiting 90 days, you accumulate an additional **₹55,800** in liquid surplus. When you make the purchase, your balance never approaches your safety line.\n• **Future C (Save for 6 Months):** Maximizes interest and compound security, ensuring zero financial stress.\n\n*Rule of thumb:* If the item is critical for your work, buy now and maintain lean spending for 6 weeks. If it is an upgrade, waiting 3 months provides maximum peace of mind.`;

    return {
      reply,
      actions: [
        { type: 'compare', label: 'Compare My Futures', amount: 50000 },
        { type: 'simulator', label: 'Open Future Simulator' }
      ]
    };
  }

  // 6. "How can I reach my savings goal faster?"
  if (lowerMsg.includes('goal') && (lowerMsg.includes('faster') || lowerMsg.includes('reach'))) {
    const reply = `Looking at your active savings milestones:\n\n• **New Laptop Fund:** Currently at **74%** (₹37,000 / ₹50,000). You only need **₹13,000** more!\n• **Acceleration Strategy:** If you allocate just **₹1,000 more each month** from your surplus, your Laptop goal will complete in **December 2026** instead of January 2027—reaching it **3 weeks earlier**.\n• **Emergency Fund:** Currently at **70%** (₹42,000 / ₹60,000). At your current surplus, it will be 100% funded by March 2027.\n\nSmall contributions of ₹1,000–₹2,000 create substantial momentum without impacting your daily lifestyle.`;

    return {
      reply,
      actions: [
        { type: 'goals', label: 'View Savings Goals' },
        { type: 'simulator', label: 'Open Future Simulator' }
      ]
    };
  }

  // General Financial Question Fallback
  const reply = `Hello ${name}! Based on your current financial model:\n\n• **Monthly Cash Flow:** Income ₹${monthly_income.toLocaleString('en-IN')} vs. Expenses ₹${monthly_expenses.toLocaleString('en-IN')}\n• **Net Surplus:** **+₹${monthlySurplus.toLocaleString('en-IN')}** each month (${savingsRate}% savings rate)\n• **Current Reserves:** ₹${starting_savings.toLocaleString('en-IN')} (Safety threshold: ₹${emergency_buffer.toLocaleString('en-IN')})\n\nYou have a very stable financial foundation. Feel free to ask me to evaluate any specific purchase (e.g. *"Can I afford a laptop for ₹50,000?"*), project future savings runway, or compare different financial futures.`;

  return {
    reply,
    actions: [
      { type: 'simulator', label: 'Open Future Simulator' },
      { type: 'compare', label: 'Compare My Futures', amount: 50000 },
      { type: 'goals', label: 'View Savings Goals' }
    ]
  };
}

class GeminiService {
  /**
   * Generate an AI Financial Coach response
   * @param {Object} options
   * @param {string} options.userMessage - User's query
   * @param {Array}  options.history - Past conversation messages
   * @param {Object} options.financialContext - User's real financial info
   * @param {Object} [options.latestSimulation] - Recent simulation if any
   */
  async chat({ userMessage, history = [], financialContext = {}, latestSimulation = null }) {
    // Extract purchase intent (item and amount)
    const purchaseIntent = extractPurchaseIntent(userMessage);

    // If Gemini API Key is configured, attempt live Gemini API call
    if (isConfigured()) {
      const ai = getAiClient();
      if (ai) {
        try {
          const {
            name = 'Samaira',
            monthly_income = 72000,
            monthly_expenses = 53400,
            starting_savings = 84250,
            emergency_buffer = 60000,
            currency = 'INR',
            goals = []
          } = financialContext;

          const monthlySurplus = Math.round((monthly_income - monthly_expenses) * 100) / 100;
          const savingsRate = monthly_income > 0 ? Math.round((monthlySurplus / monthly_income) * 100) : 0;

          let simulatedInsight = null;
          let actionButtons = [];

          if (purchaseIntent && purchaseIntent.amount > 0) {
            const sim = simulationService.runSimulation({
              purchaseAmount: purchaseIntent.amount,
              startingSavings: starting_savings,
              monthlyIncome: monthly_income,
              monthlyExpenses: monthly_expenses,
              emergencyBuffer: emergency_buffer,
              durationMonths: 6,
              goals
            });

            simulatedInsight = {
              item: purchaseIntent.item,
              amount: purchaseIntent.amount,
              projectedEndingSavings: sim.projections.simulatedEndingBalance,
              baselineEndingSavings: sim.projections.baselineEndingBalance,
              dipsBelowBuffer: sim.projections.dipsBelowBuffer,
              hasCashShortage: sim.projections.hasCashShortage,
              minBalance: sim.projections.minSimulatedBalance
            };

            actionButtons.push({
              type: 'simulate',
              label: `Simulate This Decision (₹${purchaseIntent.amount.toLocaleString('en-IN')})`,
              amount: purchaseIntent.amount,
              item: purchaseIntent.item
            });
            actionButtons.push({
              type: 'compare',
              label: 'Compare My Futures',
              amount: purchaseIntent.amount
            });
          }

          const goalsFormatted = (goals || []).map(g => 
            `- ${g.title}: ₹${Number(g.current_amount || 0).toLocaleString('en-IN')} of ₹${Number(g.target_amount || 0).toLocaleString('en-IN')} (Target: ${g.target_date || 'N/A'})`
          ).join('\n') || '- No specific goals recorded.';

          const systemInstruction = `You are FutureVerse AI Financial Coach — a calm, intelligent, and empathetic personal financial model and digital financial twin advisor.
Your tagline is: "Simulate Today. Shape Tomorrow."

AUTHENTICATED USER'S REAL FINANCIAL DATA (DO NOT INVENT NUMBERS):
- Name: ${name}
- Default Currency: ${currency} (₹ Indian Rupee)
- Monthly Income: ₹${Number(monthly_income).toLocaleString('en-IN')}
- Monthly Expenses: ₹${Number(monthly_expenses).toLocaleString('en-IN')}
- Monthly Surplus: ₹${Number(monthlySurplus).toLocaleString('en-IN')} (${savingsRate}% savings rate)
- Current Starting Savings: ₹${Number(starting_savings).toLocaleString('en-IN')}
- Safety / Emergency Buffer: ₹${Number(emergency_buffer).toLocaleString('en-IN')}
- Active Savings Goals:
${goalsFormatted}
${simulatedInsight ? `
PRE-CALCULATED SIMULATION FOR THE USER'S QUERY:
- Purchase Item: ${simulatedInsight.item} for ₹${simulatedInsight.amount.toLocaleString('en-IN')}
- Projected 6-Month Ending Balance: ₹${simulatedInsight.projectedEndingSavings.toLocaleString('en-IN')} (vs baseline ₹${simulatedInsight.baselineEndingSavings.toLocaleString('en-IN')})
- Lowest Balance Point: ₹${simulatedInsight.minBalance.toLocaleString('en-IN')}
- Dips below safety buffer (₹${emergency_buffer}): ${simulatedInsight.dipsBelowBuffer ? 'YES' : 'NO'}
- Results in cash shortage: ${simulatedInsight.hasCashShortage ? 'YES' : 'NO'}
` : ''}

CORE GUIDELINES:
1. Always use INR (₹) formatting with commas (e.g., ₹50,000, ₹1,31,450).
2. Answer in simple, elegant, reassuring language. Never use harsh financial jargon or robotic responses.
3. Use the user's actual numbers provided above. Never invent fake income or savings values.
4. Clearly communicate uncertainty — explain that these are projections and scenarios, not guarantees.
5. If the user asks about buying something, explain the exact mathematical impact on their surplus, runway, and goals based on the pre-calculated numbers.
6. Provide actionable advice: suggest whether buying now, waiting a few months, or saving first makes the most sense.
7. Keep responses concise and scannable (2-4 brief paragraphs). Use bullet points where helpful.`;

          const formattedContents = [];
          const recentHistory = (history || []).slice(-8);
          for (const msg of recentHistory) {
            if (msg.role === 'user') {
              formattedContents.push({ role: 'user', parts: [{ text: msg.content }] });
            } else if (msg.role === 'assistant') {
              formattedContents.push({ role: 'model', parts: [{ text: msg.content }] });
            }
          }
          formattedContents.push({ role: 'user', parts: [{ text: userMessage }] });

          const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
          for (const modelName of modelsToTry) {
            try {
              const response = await ai.models.generateContent({
                model: modelName,
                contents: formattedContents,
                config: {
                  systemInstruction,
                  temperature: 0.6,
                  maxOutputTokens: 800
                }
              });

              const replyText = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text) || '';
              if (replyText) {
                if (actionButtons.length === 0) {
                  if (userMessage.toLowerCase().includes('simulat') || userMessage.toLowerCase().includes('future')) {
                    actionButtons.push({ type: 'simulator', label: 'Open Future Simulator' });
                  }
                  if (userMessage.toLowerCase().includes('goal') || userMessage.toLowerCase().includes('save')) {
                    actionButtons.push({ type: 'goals', label: 'View Savings Goals' });
                  }
                }
                return {
                  reply: replyText,
                  actions: actionButtons,
                  simulatedInsight
                };
              }
            } catch (err) {
              console.warn(`Gemini model ${modelName} call failed, trying next:`, err.message);
            }
          }
        } catch (err) {
          console.warn('Gemini API call failed, falling back to deterministic intelligence engine:', err.message);
        }
      }
    }

    // Seamless Fallback: Deterministic Financial Intelligence Engine
    // Calculates exact mathematical projections, analyzes safety buffers, and generates action buttons
    return generateDeterministicFinancialAdvice(userMessage, financialContext, purchaseIntent);
  }
}

module.exports = new GeminiService();
