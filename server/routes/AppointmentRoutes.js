import express from "express"
import { createAppointment, getAppointment, updateAppointment, deleteAppointment, getAllAppointment, getDoctorAppointments, getPatientAppointments } from "../controllers/AppointControllers.js";
const router = express.Router();

router.post('/create',createAppointment);
router.put('/update/:id',updateAppointment)
router.delete('/delete',deleteAppointment);
router.get('/get/:id',getAppointment);
router.get('/getall',getAllAppointment);
router.get('/doctor/:doctorId', getDoctorAppointments);
router.get('/patient/:patientId', getPatientAppointments);

export default router;