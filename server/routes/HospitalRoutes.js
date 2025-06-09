import express from "express"
import { createHospital, getHospitals, getHospital, updateHospital, deleteHospital, GetnearBy, addDoctor } from "../controllers/HospitalControllers.js";
const router = express.Router();

router.post('/addhospital', createHospital);
router.get('/getnearBy/:lat/:lng', GetnearBy);
router.get('/getall', getHospitals);
router.get('/:id', getHospital);
router.patch('/:id', updateHospital);
router.delete('/:id', deleteHospital);
router.post('/:id/doctors', addDoctor);

export default router;