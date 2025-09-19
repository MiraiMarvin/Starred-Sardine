import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { emailService } from '../services/emailService';
import { 
  registerSchema, 
  loginSchema, 
  resetPasswordSchema,
  forgotPasswordSchema 
} from '../utils/validation';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

const generateVerificationToken = () => {
  return jwt.sign(
    { type: 'verification', timestamp: Date.now() },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
};

export const register = async (req: Request, res: Response) => {
  const validatedData = registerSchema.parse(req.body);
  const { email, password, firstName, lastName } = validatedData;

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw createError('Un utilisateur avec cet email existe déjà', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  
  const emailVerificationToken = generateVerificationToken();

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      emailVerificationToken
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isEmailVerified: true
    }
  });

  await emailService.sendVerificationEmail(email, emailVerificationToken);

  logger.info(`Nouvel utilisateur créé: ${email}`);

  res.status(201).json({
    success: true,
    message: 'Compte créé avec succès. Vérifiez votre email pour activer votre compte.',
    data: { userId: user.id }
  });
};

export const login = async (req: Request, res: Response) => {
  const validatedData = loginSchema.parse(req.body);
  const { email, password } = validatedData;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw createError('Email ou mot de passe invalide', 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw createError('Email ou mot de passe invalide', 401);
  }

  const { accessToken, refreshToken } = generateTokens(user.id);

  await prisma.session.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
    }
  });

  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 
  });

  logger.info(`Utilisateur connecté: ${email}`);

  res.json({
    success: true,
    message: 'Connexion réussie',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus
      },
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await prisma.session.deleteMany({
      where: { token: refreshToken }
    });
  }

  res.clearCookie('token');
  res.clearCookie('refreshToken');

  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
};

export const verifyEmail = async (req: Request, res: Response) => {
  // Récupérer le token depuis les params (GET) ou le body (POST)
  const token = req.params.token || req.body.token;

  logger.info(`Tentative de vérification email - Method: ${req.method}, Token reçu: ${token ? 'présent' : 'absent'}`);

  if (!token) {
    logger.error('Token de vérification manquant');
    throw createError('Token de vérification manquant', 400);
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    logger.info('Token JWT valide');
  } catch (error) {
    logger.error('Token JWT invalide:', error);
    throw createError('Token de vérification invalide ou expiré', 400);
  }

  const user = await prisma.user.findFirst({
    where: { emailVerificationToken: token }
  });

  if (!user) {
    logger.error('Aucun utilisateur trouvé avec ce token');
    throw createError('Token de vérification invalide', 400);
  }

  logger.info(`Utilisateur trouvé: ${user.email}, déjà vérifié: ${user.isEmailVerified}`);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null
    }
  });

  await emailService.sendWelcomeEmail(user.email, user.firstName);

  logger.info(`Email vérifié pour: ${user.email}`);

  res.json({
    success: true,
    message: 'Email vérifié avec succès'
  });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const validatedData = forgotPasswordSchema.parse(req.body);
  const { email } = validatedData;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    return res.json({
      success: true,
      message: 'Si un compte avec cet email existe, vous recevrez un lien de réinitialisation.'
    });
  }

  const resetToken = jwt.sign(
    { userId: user.id, type: 'password-reset' },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000)
    }
  });

  await emailService.sendPasswordResetEmail(email, resetToken);

  logger.info(`Demande de réinitialisation de mot de passe pour: ${email}`);

  return res.json({
    success: true,
    message: 'Si un compte avec cet email existe, vous recevrez un lien de réinitialisation.'
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token } = req.params;
  const validatedData = resetPasswordSchema.parse(req.body);
  const { password } = validatedData;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (decoded.type !== 'password-reset') {
      throw new Error('Token invalide');
    }
  } catch (error) {
    throw createError('Token de réinitialisation invalide ou expiré', 400);
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    throw createError('Token de réinitialisation invalide ou expiré', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    }
  });

  await prisma.session.deleteMany({
    where: { userId: user.id }
  });

  logger.info(`Mot de passe réinitialisé pour: ${user.email}`);

  res.json({
    success: true,
    message: 'Mot de passe réinitialisé avec succès'
  });
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken: tokenFromBody } = req.body;
  const tokenFromCookie = req.cookies.refreshToken;
  
  const refreshToken = tokenFromBody || tokenFromCookie;

  if (!refreshToken) {
    throw createError('Token de rafraîchissement requis', 401);
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    
    const session = await prisma.session.findFirst({
      where: {
        token: refreshToken,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!session) {
      throw createError('Session invalide', 401);
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(session.userId);

    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    throw createError('Token de rafraîchissement invalide', 401);
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      subscriptionStatus: true,
      isEmailVerified: true,
      createdAt: true
    }
  });

  res.json({
    success: true,
    data: user
  });
};
