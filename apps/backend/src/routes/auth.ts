import { Router } from 'express';
import { 
  register, 
  login, 
  logout,
  verifyEmail, 
  forgotPassword, 
  resetPassword,
  refreshToken,
  getCurrentUser
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();


router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.get('/verify-email/:token', asyncHandler(verifyEmail));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password/:token', asyncHandler(resetPassword));
router.post('/refresh-token', asyncHandler(refreshToken));


router.get('/me', authenticate, asyncHandler(getCurrentUser));

export { router as authRoutes };
