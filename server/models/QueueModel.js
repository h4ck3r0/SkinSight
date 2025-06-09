import mongoose from "mongoose";

const QueueSchema = new mongoose.Schema({
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HospitalProfile',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    queueNumber: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    },
    maxPatients: {
        type: Number,
        required: true
    },
    currentPatients: {
        type: Number,
        default: 0
    },
    patients: [{
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['waiting', 'in_progress', 'completed', 'cancelled'],
            default: 'waiting'
        },
        reason: String,
        appointmentTime: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

QueueSchema.index({ hospitalId: 1, doctorId: 1 });
QueueSchema.index({ 'patients.patientId': 1 });

const Queue = mongoose.model('Queue', QueueSchema);
export default Queue;

