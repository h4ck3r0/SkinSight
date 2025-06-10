import express from 'express'
import {
    startQueue,
    joinQueue,
    getNextPatient,
    completeConsultation,
    getQueueStatus,
    endQueue
} from "../controllers/QueueController.js";

const router = express.Router()

router.post("/start", startQueue);
router.post("/join", joinQueue);
router.post("/next", getNextPatient);
router.post("/complete", completeConsultation);
router.get("/status/:doctorId/:hospitalId", getQueueStatus);
router.post("/end", endQueue);

export default router;