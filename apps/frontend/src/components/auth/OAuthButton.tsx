import React from 'react';

interface OAuthButtonProps {
  provider: 'google' | 'github';
  children: React.ReactNode;
  className?: string;
}

const OAuthButton: React.FC<OAuthButtonProps> = ({ provider, children, className = '' }) => {
  const handleOAuthLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/auth/${provider}`;
  };

  const baseClasses = "w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200";
  
  const providerClasses = {
    google: "focus:ring-red-500 hover:border-red-300",
    github: "focus:ring-gray-500 hover:border-gray-400"
  };

  return (
    <button
      type="button"
      onClick={handleOAuthLogin}
      className={`${baseClasses} ${providerClasses[provider]} ${className}`}
    >
      {children}
    </button>
  );
};

export default OAuthButton;
