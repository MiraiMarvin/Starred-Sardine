import { Router } from 'express';
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();


router.post('/stripe', asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  
  if (!signature) {
    return res.status(400).json({
      success: false,
      message: 'Signature Stripe manquante'
    });
  }

  // Ici vous valideriez le webhook Stripe
  // const event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
  
  // Traiter l'événement selon son type
  // switch (event.type) {
  //   case 'payment_intent.succeeded':
  //     // Gérer le paiement réussi
  //     break;
  //   case 'customer.subscription.updated':
  //     // Gérer la mise à jour d'abonnement
  //     break;
  // }

  return res.json({
    success: true,
    message: 'Webhook reçu'
  });
}));


router.post('/generic', asyncHandler(async (req: Request, res: Response) => {
  const { type, data } = req.body;


  switch (type) {
    case 'user.updated':
     
      break;
    case 'order.created':
      break;
    default:
      console.log('Type d\'événement non géré:', type);
  }

  return res.json({
    success: true,
    message: 'Événement traité'
  });
}));

export { router as webhookRoutes };