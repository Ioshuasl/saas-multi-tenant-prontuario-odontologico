import { Router, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { publicTenantContextMiddleware } from '../../../../shared/middlewares/public_tenant_context.middleware.js';
import {
  bodyPhoneKey,
  clientIp,
  rateLimit,
} from '../../../../shared/middlewares/rate_limit.middleware.js';
import { PublicBookingController } from '../../controllers/public_booking.controller.js';
import { WaitlistController } from '../../controllers/waitlist.controller.js';

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}

export function buildPublicBookingRoutes(): Router {
  const router = Router();
  const controller = new PublicBookingController();
  const waitlist = new WaitlistController();
  const slugCtx: RequestHandler[] = [publicTenantContextMiddleware];

  router.get(
    '/clinics/:slug',
    ...slugCtx,
    asyncHandler(controller.clinic),
  );
  router.get(
    '/clinics/:slug/availability',
    ...slugCtx,
    rateLimit({ windowMs: 60_000, max: 60, key: (req) => `public:avail:ip:${clientIp(req)}` }),
    asyncHandler(controller.availability),
  );
  router.post(
    '/clinics/:slug/bookings',
    ...slugCtx,
    rateLimit({ windowMs: 60 * 60_000, max: 20, key: (req) => `public:book:ip:${clientIp(req)}` }),
    rateLimit({
      windowMs: 60 * 60_000,
      max: 5,
      key: (req) => `public:book:phone:${bodyPhoneKey(req)}`,
    }),
    asyncHandler(controller.create),
  );
  router.post(
    '/clinics/:slug/bookings/verify',
    ...slugCtx,
    rateLimit({ windowMs: 60 * 60_000, max: 30, key: (req) => `public:verify:ip:${clientIp(req)}` }),
    asyncHandler(controller.verify),
  );
  router.get('/appointments/:token/confirm', asyncHandler(controller.confirm));
  router.post(
    '/waitlist/:token/accept',
    rateLimit({ windowMs: 60 * 60_000, max: 30, key: (req) => `public:waitlist:ip:${clientIp(req)}` }),
    asyncHandler(waitlist.accept),
  );

  return router;
}
