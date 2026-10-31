/**
 * FutureVerse AI — Deterministic Financial Calculation Engine
 * 
 * Provides month-by-month deterministic monetary projections,
 * cash-shortage detection, goal runway impact, and parallel future comparisons.
 */

// Precise monetary rounding helper (2 decimal places)
function roundMoney(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

// Generate smooth SVG cubic bezier path string from balance points
function generateSvgPath(points, width = 600, height = 160, minY = 0, maxY = 200000) {
  if (!points || points.length === 0) return '';
  const range = maxY - minY || 1;
  const padding = 15;
  const usableH = height - padding * 2;
  
  const coords = points.map((val, idx) => {
    const x = Math.round((idx / (points.length - 1)) * width);
    // Invert Y for SVG coordinates (0 is top)
    const normalized = Math.max(0, Math.min(1, (val - minY) / range));
    const y = Math.round(height - padding - (normalized * usableH));
    return { x, y };
  });

  if (coords.length === 1) return `M0 ${coords[0].y}`;

  let path = `M${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const curr = coords[i];
    const next = coords[i + 1];
    const cpX1 = Math.round(curr.x + (next.x - curr.x) / 2);
    const cpY1 = curr.y;
    const cpX2 = Math.round(curr.x + (next.x - curr.x) / 2);
    const cpY2 = next.y;
    path += ` C${cpX1} ${cpY1} ${cpX2} ${cpY2} ${next.x} ${next.y}`;
  }
  return path;
}

/**
 * Run a single financial simulation
 * @param {Object} params
 * @param {number} params.purchaseAmount - One-time purchase in INR
 * @param {number} [params.monthlyExpenseDelta=0] - Additional monthly expense
 * @param {number} [params.incomeChangePct=0] - Income change in %
 * @param {number} [params.startingSavings=84250] - Initial savings
 * @param {number} [params.monthlyIncome=72000] - Base monthly income
 * @param {number} [params.monthlyExpenses=53400] - Base monthly expenses
 * @param {number} [params.durationMonths=6] - Projection timeline in months
 * @param {number} [params.purchaseMonth=0] - When purchase occurs (0 = now)
 * @param {number} [params.emergencyBuffer=60000] - Safety cushion threshold
 * @param {Array}  [params.goals=[]] - Active user savings goals
 */
function runSimulation({
  purchaseAmount = 0,
  monthlyExpenseDelta = 0,
  incomeChangePct = 0,
  startingSavings = 84250,
  monthlyIncome = 72000,
  monthlyExpenses = 53400,
  durationMonths = 6,
  purchaseMonth = 0,
  emergencyBuffer = 60000,
  goals = []
}) {
  const pAmount = Math.max(0, Number(purchaseAmount) || 0);
  const addlExpense = Math.max(0, Number(monthlyExpenseDelta) || 0);
  const incPct = Number(incomeChangePct) || 0;
  const startSav = Math.max(0, Number(startingSavings) || 0);
  const baseInc = Math.max(0, Number(monthlyIncome) || 0);
  const baseExp = Math.max(0, Number(monthlyExpenses) || 0);
  const duration = Math.max(1, Math.min(60, Number(durationMonths) || 6));
  const buyMonth = Math.max(0, Math.min(duration, Number(purchaseMonth) || 0));
  const buffer = Math.max(0, Number(emergencyBuffer) || (baseExp * 1.2));

  // Baseline figures
  const baselineMonthlySurplus = roundMoney(baseInc - baseExp);

  // Simulated figures
  const simulatedMonthlyIncome = roundMoney(baseInc * (1 + incPct / 100));
  const simulatedMonthlyExpenses = roundMoney(baseExp + addlExpense);
  const simulatedMonthlySurplus = roundMoney(simulatedMonthlyIncome - simulatedMonthlyExpenses);

  // Month-by-month projections
  const months = [];
  const baselineBalances = [];
  const simulatedBalances = [];

  const monthNames = ['Now', 'Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 
                      'Month 7', 'Month 8', 'Month 9', 'Month 10', 'Month 11', 'Month 12'];

  let currBaseline = startSav;
  let currSimulated = startSav;

  let minSimulatedBalance = Infinity;
  let minBalanceMonth = 0;
  let hasCashShortage = false;
  let dipsBelowBuffer = false;
  let bufferDipMonth = null;

  for (let m = 0; m <= duration; m++) {
    const label = monthNames[m] || `Month ${m}`;

    if (m === 0) {
      currBaseline = startSav;
      currSimulated = startSav;
      if (buyMonth === 0 && pAmount > 0) {
        currSimulated = roundMoney(currSimulated - pAmount);
      }
    } else {
      currBaseline = roundMoney(currBaseline + baselineMonthlySurplus);
      currSimulated = roundMoney(currSimulated + simulatedMonthlySurplus);
      if (m === buyMonth && buyMonth > 0 && pAmount > 0) {
        currSimulated = roundMoney(currSimulated - pAmount);
      }
    }

    if (currSimulated < minSimulatedBalance) {
      minSimulatedBalance = currSimulated;
      minBalanceMonth = m;
    }

    if (currSimulated < 0) {
      hasCashShortage = true;
    }

    if (currSimulated < buffer && !dipsBelowBuffer) {
      dipsBelowBuffer = true;
      bufferDipMonth = m;
    }

    baselineBalances.push(currBaseline);
    simulatedBalances.push(currSimulated);

    months.push({
      monthIndex: m,
      label,
      baselineBalance: currBaseline,
      simulatedBalance: currSimulated,
      netDifference: roundMoney(currSimulated - currBaseline)
    });
  }

  const baselineEndingBalance = baselineBalances[baselineBalances.length - 1];
  const simulatedEndingBalance = simulatedBalances[simulatedBalances.length - 1];
  const totalCost = roundMoney(pAmount + (addlExpense * duration));
  const netSavingsImpact = roundMoney(simulatedEndingBalance - baselineEndingBalance);

  // Goal runway impacts
  const goalImpacts = (goals || []).map(goal => {
    const needed = Math.max(0, (goal.target_amount || goal.target) - (goal.current_amount || goal.current || 0));
    const baseMonthsToGoal = baselineMonthlySurplus > 0 ? Math.ceil(needed / baselineMonthlySurplus) : 999;
    const simMonthsToGoal = simulatedMonthlySurplus > 0 ? Math.ceil(needed / simulatedMonthlySurplus) : 999;
    const delayMonths = Math.max(0, simMonthsToGoal - baseMonthsToGoal);

    return {
      title: goal.title,
      targetAmount: goal.target_amount || goal.target,
      currentAmount: goal.current_amount || goal.current || 0,
      baselineMonthsToComplete: baseMonthsToGoal,
      simulatedMonthsToComplete: simMonthsToGoal,
      delayMonths,
      delayed: delayMonths > 0
    };
  });

  // Calculate SVG scale
  const allBalances = [...baselineBalances, ...simulatedBalances];
  const globalMin = Math.min(...allBalances, 0);
  const globalMax = Math.max(...allBalances, startSav + 20000);
  const baselineSvgPath = generateSvgPath(baselineBalances, 600, 160, globalMin, globalMax);
  const simulatedSvgPath = generateSvgPath(simulatedBalances, 600, 160, globalMin, globalMax);

  // Twin insight summary
  let insightTone = 'positive';
  let insightText = '';

  if (hasCashShortage) {
    insightTone = 'critical';
    insightText = `Warning: This scenario results in a cash shortage around ${monthNames[minBalanceMonth] || `Month ${minBalanceMonth}`} (₹${minSimulatedBalance.toLocaleString('en-IN')}). Consider delaying the purchase or adjusting expenses.`;
  } else if (dipsBelowBuffer) {
    insightTone = 'caution';
    insightText = `Manageable with trade-offs: Your balance drops below your ₹${buffer.toLocaleString('en-IN')} emergency buffer around ${monthNames[bufferDipMonth] || `Month ${bufferDipMonth}`}, but stays positive at ₹${minSimulatedBalance.toLocaleString('en-IN')}.`;
  } else {
    insightTone = 'positive';
    insightText = `Safe and sustainable: Buying now keeps you comfortably above your ₹${buffer.toLocaleString('en-IN')} safety net with an ending balance of ₹${simulatedEndingBalance.toLocaleString('en-IN')}.`;
  }

  return {
    inputs: {
      purchaseAmount: pAmount,
      monthlyExpenseDelta: addlExpense,
      incomeChangePct: incPct,
      startingSavings: startSav,
      monthlyIncome: baseInc,
      monthlyExpenses: baseExp,
      durationMonths: duration,
      purchaseMonth: buyMonth,
      emergencyBuffer: buffer
    },
    surplus: {
      baselineMonthlySurplus,
      simulatedMonthlySurplus,
      surplusDelta: roundMoney(simulatedMonthlySurplus - baselineMonthlySurplus)
    },
    projections: {
      months,
      baselineEndingBalance,
      simulatedEndingBalance,
      netSavingsImpact,
      minSimulatedBalance,
      minBalanceMonth,
      hasCashShortage,
      dipsBelowBuffer,
      bufferDipMonth
    },
    goalImpacts,
    charts: {
      baselineSvgPath,
      simulatedSvgPath,
      minY: globalMin,
      maxY: globalMax
    },
    insight: {
      tone: insightTone,
      message: insightText
    }
  };
}

/**
 * Compare Parallel Futures (A, B, C)
 * Scenario A: Buy immediately (Month 0)
 * Scenario B: Wait 3 months (Month 3)
 * Scenario C: Save for 6 months (Postpone or Month 6)
 */
function compareParallelFutures(baseParams) {
  const purchaseAmount = Math.max(0, Number(baseParams.purchaseAmount) || 50000);
  const duration = Math.max(6, Number(baseParams.durationMonths) || 6);

  // Future A: Buy Now (Month 0)
  const futureA = runSimulation({
    ...baseParams,
    purchaseAmount,
    durationMonths: duration,
    purchaseMonth: 0
  });

  // Future B: Wait 3 Months (Month 3)
  const futureB = runSimulation({
    ...baseParams,
    purchaseAmount,
    durationMonths: duration,
    purchaseMonth: 3
  });

  // Future C: Postpone for 6 Months (Purchase is postponed beyond the 6-month window)
  const futureC = runSimulation({
    ...baseParams,
    purchaseAmount: 0, // Postponed: cost not deducted during these 6 months
    durationMonths: duration,
    purchaseMonth: 0
  });

  // Global scale for comparison chart
  const allSim = [
    ...futureA.projections.months.map(m => m.simulatedBalance),
    ...futureB.projections.months.map(m => m.simulatedBalance),
    ...futureC.projections.months.map(m => m.simulatedBalance)
  ];
  const gMin = Math.min(...allSim, 0);
  const gMax = Math.max(...allSim, (Number(baseParams.startingSavings) || 84250) + 50000);

  const pathA = generateSvgPath(futureA.projections.months.map(m => m.simulatedBalance), 700, 180, gMin, gMax);
  const pathB = generateSvgPath(futureB.projections.months.map(m => m.simulatedBalance), 700, 180, gMin, gMax);
  const pathC = generateSvgPath(futureC.projections.months.map(m => m.simulatedBalance), 700, 180, gMin, gMax);

  return {
    purchaseAmount,
    durationMonths: duration,
    scenarios: {
      futureA: {
        id: 'futureA',
        name: 'Future A',
        title: 'Buy immediately',
        purchaseMonth: 0,
        purchaseTimingDesc: 'Month 0 (Now)',
        isCostIncludedInEndingBalance: true,
        projectedSavings: futureA.projections.simulatedEndingBalance,
        minBalance: futureA.projections.minSimulatedBalance,
        dipsBelowBuffer: futureA.projections.dipsBelowBuffer,
        hasCashShortage: futureA.projections.hasCashShortage,
        tag: 'Immediate Outflow',
        badge: 'Scenario A',
        tradeoff: futureA.projections.dipsBelowBuffer 
          ? 'Cost deducted now. Balance temporarily approaches safety buffer but recovers steadily.'
          : 'Cost deducted now. Comfortable safety buffer maintained throughout.',
        copy: 'Buying now fulfills immediate needs. Ending balance includes the full ₹' + purchaseAmount.toLocaleString('en-IN') + ' cost.',
        months: futureA.projections.months,
        svgPath: pathA
      },
      futureB: {
        id: 'futureB',
        name: 'Future B',
        title: 'Wait 3 months',
        purchaseMonth: 3,
        purchaseTimingDesc: 'Month 3',
        isCostIncludedInEndingBalance: true,
        projectedSavings: futureB.projections.simulatedEndingBalance,
        minBalance: futureB.projections.minSimulatedBalance,
        dipsBelowBuffer: futureB.projections.dipsBelowBuffer,
        hasCashShortage: futureB.projections.hasCashShortage,
        tag: 'Balanced Cushion',
        badge: 'Recommended',
        tradeoff: 'Allows 3 months of buffer accumulation before the purchase is deducted at Month 3.',
        copy: 'A 3-month wait cushions your cash flow. Ending balance includes the purchase cost after 3 months of savings.',
        months: futureB.projections.months,
        svgPath: pathB
      },
      futureC: {
        id: 'futureC',
        name: 'Future C',
        title: 'Postpone for 6 months',
        purchaseMonth: 6,
        purchaseTimingDesc: 'Postponed beyond 6 months',
        isCostIncludedInEndingBalance: false,
        projectedSavings: futureC.projections.simulatedEndingBalance,
        minBalance: futureC.projections.minSimulatedBalance,
        dipsBelowBuffer: futureC.projections.dipsBelowBuffer,
        hasCashShortage: futureC.projections.hasCashShortage,
        tag: 'Maximum Security',
        badge: 'Scenario C',
        tradeoff: 'Purchase postponed. 100% of 6-month savings growth preserved with zero cash risk.',
        copy: 'Postponing allows your savings to reach full potential. Ending balance does NOT deduct purchase cost.',
        months: futureC.projections.months,
        svgPath: pathC
      }
    },
    comparisonChart: {
      pathA,
      pathB,
      pathC,
      minY: gMin,
      maxY: gMax
    }
  };
}

module.exports = {
  runSimulation,
  compareParallelFutures,
  roundMoney
};
