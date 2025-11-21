import express from 'express';
import {
  createRoom,
  getRoomByCode,
  verifyRoomPassword,
  endRoom,
  getUserRooms,
  getRecentMeetings
} from '../controllers/roomController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, roomValidation } from '../middleware/validation.js';

const router = express.Router();

// All room routes require authentication
router.use(authenticate);

router.post('/', validate(roomValidation), createRoom);
router.get('/my-rooms', getUserRooms);
router.get('/recent-meetings', getRecentMeetings);
router.get('/:roomCode', getRoomByCode);
router.post('/:roomCode/verify-password', verifyRoomPassword);
router.post('/:roomCode/end', endRoom);

export default router;
