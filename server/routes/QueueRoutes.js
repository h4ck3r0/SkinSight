import express from 'express'
import {
    startQueue,
    joinQueue,
    getNextPatient,
    completeConsultation,
    getQueueStatus,
    endQueue,
    leaveQueue
} from "../controllers/QueueController.js";
import { middleware } from '../middleware/middleware.js';

const router = express.Router()

router.post("/start", startQueue);
router.post("/join", middleware, joinQueue);
router.post("/next", getNextPatient);
router.post("/complete", completeConsultation);
router.get("/status", middleware, getQueueStatus);
router.post("/end", endQueue);
router.post("/leave", middleware, leaveQueue);

export default router;