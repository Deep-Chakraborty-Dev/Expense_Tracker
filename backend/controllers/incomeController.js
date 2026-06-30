import incomeModel from '../models/incomeModel.js';
import xlsx from 'xlsx';
import getDateRange from '../utils/dateFilter.js';

const parseAmount = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

export async function addIncome(req, res) {
    const userId = req.user.id;
    const { description, amount, category, date } = req.body;

    try {
        if (!description || amount === undefined || !category || !date) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const parsedAmount = parseAmount(amount);
        if (parsedAmount === null || parsedAmount < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }

        const newIncome = new incomeModel({
            userId,
            description,
            amount: parsedAmount,
            category,
            date: new Date(date)
        });

        await newIncome.save();
        return res.status(201).json({
            success: true,
            message: 'Income added successfully'
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

export async function getAllIncome(req, res) {
    const userId = req.user.id;

    try {
        const income = await incomeModel.find({ userId }).sort({ date: -1 });
        return res.status(200).json(income);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

export async function updateIncome(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const { description, amount, category, date } = req.body;

    try {
        const updateData = {};

        if (description !== undefined) updateData.description = description;
        if (category !== undefined) updateData.category = category;
        if (date !== undefined) updateData.date = new Date(date);

        if (amount !== undefined) {
            const parsedAmount = parseAmount(amount);
            if (parsedAmount === null || parsedAmount < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid amount is required'
                });
            }
            updateData.amount = parsedAmount;
        }

        const updatedIncome = await incomeModel.findOneAndUpdate(
            { _id: id, userId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedIncome) {
            return res.status(404).json({
                success: false,
                message: 'Income not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Income updated successfully',
            data: updatedIncome
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

export async function deleteIncome(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const income = await incomeModel.findOneAndDelete({ _id: id, userId });

        if (!income) {
            return res.status(404).json({
                success: false,
                message: 'Income not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Income deleted successfully'
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

export async function getIncomeOverview(req, res) {
    try {
        const userId = req.user.id;
        const { range = 'monthly' } = req.query;
        const { start, end } = getDateRange(range);

        const income = await incomeModel.find({
            userId,
            date: { $gte: start, $lte: end }
        }).sort({ date: -1 });

        const totalIncome = income.reduce((acc, cur) => acc + cur.amount, 0);
        const averageIncome = income.length > 0 ? totalIncome / income.length : 0;
        const numberOfTransactions = income.length;
        const recentTransactions = income.slice(0, 9);

        return res.status(200).json({
            success: true,
            data: {
                totalIncome,
                averageIncome,
                numberOfTransactions,
                recentTransactions,
                range
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

export const downloadIncomeExcel = async (req, res) => {
    try {
        const income = await incomeModel.find({ userId: req.user.id }).sort({ date: -1 });
        const plainData = income.map((inc) => ({
            Description: inc.description,
            Amount: inc.amount,
            Category: inc.category,
            Date: new Date(inc.date).toLocaleDateString()
        }));

        const worksheet = xlsx.utils.json_to_sheet(plainData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Incomes');

        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        const fileName = `income_details_${Date.now()}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        return res.send(buffer);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Excel export failed' });
    }
};