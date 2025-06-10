import express from "express"
import {
    createDoctorProfile,
    getDoctorProfile,
    updateDoctorProfile,
    updateAvailability,
    getDoctorAppointments,
    getNextAvailableSlot,
    deleteDoctorProfile,
    approveAppointment,
    getAllDoctors
} from "../controllers/DoctorControllers.js"
import { middleware } from '../middleware/middleware.js';

const router = express.Router();

// Protected routes - require authentication
router.post("/profile", middleware, createDoctorProfile);
router.get("/profile", middleware, getDoctorProfile);
router.put("/profile", middleware, updateDoctorProfile);
router.delete("/profile", middleware, deleteDoctorProfile);
router.put("/availability", middleware, updateAvailability);
router.get("/availability/next", middleware, getNextAvailableSlot);
router.get("/appointments", middleware, getDoctorAppointments);
router.put("/appointments/:appointmentId/approve", middleware, approveAppointment);

// Public route
router.get("/getall", getAllDoctors);

export default router;