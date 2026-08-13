import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import { anamnesisFormCreateSchema } from '../schemas/anamnesis_form.schema.js';
import { ListService } from '../services/anamnesis_form/anamnesis_form_list.service.js';
import { CreateService } from '../services/anamnesis_form/anamnesis_form_create.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class AnamnesisFormController {
  constructor(
    private readonly listForms = new ListService(),
    private readonly createForm = new CreateService(),
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const result = await this.listForms.execute(ctx);
    res.status(200).json({ data: result });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = anamnesisFormCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const form = await this.createForm.execute(ctx, parsed.data);
    res.status(201).json({ data: form });
  };
}
