import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

// Configuration du transporteur email
const createTransporter = () => {
  if (process.env.NODE_ENV === 'development') {
    // Pour le développement, utiliser Ethereal Email (compte test)
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }

  // Pour la production, utiliser les variables d'environnement
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Fonction pour compiler les templates
const compileTemplate = async (templateName: string, variables: any) => {
  try {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);
    const basePath = path.join(__dirname, '../templates/emails', 'base.hbs');
    
    const baseTemplate = await fs.readFile(basePath, 'utf-8');
    const contentTemplate = await fs.readFile(templatePath, 'utf-8');
    
    const compiledContent = handlebars.compile(contentTemplate)(variables);
    const compiledEmail = handlebars.compile(baseTemplate)({
      ...variables,
      content: compiledContent
    });
    
    return compiledEmail;
  } catch (error) {
    logger.error('Erreur lors de la compilation du template:', error);
    throw new Error(`Impossible de compiler le template ${templateName}`);
  }
};

// Variables communes pour tous les emails
const getCommonVariables = () => ({
  companyName: process.env.COMPANY_NAME || 'Starred Sardine',
  tagline: 'Votre boilerplate de confiance',
  companyAddress: 'Paris, France',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@localhost.com'
});

export const emailService = {
  // Preview des emails en développement
  previewEmail: async (templateName: string, variables: any) => {
    const html = await compileTemplate(templateName, {
      ...getCommonVariables(),
      ...variables
    });
    
    // Sauvegarder le preview
    const previewPath = path.join(__dirname, '../templates/previews');
    await fs.mkdir(previewPath, { recursive: true });
    await fs.writeFile(
      path.join(previewPath, `${templateName}-preview.html`), 
      html
    );
    
    logger.info(`Preview généré: previews/${templateName}-preview.html`);
    return html;
  },

  sendEmail: async (to: string, subject: string, templateName: string, variables: any) => {
    try {
      const transporter = createTransporter();
      const html = await compileTemplate(templateName, {
        ...getCommonVariables(),
        ...variables
      });

      const mailOptions = {
        from: `"${getCommonVariables().companyName}" <${process.env.FROM_EMAIL}>`,
        to,
        subject,
        html
      };

      if (process.env.NODE_ENV === 'development') {
        // En développement, sauvegarder le preview
        await emailService.previewEmail(templateName, variables);
        logger.info(`Email preview généré pour: ${templateName}`);
        console.log(`📧 Email envoyé à ${to}: ${subject}`);
        return { messageId: 'dev-preview' };
      }

      const result = await transporter.sendMail(mailOptions);
      logger.info(`Email envoyé avec succès à ${to}`, { messageId: result.messageId });
      return result;
    } catch (error) {
      logger.error('Erreur lors de l\'envoi d\'email:', error);
      throw error;
    }
  },

  sendVerificationEmail: async (email: string, token: string) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email/${token}`;
    
    return emailService.sendEmail(
      email,
      'Vérifiez votre adresse email',
      'email-verification',
      {
        verificationUrl,
        subject: 'Vérifiez votre adresse email'
      }
    );
  },

  sendPasswordResetEmail: async (email: string, token: string) => {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/${token}`;
    
    return emailService.sendEmail(
      email,
      'Réinitialisation de votre mot de passe',
      'password-reset',
      {
        resetUrl,
        subject: 'Réinitialisation de votre mot de passe'
      }
    );
  },

  sendWelcomeEmail: async (email: string, firstName: string) => {
    const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;
    
    return emailService.sendEmail(
      email,
      `Bienvenue ${firstName} !`,
      'welcome',
      {
        firstName,
        dashboardUrl,
        subject: `Bienvenue ${firstName} !`
      }
    );
  },

  sendPaymentConfirmation: async (email: string, paymentData: {
    firstName: string;
    transactionId: string;
    amount: string;
    currency: string;
    description?: string;
    subscriptionActivated?: boolean;
    billingName: string;
    billingEmail: string;
    billingAddress?: string;
  }) => {
    const invoiceUrl = `${process.env.FRONTEND_URL}/invoices/${paymentData.transactionId}`;
    
    return emailService.sendEmail(
      email,
      'Confirmation de paiement',
      'payment-confirmation',
      {
        ...paymentData,
        invoiceUrl,
        paymentDate: new Date().toLocaleDateString('fr-FR'),
        subject: 'Confirmation de paiement'
      }
    );
  }
};