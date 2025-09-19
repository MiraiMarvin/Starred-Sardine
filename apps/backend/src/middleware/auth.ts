import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { createError } from './errorHandler';

// Import du type Role depuis Prisma
type Role = 'USER' | 'ADMIN' | 'PREMIUM';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
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
      role: user.role,
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
