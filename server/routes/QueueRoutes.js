import express from 'express'
import { CreateQueue, DeleteQueue, GetQueue, UpdateQueue, AddPatientToQueue, RemovePatientFromQueue, GetAllQueues, Controls } from '../controllers/QueueControllers.js';
import {
    startQueue,
    joinQueue,
    getNextPatient,
    completeConsultation,
    getQueueStatus,
    endQueue
} from "../controllers/QueueController.js";

const router = express.Router()

router.post('/', CreateQueue);
router.delete('/:queueId', DeleteQueue);
router.post('/:queueId/patients', AddPatientToQueue);
router.delete('/:queueId/patients', RemovePatientFromQueue);
router.put('/:queueId/status', Controls);
router.put('/:queueId', UpdateQueue);
router.get('/:queueId', GetQueue);
router.get('/', GetAllQueues);
router.post("/start", startQueue);
router.post("/join", joinQueue);
router.post("/next", getNextPatient);
router.post("/complete", completeConsultation);
router.get("/status/:doctorId/:hospitalId", getQueueStatus);
router.post("/end", endQueue);

export default router;