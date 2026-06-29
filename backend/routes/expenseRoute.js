import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { 
    addExpense, 
    getAllExpense, 
    updateExpense, 
    deleteExpense, 
    getExpenseOverview, 
    downloadExpenseExcel 
} from '../controllers/expenseController.js';

const expenseRouter = express.Router();

expenseRouter.post('/add', authMiddleware, addExpense);
expenseRouter.get('/get', authMiddleware, getAllExpense);
expenseRouter.put('/update/:id', authMiddleware, updateExpense);
expenseRouter.delete('/delete/:id', authMiddleware, deleteExpense);
expenseRouter.get('/download', authMiddleware, downloadExpenseExcel);
expenseRouter.get('/view', authMiddleware, getExpenseOverview);

export default expenseRouter;