'use client';

import { useState, useEffect } from 'react';
import { CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import { useAuth } from '@/context/AuthContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stripe/products`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products);
      } else {
        setError('Erreur lors du chargement des produits');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100);
  };

  const handlePurchase = async (productId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stripe/create-checkout-session`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Rediriger vers Stripe Checkout
        window.location.href = data.url;
      } else {
        setError('Erreur lors de la création de la session de paiement');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Tarification</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choisissez le plan qui vous convient
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Des plans flexibles pour tous vos besoins. Commencez gratuitement et évoluez avec nous.
          </p>
        </div>

        {/* Message d'avertissement si email non vérifié */}
        {user && !user.isEmailVerified && (
          <div className="mx-auto mt-8 max-w-4xl">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Email non vérifié
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Votre email n'est pas encore vérifié. Vous pouvez toujours effectuer des achats, 
                      mais nous vous recommandons de vérifier votre email pour une meilleure sécurité.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plans tarifaires */}
        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-3">
          {products.map((product, index) => (
            <div
              key={product.id}
              className={`
                rounded-3xl p-8 ring-1 ring-gray-200 
                ${index === 1 ? 'bg-gray-900 ring-gray-900 lg:z-10 lg:order-2' : 'bg-white'}
                ${index === 0 ? 'lg:rounded-r-none' : ''}
                ${index === 2 ? 'lg:rounded-l-none' : ''}
              `}
            >
              <h3 
                className={`
                  text-lg font-semibold leading-8 
                  ${index === 1 ? 'text-white' : 'text-gray-900'}
                `}
              >
                {product.name}
              </h3>
              <p 
                className={`
                  mt-4 text-sm leading-6 
                  ${index === 1 ? 'text-gray-300' : 'text-gray-600'}
                `}
              >
                {product.description}
              </p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span 
                  className={`
                    text-4xl font-bold tracking-tight 
                    ${index === 1 ? 'text-white' : 'text-gray-900'}
                  `}
                >
                  {formatPrice(product.price, product.currency)}
                </span>
                <span 
                  className={`
                    text-sm font-semibold leading-6 
                    ${index === 1 ? 'text-gray-300' : 'text-gray-600'}
                  `}
                >
                  /mois
                </span>
              </p>
              <button
                onClick={() => handlePurchase(product.id)}
                className={`
                  mt-6 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                  ${index === 1 
                    ? 'bg-white text-gray-900 hover:bg-gray-100 focus-visible:outline-white' 
                    : 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600'
                  }
                `}
              >
                Choisir ce plan
              </button>
              <ul 
                className={`
                  mt-8 space-y-3 text-sm leading-6 
                  ${index === 1 ? 'text-gray-300' : 'text-gray-600'}
                `}
              >
                {product.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon 
                      className={`
                        h-6 w-5 flex-none 
                        ${index === 1 ? 'text-white' : 'text-indigo-600'}
                      `} 
                      aria-hidden="true" 
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}