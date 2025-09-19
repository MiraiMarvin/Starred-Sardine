export const emailService = {
  sendVerificationEmail: async (email: string, token: string) => {
    // Ici vous implémenteriez l'envoi d'email avec Nodemailer
    console.log(`Sending verification email to ${email} with token ${token}`);
    

    return true;
  },

  sendPasswordResetEmail: async (email: string, token: string) => {
    // Ici vous implémenteriez l'envoi d'email de reset de mot de passe
    console.log(`Sending password reset email to ${email} with token ${token}`);
    

    return true;
  },

  sendWelcomeEmail: async (email: string, firstName: string) => {
    
    console.log(`Sending welcome email to ${firstName} at ${email}`);
    return true;
  }
};