import { Router } from 'express';
import { buildAuthRoutes } from './routes/v1/auth.routes.js';
import { buildInvitationRoutes } from './routes/v1/invitation.routes.js';
import { buildUserRoutes } from './routes/v1/user.routes.js';

export function buildIdentityRouter(): Router {
  const router = Router();
  router.use('/auth', buildAuthRoutes());
  router.use('/users/invitations', buildInvitationRoutes());
  router.use('/users', buildUserRoutes());
  return router;
}
