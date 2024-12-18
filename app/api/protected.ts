import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyTokenMiddleware } from '@/midleware/tokenMiddleware';

const allowedRoutes = ['/api/auth'];

const protectedHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Allow specific auth routes to bypass the middleware
  if (allowedRoutes.includes(req.url || '')) {
    return res.status(200).json({ message: 'Route allowed without authentication' });
  }

  res.status(200).json({ message: 'You have access to this protected route', user: req.user });
};

export default verifyTokenMiddleware(protectedHandler);