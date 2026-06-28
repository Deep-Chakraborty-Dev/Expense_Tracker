import incomeModel from '../models/incomeModel.js'

export async function addIncome(req,res){
    const userId = req.user._id;
    const {description,amount,category,date} = req.body;

    try {
        if(!description || !amount || !category || !date){
            return res.status(400).json({
                success:false,
                message:"all fields are required"
            })
        }

        const newIncome = new incomeModel({
            userId,
            description,
            amount,
            category,
            date = new Date(date)
        })
        await newIncome.save();
        res.json({
            success:true,
            message:"Income added successfully"
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Server Error"
        });
    }
}

export async function getAllIncome(req,res){
    const userId = req.user._id;

    try {
        const income = await incomeModel.find({userId}).sort({date: -1});
        res.json(income);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Server Error"
        });
    }
}

export async function updateIncome(req,res){
    const {id}= req.params;
    const userId = req.user._id;
    const {description,amount}=req.body;

    try {
        const updatedIncome = await incomeModel.findOneAndUpdate(
            {_id:id,userId},
            {description,amount},
            {new:true}
    );
    if(!updateIncome){
            return res.status(400).json({
                success:false,
                message:"Income not found"
            })
        }

        res.json({
            success:true,
            message:"income updated successfully",
            data:updateIncome
        })
    }
    
    catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Server Error"
        });
    }
}

export async function deleteIncome(req,res){
    try {
        const income = await incomeModel.findByIdAndDelete({_id:req.param.id})
        if(!income){
            res.status(404).json({
                success:false,
                message:"Income not found"
            })
        }
        return res.json({
            success:true,
            message:"Income deleted successfully"
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Server Error"
        });
    }
     
}