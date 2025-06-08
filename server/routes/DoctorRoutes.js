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

const router = express.Router();

router.post("/profile", createDoctorProfile);
router.get("/profile", getDoctorProfile);
router.put("/profile", updateDoctorProfile);
router.delete("/profile", deleteDoctorProfile);
router.put("/availability", updateAvailability);
router.get("/availability/next", getNextAvailableSlot);
router.get("/appointments", getDoctorAppointments);
router.put("/appointments/:appointmentId/approve", approveAppointment);
router.get("/getall", getAllDoctors);

export default router;