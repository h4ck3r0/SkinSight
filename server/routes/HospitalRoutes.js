import express from "express"
import { createHospital, getHospitals, getHospital, updateHospital, deleteHospital, GetnearBy, addDoctor, removeDoctor, cleanupInvalidDoctors } from "../controllers/HospitalControllers.js";
import { middleware } from '../middleware/middleware.js';

const router = express.Router();

router.get('/nearby/:lat/:lng', GetnearBy);
router.get('/', getHospitals);
router.get('/:id', getHospital);

router.post('/', middleware, createHospital);
router.put('/:id', middleware, updateHospital);
router.delete('/:id', middleware, deleteHospital);
router.post('/:id/doctors/:userId', middleware, addDoctor);
router.delete('/:id/doctors/:userId', middleware, removeDoctor);
router.post('/cleanup', middleware, cleanupInvalidDoctors);

export default router;