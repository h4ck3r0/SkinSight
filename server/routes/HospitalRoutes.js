import express from "express"
import { createHospital, getHospitals, getHospital, updateHospital, deleteHospital, GetnearBy, addDoctor } from "../controllers/HospitalControllers.js";
const router = express.Router();

router.post('/addhospital', createHospital);
router.get('/getall', getHospitals);
router.get('/getnearBy/:lat/:long', GetnearBy);
router.post('/update/:id', updateHospital);
router.post('/adddocter/:id/:doctorId', addDoctor);
router.get('/:id', getHospital);
router.delete('/:id', deleteHospital);

export default router;