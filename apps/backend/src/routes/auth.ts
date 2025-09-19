import { Router, Request, Response } from 'express';
import passport from '../lib/passport';
import jwt from 'jsonwebtoken';
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
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

const router = Router();


router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.get('/verify-email/:token', asyncHandler(verifyEmail));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password/:token', asyncHandler(resetPassword));
router.post('/refresh-token', asyncHandler(refreshToken));


router.get('/me', authenticate, asyncHandler(getCurrentUser));

// Routes OAuth Google
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/auth/login?error=oauth` }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as any;
    
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=oauth`);
    }

    // Générer les tokens
    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
    
    const refreshTokenValue = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    // Créer une session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshTokenValue,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Définir les cookies
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshTokenValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    logger.info(`Connexion OAuth Google réussie: ${user.email}`);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  })
);

// Routes OAuth GitHub
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: `${process.env.FRONTEND_URL}/auth/login?error=oauth` }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as any;
    
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=oauth`);
    }

    // Générer les tokens
    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
    
    const refreshTokenValue = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    // Créer une session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshTokenValue,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Définir les cookies
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshTokenValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    logger.info(`Connexion OAuth GitHub réussie: ${user.email}`);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  })
);

export { router as authRoutes };
