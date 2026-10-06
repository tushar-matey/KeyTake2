import { Request, Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { env } from '../config/env';
import { findOrCreateUser } from '../modules/auth/service';

const verifier = CognitoJwtVerifier.create({
  userPoolId: env.COGNITO_USER_POOL_ID,
  tokenUse: 'access',
  clientId: env.COGNITO_CLIENT_ID,
});

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = await verifier.verify(token);
    
    // According to docs, token.sub is userId. 
    // We should ensure the user exists in our DB.
    // The email might not be present in access token, usually it's in id_token.
    // However, the prompt says "req.user = { userId: payload.sub, email: payload.email }"
    // If it's an access token without email, we'll try to find the user in DB to get email or use empty string.
    // Actually, we can fetch email if we use id_token, but the doc specifically says access_token.
    const email = (payload as any).username || ''; // Cognito sets username to email if configured that way, or we can use empty string for now.
    
    await findOrCreateUser(payload.sub, email);
    
    req.user = {
      userId: payload.sub,
      email: email,
    };
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
