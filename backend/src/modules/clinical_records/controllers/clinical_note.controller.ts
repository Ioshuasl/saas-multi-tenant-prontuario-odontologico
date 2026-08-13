import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import { RecordImmutableError } from '../models/errors/clinical_records.errors.js';
import { medicalRecordPatientIdParamSchema } from '../schemas/medical_record.schema.js';
import {
  clinicalNoteAmendSchema,
  clinicalNoteCreateSchema,
  clinicalNoteIdParamSchema,
  clinicalNoteListQuerySchema,
} from '../schemas/clinical_note.schema.js';
import { ListService } from '../services/clinical_note/clinical_note_list.service.js';
import { CreateService } from '../services/clinical_note/clinical_note_create.service.js';
import { AmendService } from '../services/clinical_note/clinical_note_amend.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class ClinicalNoteController {
  constructor(
    private readonly listNotes = new ListService(),
    private readonly createNote = new CreateService(),
    private readonly amendNote = new AmendService(),
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = medicalRecordPatientIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const query = clinicalNoteListQuerySchema.safeParse(req.query);
    if (!query.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, query.error);
    }
    const result = await this.listNotes.execute(ctx, params.data.patientId, query.data);
    res.status(200).json({ data: result });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = medicalRecordPatientIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = clinicalNoteCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const note = await this.createNote.execute(ctx, params.data.patientId, parsed.data, {
      ip: req.ip,
    });
    res.status(201).json({ data: note });
  };

  amend = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = clinicalNoteIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = clinicalNoteAmendSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const note = await this.amendNote.execute(
      ctx,
      params.data.patientId,
      params.data.id,
      parsed.data,
      { ip: req.ip },
    );
    res.status(201).json({ data: note });
  };

  immutable = async (_req: Request, _res: Response): Promise<void> => {
    throw new RecordImmutableError();
  };
}
