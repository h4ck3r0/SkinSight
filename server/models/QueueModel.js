import mongoose from "mongoose";

const queueSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    hospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HospitalProfile",
        required: true
    },
    currentNumber: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: false
    },
    patients: [{
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        queueNumber: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ["waiting", "in_consultation", "completed"],
            default: "waiting"
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Queue = mongoose.model("Queue", queueSchema);
export default Queue;

