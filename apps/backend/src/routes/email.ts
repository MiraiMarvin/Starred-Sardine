import { Router, Request, Response } from 'express';
import { emailService } from '../services/emailService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Route pour prévisualiser les emails (développement uniquement)
if (process.env.NODE_ENV === 'development') {
  
  // Preview email de bienvenue
  router.get('/preview/welcome', asyncHandler(async (req: Request, res: Response) => {
    const html = await emailService.previewEmail('welcome', {
      firstName: 'Jean',
      dashboardUrl: 'http://localhost:3000/dashboard'
    });
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }));

  // Preview email de vérification
  router.get('/preview/email-verification', asyncHandler(async (req: Request, res: Response) => {
    const html = await emailService.previewEmail('email-verification', {
      firstName: 'Jean',
      verificationUrl: 'http://localhost:3000/auth/verify-email/sample-token'
    });
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }));

  // Preview email de reset de mot de passe
  router.get('/preview/password-reset', asyncHandler(async (req: Request, res: Response) => {
    const html = await emailService.previewEmail('password-reset', {
      firstName: 'Jean',
      resetUrl: 'http://localhost:3000/auth/reset-password/sample-token'
    });
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }));

  // Preview email de confirmation de paiement
  router.get('/preview/payment-confirmation', asyncHandler(async (req: Request, res: Response) => {
    const html = await emailService.previewEmail('payment-confirmation', {
      firstName: 'Jean',
      transactionId: 'txn_1234567890',
      amount: '29.99',
      currency: 'EUR',
      description: 'Abonnement Premium - 1 mois',
      subscriptionActivated: true,
      billingName: 'Jean Dupont',
      billingEmail: 'jean.dupont@example.com',
      billingAddress: '123 Rue de la Paix, 75001 Paris',
      invoiceUrl: 'http://localhost:3000/invoices/txn_1234567890',
      paymentDate: new Date().toLocaleDateString('fr-FR')
    });
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }));

  // Liste des previews disponibles
  router.get('/preview', asyncHandler(async (req: Request, res: Response) => {
    const previews = [
      { name: 'Bienvenue', url: '/api/emails/preview/welcome' },
      { name: 'Vérification email', url: '/api/emails/preview/email-verification' },
      { name: 'Reset mot de passe', url: '/api/emails/preview/password-reset' },
      { name: 'Confirmation paiement', url: '/api/emails/preview/payment-confirmation' }
    ];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Previews - Starred Sardine</title>
        <style>
          body { font-family: system-ui; margin: 40px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
          h1 { color: #333; margin-bottom: 30px; }
          .preview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
          .preview-card { border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; background: #fafafa; }
          .preview-card h3 { margin: 0 0 10px 0; color: #555; }
          .preview-card a { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          .preview-card a:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📧 Email Templates Preview</h1>
          <div class="preview-grid">
            ${previews.map(preview => `
              <div class="preview-card">
                <h3>${preview.name}</h3>
                <a href="${preview.url}" target="_blank">Voir le preview</a>
              </div>
            `).join('')}
          </div>
        </div>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }));
}

export { router as emailRoutes };
