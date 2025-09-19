import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest, authorize } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { Role } from '../types';

const router = Router();

// Toutes les routes d'administration nécessitent une authentification admin
router.use(authenticate as any);
router.use(authorize(Role.ADMIN) as any);

// Récupérer tous les utilisateurs
router.get('/users', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { prisma } = await import('../lib/prisma');
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isEmailVerified: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return res.json({
    success: true,
    data: users
  });
}));

// Mettre à jour le rôle d'un utilisateur
router.put('/users/:userId/role', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const { role } = req.body;
  const currentUser = req.user;

  if (!currentUser) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié'
    });
  }

  // Vérifier que le rôle est valide
  if (!Object.values(Role).includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Rôle invalide'
    });
  }

  // Empêcher de modifier son propre rôle
  if (userId === currentUser.id) {
    return res.status(400).json({
      success: false,
      message: 'Vous ne pouvez pas modifier votre propre rôle'
    });
  }

  const { prisma } = await import('../lib/prisma');

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
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

    return res.json({
      success: true,
      data: updatedUser,
      message: 'Rôle mis à jour avec succès'
    });
  } catch (error) {
    throw createError('Utilisateur non trouvé', 404);
  }
}));

// Obtenir les statistiques d'administration
router.get('/stats', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { prisma } = await import('../lib/prisma');
  
  const [totalUsers, adminUsers, premiumUsers, regularUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: Role.ADMIN } }),
    prisma.user.count({ where: { role: Role.PREMIUM } }),
    prisma.user.count({ where: { role: Role.USER } })
  ]);

  return res.json({
    success: true,
    data: {
      totalUsers,
      adminUsers,
      premiumUsers,
      regularUsers
    }
  });
}));

export { router as adminRoutes };
