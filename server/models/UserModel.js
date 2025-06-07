import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
     email: {
        type: String,
        unique: true,
        required: true
     },
     password: {
        type: String,
        required: true
     },
     role: {
        type: String,
        enum: ['patient', 'staff', 'doctor'],
        required: true
     },
     firstName: {
         type: String,
         required: true
     },
     LastName: {
        type: String,
        default: ""
     },
     dob: {
        type: Date,
        default: Date.now
     },
     address: {
        type: String,
        required: true
     },
     hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital'
     }
}, {
    timestamps: true
});

const UserModel = mongoose.model("User", UserSchema);

export default UserModel;