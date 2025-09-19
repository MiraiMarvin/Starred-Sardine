import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// Types pour les produits
export interface ProductPlan {
  id: string;
  name: string;
  description: string;
  price: number; // en centimes
  currency: string;
  interval?: 'month' | 'year'; // pour les abonnements
  features: string[];
}

// Plans tarifaires de test
export const testProducts: ProductPlan[] = [
  {
    id: 'starter',
    name: 'Plan Starter',
    description: 'Parfait pour commencer',
    price: 999, // 9.99€
    currency: 'eur',
    features: [
      'Accès de base',
      'Support email',
      '5 projets maximum',
      '1 GB de stockage'
    ]
  },
  {
    id: 'pro',
    name: 'Plan Pro',
    description: 'Pour les professionnels',
    price: 2999, // 29.99€
    currency: 'eur',
    features: [
      'Accès complet',
      'Support prioritaire',
      'Projets illimités',
      '100 GB de stockage',
      'Intégrations avancées'
    ]
  },
  {
    id: 'enterprise',
    name: 'Plan Enterprise',
    description: 'Pour les grandes équipes',
    price: 9999, // 99.99€
    currency: 'eur',
    features: [
      'Toutes les fonctionnalités Pro',
      'Support téléphonique 24/7',
      'Stockage illimité',
      'API personnalisée',
      'Formation dédiée'
    ]
  }
];