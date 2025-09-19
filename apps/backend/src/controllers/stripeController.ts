import { Request, Response } from 'express';
import { stripe, testProducts, ProductPlan } from '../lib/stripe';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// Obtenir tous les produits disponibles
export const getProducts = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      products: testProducts
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des produits:', error);
    throw createError('Erreur lors de la récupération des produits', 500);
  }
};

// Obtenir un produit spécifique
export const getProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    
    const product = testProducts.find(p => p.id === productId);
    if (!product) {
      throw createError('Produit non trouvé', 404);
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du produit:', error);
    throw createError('Erreur lors de la récupération du produit', 500);
  }
};

// Créer une session de paiement Stripe
export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw createError('Utilisateur non authentifié', 401);
    }

    const product = testProducts.find(p => p.id === productId);
    if (!product) {
      throw createError('Produit non trouvé', 404);
    }

    // Créer la session de paiement Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/products`,
      client_reference_id: userId.toString(),
      metadata: {
        productId: product.id,
        userId: userId.toString(),
      },
    });

    logger.info(`Session de paiement créée pour l'utilisateur ${userId}:`, { 
      sessionId: session.id, 
      productId: product.id 
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    logger.error('Erreur lors de la création de la session de paiement:', error);
    throw createError('Erreur lors de la création de la session de paiement', 500);
  }
};

// Vérifier le statut d'une session de paiement
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      throw createError('Session de paiement non trouvée', 404);
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        customer_email: session.customer_details?.email,
        amount_total: session.amount_total,
        currency: session.currency,
        metadata: session.metadata
      }
    });
  } catch (error) {
    logger.error('Erreur lors de la vérification du paiement:', error);
    throw createError('Erreur lors de la vérification du paiement', 500);
  }
};

// Webhook Stripe pour traiter les événements
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET n\'est pas configuré');
    return res.status(400).send('Webhook secret non configuré');
  }

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    logger.error('Erreur de signature webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Traiter l'événement
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      logger.info('Paiement réussi:', {
        sessionId: session.id,
        userId: session.metadata?.userId,
        productId: session.metadata?.productId,
        amount: session.amount_total
      });
      
      // Ici vous pouvez mettre à jour la base de données
      // Par exemple, activer l'abonnement de l'utilisateur
      break;

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      logger.info('PaymentIntent réussi:', { paymentIntentId: paymentIntent.id });
      break;

    default:
      logger.info(`Événement webhook non traité: ${event.type}`);
  }

  return res.json({ received: true });
};