import incomeModel from '../models/incomeModel.js';
import expenseModel from '../models/expenseModel.js';

const buildAiInsights = ({ monthlyIncome, monthlyExpense, savings, spendByCategory, recentTransactions }) => {
    const insights = [];
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailySpend = monthlyExpense > 0 ? monthlyExpense / daysInMonth : 0;
    const expenseRatio = monthlyIncome > 0 ? monthlyExpense / monthlyIncome : 0;
    const topCategory = [...spendByCategory].sort((a, b) => b.amount - a.amount)[0];

    if (monthlyIncome === 0 && monthlyExpense === 0) {
        return {
            score: 0,
            headline: 'Add a few transactions to unlock smart money insights.',
            suggestions: ['Record your next income or expense to start analyzing your spending habits.']
        };
    }

    if (savings < 0) {
        insights.push('You are spending more than you earn right now, so trimming non-essential categories would help quickly.');
    } else if (savings < monthlyIncome * 0.1) {
        insights.push('Your savings are tight, but you are still keeping a small cushion. Watch discretionary spending closely.');
    } else {
        insights.push('Your current pattern looks healthy, and your savings are growing steadily.');
    }

    if (topCategory && topCategory.amount > 0) {
        insights.push(`Your biggest expense category is ${topCategory.category}, which makes up ${Math.round((topCategory.amount / Math.max(monthlyExpense, 1)) * 100)}% of your spending.`);
    }

    if (expenseRatio > 0.7) {
        insights.push('Spending is taking up a large share of your income. Setting a tighter monthly cap could help.');
    } else if (expenseRatio > 0.4) {
        insights.push('Your spending is moderate relative to income. A simple budget review could improve consistency.');
    } else {
        insights.push('Your spending is comfortably below your income, which is a strong financial position.');
    }

    if (dailySpend > 0) {
        insights.push(`Your average daily spend is about $${dailySpend.toFixed(2)}, so pacing purchases can help keep the month on track.`);
    }

    const recentIncome = recentTransactions.filter(({ type }) => type === 'income').length;
    const recentExpense = recentTransactions.filter(({ type }) => type === 'expense').length;
    if (recentIncome > recentExpense) {
        insights.push('Recent activity shows income is picking up, which is a good sign for your savings momentum.');
    } else if (recentExpense > recentIncome) {
        insights.push('Recent activity suggests expenses are rising, so keeping a closer eye on categories can help.');
    }

    const score = Math.max(0, Math.min(100, Math.round(100 - expenseRatio * 100 + (savings > 0 ? 15 : -10))));

    return {
        score,
        headline: insights[0],
        suggestions: insights.slice(1, 4)
    };
};

export const getDashboardOverview = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        let selectedMonthStart = currentMonthStart;
        let selectedMonthEnd = currentMonthEnd;

        const currentMonthIncomes = await incomeModel.find({
            userId,
            date: {
                $gte: currentMonthStart,
                $lte: currentMonthEnd
            }
        }).lean();

        const currentMonthExpenses = await expenseModel.find({
            userId,
            date: {
                $gte: currentMonthStart,
                $lte: currentMonthEnd
            }
        }).lean();

        if (currentMonthIncomes.length === 0 && currentMonthExpenses.length === 0) {
            const latestIncome = await incomeModel.findOne({ userId }).sort({ date: -1 }).lean();
            const latestExpense = await expenseModel.findOne({ userId }).sort({ date: -1 }).lean();
            const latestDate = [latestIncome?.date, latestExpense?.date]
                .filter(Boolean)
                .sort((a, b) => new Date(b) - new Date(a))[0];

            if (latestDate) {
                selectedMonthStart = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
                selectedMonthEnd = new Date(latestDate.getFullYear(), latestDate.getMonth() + 1, 0, 23, 59, 59, 999);
            }
        }

        const incomes = await incomeModel.find({
            userId,
            date: {
                $gte: selectedMonthStart,
                $lte: selectedMonthEnd
            }
        }).lean();

        const expenses = await expenseModel.find({
            userId,
            date: {
                $gte: selectedMonthStart,
                $lte: selectedMonthEnd
            }
        }).lean();

        const monthlyIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
        const monthlyExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
        
        const savings = monthlyIncome - monthlyExpense;
        const savingRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;

        const allIncome = await incomeModel.find({ userId }).sort({ date: -1 }).lean();
        const allExpense = await expenseModel.find({ userId }).sort({ date: -1 }).lean();

        const totalIncomeSum = allIncome.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenseSum = allExpense.reduce((sum, item) => sum + item.amount, 0);
        const totalBalance = totalIncomeSum - totalExpenseSum;

        const mergedTransactions = [
            ...allIncome.map(item => ({ ...item, type: 'income' })),
            ...allExpense.map(item => ({ ...item, type: 'expense' }))
        ];
        const recentTransactions = mergedTransactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        const categoryMap = {};
        expenses.forEach(item => {
            if (categoryMap[item.category]) {
                categoryMap[item.category] += item.amount;
            } else {
                categoryMap[item.category] = item.amount;
            }
        });

        const spendByCategory = Object.keys(categoryMap).map(category => ({
            category,
            amount: categoryMap[category]
        }));

        const totalFilteredExpense = spendByCategory.reduce((sum, item) => sum + item.amount, 0);
        const expenseDistribution = spendByCategory.map(item => ({
            name: item.category,
            value: totalFilteredExpense > 0 ? (item.amount / totalFilteredExpense) * 100 : 0
        }));

        const aiInsights = buildAiInsights({
            monthlyIncome,
            monthlyExpense,
            savings,
            spendByCategory,
            recentTransactions
        });

        return res.status(200).json({
            success: true,
            data: {
                totalBalance,
                monthlyIncome,
                monthlyExpense,
                savings,
                savingRate,
                recentTransactions,
                spendByCategory,
                expenseDistribution,
                aiInsights
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};