import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';

const router = Router();


router.use(authenticate);


router.post('/create-session', asyncHandler(async (req: Request, res: Response) => {
  const { priceId, mode = 'payment' } = req.body;
  
  if (!priceId) {
    return res.status(400).json({
      success: false,
      message: 'priceId est requis'
    });
  }


  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const session = await stripe.checkout.sessions.create({...});

  return res.json({
    success: true,
    data: {
      // sessionId: session.id,
      // url: session.url
      message: 'Intégration Stripe à venir'
    }
  });
}));


router.get('/history', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
      payments: [],
      total: 0
    }
  });
}));


router.get('/subscription', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
      status: 'inactive',
      plan: null,
      nextBilling: null
    }
  });
}));


router.post('/cancel-subscription', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié'
    });
  }


  return res.json({
    success: true,
    message: 'Abonnement annulé avec succès'
  });
}));

export { router as paymentRoutes };