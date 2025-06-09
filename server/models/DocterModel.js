import mongoose from "mongoose";
const DoctorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, 
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HospitalProfile',
    default: null
  },
  specialization: {
    type: String,
    required: true,
    trim: true,
  },
  qualifications: [{
    degree: {
      type: String,
      required: true,
      trim: true
    },
    institution: {
      type: String,
      required: true,
      trim: true
    },
    year: {
      type: Number,
      required: true
    }
  }],
  experience: {
    type: Number,  
    required: true,
    min: 0
  },
  consultationFee: {
    type: Number,
    required: true,
    min: 0
  },
  availability: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ 
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ 
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  }],
  languages: [{
    type: String,
    trim: true
  }],
  bio: {
    type: String,
    trim: true,
    maxLength: 1000
  },
  achievements: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    year: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  address: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    }
  },
  appointments: [{
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ 
    },
    endTime: {
      type: String,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

DoctorProfileSchema.index({ location: '2dsphere' });
DoctorProfileSchema.methods.isAvailableAt = function(date) {
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
  const time = date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  
  const availabilitySlot = this.availability.find(slot => 
    slot.day === dayOfWeek && 
    slot.isAvailable &&
    time >= slot.startTime && 
    time <= slot.endTime
  );
  
  return !!availabilitySlot;
};
DoctorProfileSchema.methods.getNextAvailableSlot = function(fromDate = new Date()) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let currentDate = new Date(fromDate);
  
  // Check next 14 days for availability
  for (let i = 0; i < 14; i++) {
    const dayOfWeek = days[currentDate.getDay()];
    const availabilitySlots = this.availability.filter(slot => 
      slot.day === dayOfWeek && 
      slot.isAvailable
    );
    
    if (availabilitySlots.length > 0) {
      // Sort slots by start time
      availabilitySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      for (const slot of availabilitySlots) {
        const [startHour, startMinute] = slot.startTime.split(':');
        const slotDate = new Date(currentDate);
        slotDate.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
        
        if (slotDate > fromDate) {
          // Check if this slot is already booked
          const isBooked = this.appointments.some(appointment => {
            const appointmentDate = new Date(appointment.date);
            const appointmentTime = appointment.startTime;
            return appointmentDate.toDateString() === slotDate.toDateString() && 
                   appointmentTime === slot.startTime;
          });
          
          if (!isBooked) {
            return {
              date: slotDate,
              startTime: slot.startTime,
              endTime: slot.endTime,
              day: dayOfWeek
            };
          }
        }
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(0, 0, 0, 0);
  }
  
  // If no slots found, return the next available day with any slot
  const nextAvailableDay = this.availability.find(slot => slot.isAvailable);
  if (nextAvailableDay) {
    return {
      message: "No immediate slots available. Please check back later.",
      nextAvailableDay: nextAvailableDay.day,
      startTime: nextAvailableDay.startTime,
      endTime: nextAvailableDay.endTime
    };
  }
  
  return {
    message: "No available slots found in the next two weeks",
    nextAvailableDay: null
  };
};

const DocterModel= mongoose.model("DoctorProfile", DoctorProfileSchema);
export default DocterModel;