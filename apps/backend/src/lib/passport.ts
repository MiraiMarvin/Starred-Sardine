import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { prisma } from './prisma';
import { logger } from '../utils/logger';

// Configuration Passport
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Stratégie Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      
      if (!email) {
        return done(new Error('Email non disponible depuis Google'), false);
      }

      // Chercher un utilisateur existant
      let user = await prisma.user.findUnique({
        where: { email }
      });

      if (user) {
        // Utilisateur existant - mettre à jour les infos Google si nécessaire
        logger.info(`Connexion OAuth Google pour utilisateur existant: ${email}`);
        return done(null, user);
      }

      // Créer un nouvel utilisateur
      user = await prisma.user.create({
        data: {
          email,
          firstName: profile.name?.givenName || profile.displayName || 'Utilisateur',
          lastName: profile.name?.familyName || '',
          password: 'oauth-google', // Mot de passe fictif pour OAuth
          isEmailVerified: true, // Email vérifié par Google
          role: 'USER'
        }
      });

      logger.info(`Nouvel utilisateur créé via Google OAuth: ${email}`);
      return done(null, user);
      
    } catch (error) {
      logger.error('Erreur lors de l\'authentification Google:', error);
      return done(error, false);
    }
  }));
}

// Stratégie GitHub OAuth
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/github/callback`
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      const email = profile.emails?.[0]?.value;
      
      if (!email) {
        return done(new Error('Email non disponible depuis GitHub'), false);
      }

      // Chercher un utilisateur existant
      let user = await prisma.user.findUnique({
        where: { email }
      });

      if (user) {
        // Utilisateur existant
        logger.info(`Connexion OAuth GitHub pour utilisateur existant: ${email}`);
        return done(null, user);
      }

      // Créer un nouvel utilisateur
      const [firstName, ...lastNameParts] = (profile.displayName || profile.username || 'Utilisateur').split(' ');
      
      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName: lastNameParts.join(' ') || '',
          password: 'oauth-github', // Mot de passe fictif pour OAuth
          isEmailVerified: true, // Email vérifié par GitHub
          role: 'USER'
        }
      });

      logger.info(`Nouvel utilisateur créé via GitHub OAuth: ${email}`);
      return done(null, user);
      
    } catch (error) {
      logger.error('Erreur lors de l\'authentification GitHub:', error);
      return done(error, false);
    }
  }));
}

export default passport;
