import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    // Establishes a relationship link back to the specific registered user profile entry
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user', 
        required: [true, 'User link ID reference is required'] 
    },
    description: { 
        type: String, 
        required: [true, 'Expense description details are required'],
        trim: true
    },
    amount: { 
        type: Number, 
        required: [true, 'Expense transaction cost amount is required'],
        min: [0, 'Amount value cannot be negative']
    },
    category: { 
        type: String, 
        required: [true, 'Spending item tracking category is required'],
        default: 'Food' // Mapped structural default categories: Food, Housing, Shopping, Transport, Utilities, Health, etc.
    },
    date: { 
        type: Date, 
        required: [true, 'Transaction execution recording timestamp date is required'] 
    },
    type: { 
        type: String, 
        default: 'expense' // Serves as the key to distinguish analytics datasets from income charts down the stream
    }
}, { 
    // Automatically generates absolute internal tracking stamps: createdAt and updatedAt columns
    timestamps: true 
});

// Ensures the model references pre-existing execution parameters safely without throwing re-compilation hooks
const expenseModel = mongoose.models.expense || mongoose.model('expense', expenseSchema);
export default expenseModel;