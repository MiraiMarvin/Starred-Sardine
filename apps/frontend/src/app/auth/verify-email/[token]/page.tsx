'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = params.token as string;
        
        if (!token) {
          setStatus('error');
          setMessage('Token de vérification manquant');
          return;
        }

        console.log('Token reçu:', token);
        console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
        
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email`;
        console.log('URL complète:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok) {
          setStatus('success');
          setMessage('Votre email a été vérifié avec succès !');
          
          // Redirection automatique vers le dashboard après 3 secondes
          setTimeout(() => {
            router.push('/auth/login?verified=true');
          }, 3000);
        } else {
          if (data.error === 'Token expiré') {
            setStatus('expired');
            setMessage('Le lien de vérification a expiré');
          } else {
            setStatus('error');
            setMessage(data.error || 'Erreur lors de la vérification');
          }
        }
      } catch (error) {
        console.error('Erreur de vérification:', error);
        setStatus('error');
        setMessage('Erreur de connexion au serveur');
      }
    };

    verifyEmail();
  }, [params.token, router]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Vérification en cours...
            </h2>
            <p className="text-gray-600">
              Nous vérifions votre adresse email
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Email vérifié !
            </h2>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <p className="text-sm text-gray-500">
              Vous allez être redirigé vers la page de connexion...
            </p>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Lien expiré
            </h2>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  // TODO: Implémenter la fonctionnalité de renvoi d'email
                  alert('Fonctionnalité de renvoi à implémenter');
                }}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Renvoyer un email de vérification
              </button>
              <Link
                href="/auth/login"
                className="block w-full text-center text-blue-600 hover:text-blue-500"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erreur de vérification
            </h2>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <div className="space-y-3">
              <Link
                href="/auth/register"
                className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center"
              >
                Créer un nouveau compte
              </Link>
              <Link
                href="/auth/login"
                className="block w-full text-center text-blue-600 hover:text-blue-500"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            Starred Sardine
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Vérification de votre adresse email
          </p>
        </div>
        
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
