import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receivers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file', 'system'],
        default: 'text'
    },
    fileUrl: {
        type: String,
        trim: true
    },
    fileType: {
        type: String,
        trim: true
    },
    fileSize: {
        type: Number
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    },
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

MessageSchema.index({ sender: 1, createdAt: -1 });
MessageSchema.index({ receivers: 1, createdAt: -1 });
MessageSchema.index({ status: 1 });

MessageSchema.methods.markAsRead = async function(userId) {
    if (!this.readBy.some(read => read.user.toString() === userId.toString())) {
        this.readBy.push({
            user: userId,
            readAt: new Date()
        });
        this.status = 'read';
        await this.save();
    }
};

MessageSchema.statics.getUnreadCount = async function(userId) {
    return await this.countDocuments({
        receivers: userId,
        'readBy.user': { $ne: userId }
    });
};

const Message = mongoose.model("Message", MessageSchema);
export default Message;