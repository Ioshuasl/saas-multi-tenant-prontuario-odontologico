import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import { AuditAction, writeAuditLogSafe } from '../../../shared/database/write_audit.js';
import { medicalRecordPatientIdParamSchema } from '../schemas/medical_record.schema.js';
import {
  attachmentConfirmSchema,
  attachmentDeleteSchema,
  attachmentIdParamSchema,
  attachmentListQuerySchema,
  attachmentPresignSchema,
} from '../schemas/attachment.schema.js';
import { ListService } from '../services/attachment/attachment_list.service.js';
import { PresignService } from '../services/attachment/attachment_presign.service.js';
import { ConfirmService } from '../services/attachment/attachment_confirm.service.js';
import { DownloadService } from '../services/attachment/attachment_download.service.js';
import { DeleteService } from '../services/attachment/attachment_delete.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class AttachmentController {
  constructor(
    private readonly listAttachments = new ListService(),
    private readonly presignAttachment = new PresignService(),
    private readonly confirmAttachment = new ConfirmService(),
    private readonly downloadAttachment = new DownloadService(),
    private readonly deleteAttachment = new DeleteService(),
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = medicalRecordPatientIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const query = attachmentListQuerySchema.safeParse(req.query);
    if (!query.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, query.error);
    }
    const result = await this.listAttachments.execute(ctx, params.data.patientId, query.data);
    res.status(200).json({ data: result });
  };

  presign = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = medicalRecordPatientIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = attachmentPresignSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.presignAttachment.execute(ctx, params.data.patientId, parsed.data);
    res.status(200).json({ data: result });
  };

  confirm = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = medicalRecordPatientIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = attachmentConfirmSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const attachment = await this.confirmAttachment.execute(ctx, params.data.patientId, parsed.data);
    res.status(201).json({ data: attachment });
  };

  download = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = attachmentIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.downloadAttachment.execute(ctx, params.data.id);
    void writeAuditLogSafe({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: AuditAction.CLINICAL_READ,
      resourceType: 'attachment',
      resourceId: result.attachmentId,
      patientId: result.patientId,
      ipAddress: req.ip,
      userAgent: req.header('user-agent') ?? undefined,
      metadata: { path: req.originalUrl, method: req.method },
    });
    res.status(200).json({
      data: { downloadUrl: result.downloadUrl, expiresIn: result.expiresIn },
    });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = attachmentIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = attachmentDeleteSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const attachment = await this.deleteAttachment.execute(ctx, params.data.id, parsed.data);
    res.status(200).json({ data: attachment });
  };
}
