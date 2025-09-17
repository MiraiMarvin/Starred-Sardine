import React from 'react';
import Link from 'next/link';
import { CheckIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  const features = [
    'Authentification sécurisée',
    'Gestion des paiements Stripe',
    'Dashboard utilisateur complet',
    'Gestion des abonnements',
    'Templates d\'emails personnalisés',
    'API REST complète'
  ];

  return (
    <div className="bg-white">

      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Plateforme E-Commerce
              <span className="text-blue-600"> Moderne</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Boilerplate complet avec authentification, paiements Stripe, et gestion d'utilisateurs. 
              Démarrez votre projet e-commerce en quelques minutes.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/auth/register"
                className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Commencer gratuitement
              </Link>
              <Link 
                href="/pricing" 
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                Voir les tarifs <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">
              Fonctionnalités complètes
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Tout ce dont vous avez besoin pour démarrer
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {features.map((feature) => (
                <div key={feature} className="relative flex items-start">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <CheckIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div className="ml-4">
                    <p className="text-base font-semibold leading-7 text-gray-900">
                      {feature}
                    </p>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Prêt à commencer ?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-200">
              Créez votre compte et découvrez toutes les fonctionnalités de notre plateforme.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/auth/register"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                S'inscrire gratuitement
              </Link>
              <Link 
                href="/auth/login" 
                className="text-sm font-semibold leading-6 text-white"
              >
                Déjà un compte ? Se connecter <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
