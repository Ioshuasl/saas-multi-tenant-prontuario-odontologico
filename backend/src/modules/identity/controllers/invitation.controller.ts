import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import {
  invitationAcceptSchema,
  invitationCreateSchema,
  invitationIdParamSchema,
} from '../schemas/invitation.schema.js';
import { CreateService } from '../services/invitation/invitation_create.service.js';
import { ListService } from '../services/invitation/invitation_list.service.js';
import { DeleteService } from '../services/invitation/invitation_delete.service.js';
import { ResendService } from '../services/invitation/invitation_resend.service.js';
import { AcceptService } from '../services/invitation/invitation_accept.service.js';
import { setRefreshCookie } from '../../../shared/auth/refresh_cookie.js';

function requestMeta(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.header('user-agent') ?? undefined,
  };
}

function parseBody<T>(
  schema: { safeParse: (input: unknown) => { success: boolean; data?: T; error?: unknown } },
  body: unknown,
): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
  }
  return parsed.data as T;
}

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class InvitationController {
  constructor(
    private readonly createService = new CreateService(),
    private readonly listService = new ListService(),
    private readonly deleteService = new DeleteService(),
    private readonly resendService = new ResendService(),
    private readonly acceptService = new AcceptService(),
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const invitationSchema = parseBody(invitationCreateSchema, req.body);
    const result = await this.createService.execute(ctx, invitationSchema, requestMeta(req));
    res.status(201).json({ data: result });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const result = await this.listService.execute(ctx);
    res.status(200).json({ data: result });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = invitationIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.deleteService.execute(ctx, params.data.id);
    res.status(200).json({ data: result });
  };

  resend = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = invitationIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.resendService.execute(ctx, params.data.id);
    res.status(200).json({ data: result });
  };

  accept = async (req: Request, res: Response): Promise<void> => {
    const invitationSchema = parseBody(invitationAcceptSchema, req.body);
    const result = await this.acceptService.execute(invitationSchema, requestMeta(req));
    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({
      data: {
        accessToken: result.accessToken,
        user: result.user,
        tenant: result.tenant,
        membership: result.membership,
      },
    });
  };
}
