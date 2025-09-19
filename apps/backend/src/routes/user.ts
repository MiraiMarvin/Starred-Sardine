import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();


router.use(authenticate);


router.get('/profile', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié'
    });
  }
  
  return res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  });
}));


router.put('/profile', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  const { firstName, lastName, email } = req.body;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié'
    });
  }

  const { prisma } = await import('../lib/prisma');
  
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email })
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return res.json({
    success: true,
    data: {
      ...updatedUser,
      name: `${updatedUser.firstName} ${updatedUser.lastName}`
    },
    message: 'Profil mis à jour avec succès'
  });
}));


router.get('/dashboard', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié'
    });
  }


  return res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role
      },
      stats: {
        totalOrders: 0,
        totalSpent: 0,
        memberSince: user.createdAt
      }
    }
  });
}));


router.delete('/account', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié'
    });
  }
  
  const { prisma } = await import('../lib/prisma');
  
  await prisma.user.delete({
    where: { id: user.id }
  });


  res.clearCookie('token');
  res.clearCookie('refreshToken');

  return res.json({
    success: true,
    message: 'Compte supprimé avec succès'
  });
}));

export { router as userRoutes };