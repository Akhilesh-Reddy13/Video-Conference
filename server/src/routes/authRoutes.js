import express from 'express';
import {
  register,
  login,
  refreshToken,
  getCurrentUser,
  logout,
  updateProfile
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, registerValidation, loginValidation } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);
router.put('/profile', authenticate, updateProfile);

export default router;
