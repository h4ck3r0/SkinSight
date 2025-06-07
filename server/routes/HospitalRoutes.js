import express from "express"
import { createHospital, getHospitals, getHospital, updateHospital, deleteHospital, GetnearBy, addDoctor } from "../controllers/HospitalControllers.js";
const router = express.Router();

router.post('/addhospital',createHospital);
router.post('/update/:id',updateHospital);
router.get('/getall',getHospitals);
router.get('/:id',getHospital);
router.delete('/:id',deleteHospital);
router.get('/getnearBy/:lat/:long',GetnearBy);
router.post('/adddocter/:id/:doctorId',addDoctor);


export default router;