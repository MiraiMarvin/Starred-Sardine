'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { userAPI, User } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  KeyIcon,
  ShieldCheckIcon,
  CalendarIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
    setValue
  } = useForm<ProfileFormData>();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch
  } = useForm<PasswordFormData>();

  // Surveiller le nouveau mot de passe pour validation
  const newPassword = watch('newPassword');

  useEffect(() => {
    if (user) {
      setValue('firstName', user.firstName);
      setValue('lastName', user.lastName);
      setValue('email', user.email);
    }
  }, [user, setValue]);

  const onUpdateProfile = async (data: ProfileFormData) => {
    try {
      setLoading(true);
      const response = await userAPI.updateProfile(data);
      
      if (response.data.success && response.data.data) {
        updateUser(response.data.data);
        toast.success('Profil mis à jour avec succès');
        setIsEditing(false);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onChangePassword = async (data: PasswordFormData) => {
    try {
      setLoading(true);
      const response = await userAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      if (response.data.success) {
        toast.success('Mot de passe modifié avec succès. Veuillez vous reconnecter.');
        setIsChangingPassword(false);
        resetPassword();
        // Rediriger vers la page de connexion après 2 secondes
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur lors du changement de mot de passe';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    resetProfile();
    if (user) {
      setValue('firstName', user.firstName);
      setValue('lastName', user.lastName);
      setValue('email', user.email);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      USER: { color: 'bg-gray-100 text-gray-800', label: 'Utilisateur' },
      PREMIUM: { color: 'bg-purple-100 text-purple-800', label: 'Premium' },
      ADMIN: { color: 'bg-red-100 text-red-800', label: 'Administrateur' }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.USER;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <ShieldCheckIcon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCircleIcon className="h-20 w-20 text-gray-300" />
              </div>
              <div className="ml-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-gray-500 flex items-center mt-1">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  {user.email}
                </p>
                <div className="mt-2 flex items-center space-x-3">
                  {getRoleBadge(user.role)}
                  <span className="text-sm text-gray-500 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Informations personnelles */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Informations personnelles
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Modifier
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSubmitProfile(onUpdateProfile)}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Annuler
                  </button>
                </div>
              )}
            </div>

            <div className="px-6 py-4">
              <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom
                    </label>
                    {isEditing ? (
                      <input
                        {...registerProfile('firstName', { 
                          required: 'Le prénom est requis',
                          minLength: { value: 2, message: 'Minimum 2 caractères' }
                        })}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="py-2 text-gray-900">{user.firstName}</p>
                    )}
                    {profileErrors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom
                    </label>
                    {isEditing ? (
                      <input
                        {...registerProfile('lastName', { 
                          required: 'Le nom est requis',
                          minLength: { value: 2, message: 'Minimum 2 caractères' }
                        })}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="py-2 text-gray-900">{user.lastName}</p>
                    )}
                    {profileErrors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      {...registerProfile('email', { 
                        required: 'L\'email est requis',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email invalide'
                        }
                      })}
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="py-2 text-gray-900">{user.email}</p>
                  )}
                  {profileErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Sécurité */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Sécurité
              </h2>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Changer le mot de passe
                </button>
              )}
            </div>

            <div className="px-6 py-4">
              {isChangingPassword ? (
                <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mot de passe actuel
                    </label>
                    <input
                      {...registerPassword('currentPassword', { 
                        required: 'Le mot de passe actuel est requis' 
                      })}
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nouveau mot de passe
                    </label>
                    <input
                      {...registerPassword('newPassword', { 
                        required: 'Le nouveau mot de passe est requis',
                        minLength: { value: 8, message: 'Minimum 8 caractères' },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                          message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'
                        }
                      })}
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      {...registerPassword('confirmPassword', { 
                        required: 'La confirmation est requise',
                        validate: value => value === newPassword || 'Les mots de passe ne correspondent pas'
                      })}
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? 'Modification...' : 'Modifier le mot de passe'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPassword(false);
                        resetPassword();
                      }}
                      className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Mot de passe</p>
                      <p className="text-sm text-gray-500">Dernière modification: il y a 30 jours</p>
                    </div>
                    <div className="text-xs text-gray-400">••••••••</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-green-900">Authentification à deux facteurs</p>
                      <p className="text-sm text-green-600">Prochainement disponible</p>
                    </div>
                    <ShieldCheckIcon className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistiques du compte */}
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Statistiques du compte
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-md">
                <p className="text-2xl font-bold text-blue-600">0</p>
                <p className="text-sm text-gray-600">Commandes</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-md">
                <p className="text-2xl font-bold text-green-600">0 €</p>
                <p className="text-sm text-gray-600">Total dépensé</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-md">
                <p className="text-2xl font-bold text-purple-600">{user.role}</p>
                <p className="text-sm text-gray-600">Statut</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
