import expenseModel from '../models/expenseModel.js';
import getDateRange from '../utils/dateFilter.js';
import xlsx from 'xlsx';

export const addExpense = async (req, res) => {
    try {
        const userId = req.user.id;
        const { description, amount, category, date } = req.body;

        if (!description || !amount || !category || !date) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        const newExpense = new expenseModel({
            userId,
            description,
            amount: parseFloat(amount),
            category,
            date: new Date(date)
        });

        await newExpense.save();
        return res.status(201).json({ 
            success: true, 
            message: 'Expense added successfully' 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllExpense = async (req, res) => {
    try {
        const userId = req.user.id;
        const expense = await expenseModel.find({ userId }).sort({ date: -1 });
        return res.status(200).json(expense);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { description, amount, category, date } = req.body;

        const updatedExpense = await expenseModel.findOneAndUpdate(
            { _id: id, userId },
            { 
                description, 
                amount: amount ? parseFloat(amount) : undefined, 
                category, 
                date 
            },
            { new: true, runValidators: true }
        );

        if (!updatedExpense) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Expense updated successfully', 
            data: updatedExpense 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const expense = await expenseModel.findOneAndDelete({ _id: id, userId });

        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }

        return res.status(200).json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const downloadExpenseExcel = async (req, res) => {
    try {
        const userId = req.user.id;
        const expense = await expenseModel.find({ userId }).sort({ date: -1 });

        const plainData = expense.map(exp => ({
            Description: exp.description,
            Amount: exp.amount,
            Category: exp.category,
            Date: new Date(exp.date).toLocaleDateString('en-US')
        }));

        const worksheet = xlsx.utils.json_to_sheet(plainData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Expense Details');

        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        const fileName = `expense_detail_${Date.now()}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        return res.send(buffer);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getExpenseOverview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { range = 'monthly' } = req.query;

        const { start, end } = getDateRange(range);

        const expense = await expenseModel.find({
            userId,
            date: { $gte: start, $lte: end }
        }).sort({ date: -1 });

        const totalExpense = expense.reduce((sum, item) => sum + item.amount, 0);
        const numTransactions = expense.length;
        const averageExpense = numTransactions > 0 ? totalExpense / numTransactions : 0;
        const recentTransactions = expense.slice(0, 5);

        return res.status(200).json({
            success: true,
            range,
            data: {
                totalExpense,
                averageExpense,
                numTransactions,
                recentTransactions
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};