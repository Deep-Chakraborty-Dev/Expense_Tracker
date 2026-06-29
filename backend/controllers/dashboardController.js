import incomeModel from '../models/incomeModel.js';
import expenseModel from '../models/expenseModel.js';

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
                expenseDistribution
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