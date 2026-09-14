import { Router, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { ReadyController } from '../../controllers/ready.controller.js';

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}

export function buildReadyRoutes(): Router {
  const router = Router();
  const ready = new ReadyController();
  router.get('/ready', asyncHandler(ready.get));
  return router;
}
