'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      verifyPayment(sessionId);
    } else {
      setError('Session ID manquant');
      setLoading(false);
    }
  }, [searchParams]);

  const verifyPayment = async (sessionId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stripe/verify-payment/${sessionId}`, {
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSessionData(data.session);
      } else {
        setError('Erreur lors de la vérification du paiement');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amountTotal: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amountTotal / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md">
          <div className="text-red-800 text-center">
            <h2 className="text-lg font-semibold mb-2">Erreur</h2>
            <p>{error}</p>
            <Link 
              href="/products" 
              className="mt-4 inline-block bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Retour aux produits
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-24 w-24 text-green-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Paiement réussi !
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Merci pour votre achat. Votre commande a été traitée avec succès.
          </p>
        </div>

        {sessionData && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Détails de la commande
              </h3>
              
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-1">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    ID de transaction
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">
                    {sessionData.id}
                  </dd>
                </div>
                
                {sessionData.customer_email && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Email
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {sessionData.customer_email}
                    </dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Montant
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 font-semibold">
                    {formatPrice(sessionData.amount_total, sessionData.currency)}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Statut du paiement
                  </dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {sessionData.payment_status === 'paid' ? 'Payé' : sessionData.payment_status}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        <div className="text-center space-y-4">
          <Link
            href="/dashboard"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Accéder au tableau de bord
          </Link>
          
          <Link
            href="/products"
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
          >
            Voir d'autres produits
          </Link>
        </div>
      </div>
    </div>
  );
}