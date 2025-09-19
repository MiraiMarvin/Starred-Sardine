'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { RegisterData } from '@/lib/api';
import OAuthSection from '@/components/auth/OAuthSection';

interface RegisterFormProps {
    onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
    const { register: registerUser } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
        watch
    } = useForm<RegisterData & { confirmPassword: string; acceptTerms: boolean }>();

    const password = watch('password');

    const onSubmit = async (data: RegisterData & { confirmPassword: string; acceptTerms: boolean }) => {
        if (data.password !== data.confirmPassword) {
            setError('confirmPassword', { 
                type: 'manual', 
                message: 'Les mots de passe ne correspondent pas' 
            });
            return;
        }

        try {
            setIsLoading(true);
            
            await registerUser({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password
            });
            onSuccess?.();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Erreur lors de l\'inscription';
            setError('root', { message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {errors.root && (
                <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">
                        {errors.root.message}
                    </div>
                </div>
            )}

            <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    Prénom
                </label>
                <input
                    {...register('firstName', {
                        required: 'Le prénom est requis',
                        minLength: {
                            value: 2,
                            message: 'Le prénom doit contenir au moins 2 caractères'
                        }
                    })}
                    type="text"
                    autoComplete="given-name"
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Votre prénom"
                />
                {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
            </div>

            <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Nom
                </label>
                <input
                    {...register('lastName', {
                        required: 'Le nom est requis',
                        minLength: {
                            value: 2,
                            message: 'Le nom doit contenir au moins 2 caractères'
                        }
                    })}
                    type="text"
                    autoComplete="family-name"
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Votre nom"
                />
                {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Adresse email
                </label>
                <input
                    {...register('email', {
                        required: 'L\'email est requis',
                        pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Adresse email invalide'
                        }
                    })}
                    type="email"
                    autoComplete="email"
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="votre@email.com"
                />
                {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Mot de passe
                </label>
                <div className="mt-1 relative">
                    <input
                        {...register('password', {
                            required: 'Le mot de passe est requis',
                            minLength: {
                                value: 8,
                                message: 'Le mot de passe doit contenir au moins 8 caractères'
                            },
                            pattern: {
                                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
                            }
                        })}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="Votre mot de passe"
                    />
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                    </button>
                </div>
                {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirmer le mot de passe
                </label>
                <div className="mt-1 relative">
                    <input
                        {...register('confirmPassword', {
                            required: 'La confirmation du mot de passe est requise',
                            validate: (value) => 
                                value === password || 'Les mots de passe ne correspondent pas'
                        })}
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="Confirmez votre mot de passe"
                    />
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        {showConfirmPassword ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                    </button>
                </div>
                {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
            </div>

            <div>
                <label className="flex items-start">
                    <input
                        {...register('acceptTerms', {
                            required: 'Vous devez accepter les conditions d\'utilisation'
                        })}
                        type="checkbox"
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                        J'accepte les{' '}
                        <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                            conditions d'utilisation
                        </Link>{' '}
                        et la{' '}
                        <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                            politique de confidentialité
                        </Link>
                    </span>
                </label>
                {errors.acceptTerms && (
                    <p className="mt-1 text-sm text-red-600">{errors.acceptTerms.message}</p>
                )}
            </div>

            {/* Bouton d'inscription */}
            <div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Création du compte...
                        </div>
                    ) : (
                        'Créer mon compte'
                    )}
                </button>
            </div>

            <OAuthSection />

            <div className="text-center">
                <p className="text-sm text-gray-600">
                    Déjà un compte ?{' '}
                    <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                        Se connecter
                    </Link>
                </p>
            </div>
        </form>
    );
};

export default RegisterForm;