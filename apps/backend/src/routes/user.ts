import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, AuthenticatedRequest, authorize } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { updateProfileSchema, changePasswordSchema } from '../utils/validation';
import { Role } from '../types';

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
  const validatedData = updateProfileSchema.parse(req.body);
  const { firstName, lastName, email } = validatedData;

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

// Changer le mot de passe
router.put('/password', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  const validatedData = changePasswordSchema.parse(req.body);
  const { currentPassword, newPassword } = validatedData;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié'
    });
  }

  const { prisma } = await import('../lib/prisma');
  
  // Vérifier le mot de passe actuel
  const userWithPassword = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true }
  });

  if (!userWithPassword) {
    throw createError('Utilisateur non trouvé', 404);
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password);
  if (!isCurrentPasswordValid) {
    throw createError('Mot de passe actuel incorrect', 400);
  }

  // Hasher le nouveau mot de passe
  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  // Mettre à jour le mot de passe
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedNewPassword }
  });

  // Supprimer toutes les sessions existantes pour forcer une nouvelle connexion
  await prisma.session.deleteMany({
    where: { userId: user.id }
  });

  return res.json({
    success: true,
    message: 'Mot de passe modifié avec succès. Veuillez vous reconnecter.'
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

// ============================================
// ROUTES D'ADMINISTRATION (ADMIN UNIQUEMENT)
// ============================================

// Récupérer tous les utilisateurs (admin seulement)
router.get('/admin/all', authenticate, authorize(Role.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

// Mettre à jour le rôle d'un utilisateur (admin seulement)
router.put('/admin/:userId/role', authenticate, authorize(Role.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  if (!['USER', 'PREMIUM', 'ADMIN'].includes(role)) {
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
}));

export { router as userRoutes };