import express from 'express'
import { CreateQueue, DeleteQueue, GetQueue, UpdateQueue, AddPatientToQueue, RemovePatientFromQueue, GetAllQueues, Controls } from '../controllers/QueueControllers.js';
const router = express.Router()

router.post('/', CreateQueue);
router.delete('/:queueId', DeleteQueue);
router.post('/:queueId/patients', AddPatientToQueue);
router.delete('/:queueId/patients', RemovePatientFromQueue);
router.put('/:queueId/status', Controls);
router.put('/:queueId', UpdateQueue);
router.get('/:queueId', GetQueue);
router.get('/', GetAllQueues);

export default router;