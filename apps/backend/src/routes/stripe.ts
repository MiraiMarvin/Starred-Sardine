import { Router } from 'express';
import { 
  getProducts, 
  getProduct, 
  createCheckoutSession, 
  verifyPayment,
  handleStripeWebhook 
} from '../controllers/stripeController';
import { authenticate, authenticateForPayment } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Routes publiques pour les produits
router.get('/products', asyncHandler(getProducts));
router.get('/products/:productId', asyncHandler(getProduct));

// Routes protégées pour les paiements (avec middleware spécial pour paiements)
router.post('/create-checkout-session', authenticateForPayment as any, asyncHandler(createCheckoutSession));
router.get('/verify-payment/:sessionId', authenticateForPayment as any, asyncHandler(verifyPayment));

// Webhook Stripe (pas d'authentification requise car vient de Stripe)
router.post('/webhook', asyncHandler(handleStripeWebhook));

export default router;