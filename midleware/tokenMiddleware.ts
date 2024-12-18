import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Define the type for a request that includes the user property
declare module 'next' {
  interface NextApiRequest {
    user?: JwtPayload | string;
  }
}

// Middleware to verify JWT
export function verifyTokenMiddleware(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = req.headers.authorization?.split(' ')[1]; // Assuming the format is "Bearer <token>"

    if (!token) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }

    try {
      const secret = process.env.JWT_SECRET || '';

      if (!secret) {
        throw new Error('JWT secret is not defined');
      }

      const decoded = jwt.verify(token, secret);
      req.user = decoded; // Attach the decoded payload to the request

      return handler(req, res); // Proceed to the actual handler
    } catch (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  };
}
