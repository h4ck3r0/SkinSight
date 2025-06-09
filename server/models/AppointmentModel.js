import mongoose from "mongoose";

const appointmentSchema=new mongoose.Schema({
    doctor:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    patient:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    hospital:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"HospitalProfile",
    },
    appointmentTime:{
        type:Date,required:true
    },
    appointmentDate:{
        type:Date,required:true
    },
    reason:{
        type:String,required:true
    },
    status:{
        type:String,
        enum:["pending","confirmed","cancelled","completed"],
        default:"pending"
    },
    approvalStatus:{
        type:String,
        enum:["pending","approved","rejected"],
        default:"pending"
    },
    approvalMessage:{
        type:String,default:""
    },
    approverBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
},{timestamps:true})    

appointmentSchema.index({ patient: 1, appointmentTime: 1 });
appointmentSchema.index({ doctor: 1, appointmentTime: 1 });
appointmentSchema.index({ hospital: 1, appointmentTime: 1 });
appointmentSchema.index({ status: 1, appointmentTime: 1 });

const Appointment = mongoose.model("Appointment",appointmentSchema);

export default Appointment;
