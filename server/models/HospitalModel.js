import mongoose from "mongoose";

const HospitalSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: "Point"
        },
        coordinates: {
            type: [Number],
            required: true,
            validate: {
                validator: function(v) {
                    return v.length === 2 && 
                    v[0] >= -180 && v[0] <= 180 && 
                    v[1] >= -90 && v[1] <= 90;     
                },
                message: "Coordinates must be [longitude, latitude] with valid ranges"
            }
        }
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    service: [{
        type: String,
        default: ""
    }],
    doctors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "DoctorProfile"
    }]
}, {
    timestamps: true
});

HospitalSchema.index({ location: "2dsphere" });

HospitalSchema.pre('save', function(next) {
    if (this.isModified('location.coordinates')) {
        const [longitude, latitude] = this.location.coordinates;
        if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
            return next(new Error('Invalid coordinates'));
        }
        this.location.coordinates = [longitude, latitude];
    }
    next();
});

const HospitalModel = mongoose.model("Hospital", HospitalSchema);
export default HospitalModel;
