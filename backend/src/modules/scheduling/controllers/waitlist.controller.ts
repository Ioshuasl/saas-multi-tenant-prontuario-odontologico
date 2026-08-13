import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import {
  waitlistAcceptTokenParamSchema,
  waitlistCreateSchema,
  waitlistIdParamSchema,
  waitlistListQuerySchema,
  waitlistOfferSchema,
} from '../schemas/waitlist.schema.js';
import { ListService } from '../services/waitlist/waitlist_list.service.js';
import { CreateService } from '../services/waitlist/waitlist_create.service.js';
import { DeleteService } from '../services/waitlist/waitlist_delete.service.js';
import { OfferService } from '../services/waitlist/waitlist_offer.service.js';
import { AcceptService } from '../services/waitlist/waitlist_accept.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class WaitlistController {
  constructor(
    private readonly waitlistList = new ListService(),
    private readonly waitlistCreate = new CreateService(),
    private readonly waitlistDelete = new DeleteService(),
    private readonly waitlistOffer = new OfferService(),
    private readonly waitlistAccept = new AcceptService(),
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = waitlistListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.waitlistList.execute(ctx, parsed.data);
    res.status(200).json({ data: result });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = waitlistCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.waitlistCreate.execute(ctx, parsed.data);
    res.status(201).json({ data: result });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = waitlistIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.waitlistDelete.execute(ctx, params.data.id);
    res.status(200).json({ data: result });
  };

  offer = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = waitlistIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = waitlistOfferSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const idempotencyKey = req.header('idempotency-key') ?? req.header('Idempotency-Key');
    const result = await this.waitlistOffer.execute(ctx, params.data.id, parsed.data, idempotencyKey);
    res.status(200).json({ data: result });
  };

  accept = async (req: Request, res: Response): Promise<void> => {
    const params = waitlistAcceptTokenParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.waitlistAccept.executeFromToken(req.requestId, params.data.token);
    res.status(200).json({ data: result });
  };
}
