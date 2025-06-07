import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
    AppointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    }],
    QueueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Queue"
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
        default: 'ACTIVE'
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    }
}, {
    timestamps: true
});

RoomSchema.index({ AppointmentId: 1 });
RoomSchema.index({ patientId: 1 });
RoomSchema.index({ doctorId: 1 });
RoomSchema.index({ status: 1 });

const Room = mongoose.model("Room", RoomSchema);
export default Room;