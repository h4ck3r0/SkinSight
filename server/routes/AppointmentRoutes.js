import express from "express"
import { createAppointment, getAppointment, updateAppointment, deleteAppointment, getAllAppointment } from "../controllers/AppointControllers.js";
const router = express.Router();

router.post('/create',createAppointment);
router.put('/update',updateAppointment)
router.delete('/delete',deleteAppointment);
router.get('/get/:id',getAppointment);
router.get('/getall',getAllAppointment);

export default router;