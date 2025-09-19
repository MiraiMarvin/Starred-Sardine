import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { createError } from './errorHandler';
import { AuthenticatedRequest, Role } from '../types';

export { AuthenticatedRequest }; // Export du type

// Middleware d'authentification principal
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw createError('Token d\'accès requis', 401);
    }

    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw createError('Utilisateur non trouvé', 401);
    }

    if (!user.isEmailVerified) {
      throw createError('Email non vérifié', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as Role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware d'authentification pour les paiements (sans vérification d'email obligatoire)
export const authenticateForPayment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw createError('Token d\'accès requis', 401);
    }

    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw createError('Utilisateur non trouvé', 401);
    }

    // Note: On ne vérifie pas l'email pour les paiements
    // if (!user.isEmailVerified) {
    //   throw createError('Email non vérifié', 401);
    // }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as Role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Non authentifié', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(createError('Accès refusé', 403));
    }

    next();
  };
};
