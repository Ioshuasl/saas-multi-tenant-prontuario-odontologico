import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import {
  accountConnectSchema,
  accountPatchSchema,
  automationKeyParamSchema,
  automationPatchSchema,
  logsQuerySchema,
} from '../schemas/messaging.schema.js';
import { GetService as AccountGetService } from '../services/account/account_get.service.js';
import { ConnectService } from '../services/account/account_connect.service.js';
import { TestService } from '../services/account/account_test.service.js';
import { DeleteService } from '../services/account/account_delete.service.js';
import { PatchService } from '../services/account/account_patch.service.js';
import { ListService as TemplateListService } from '../services/template/template_list.service.js';
import { ListService as AutomationListService } from '../services/automation/automation_list.service.js';
import { UpdateService as AutomationUpdateService } from '../services/automation/automation_update.service.js';
import { GetService as UsageGetService } from '../services/usage/usage_get.service.js';
import { ListService as LogListService } from '../services/log/log_list.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class MessagingController {
  constructor(
    private readonly accountGet = new AccountGetService(),
    private readonly accountConnect = new ConnectService(),
    private readonly accountTest = new TestService(),
    private readonly accountDelete = new DeleteService(),
    private readonly accountPatch = new PatchService(),
    private readonly templateList = new TemplateListService(),
    private readonly automationList = new AutomationListService(),
    private readonly automationUpdate = new AutomationUpdateService(),
    private readonly usageGet = new UsageGetService(),
    private readonly logList = new LogListService(),
  ) {}

  getAccount = async (req: Request, res: Response): Promise<void> => {
    const data = await this.accountGet.execute(requireCtx(req));
    res.status(200).json({ data });
  };

  connectAccount = async (req: Request, res: Response): Promise<void> => {
    const parsed = accountConnectSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const data = await this.accountConnect.execute(requireCtx(req), parsed.data);
    res.status(201).json({ data });
  };

  testAccount = async (req: Request, res: Response): Promise<void> => {
    const data = await this.accountTest.execute(requireCtx(req));
    res.status(200).json({ data });
  };

  deleteAccount = async (req: Request, res: Response): Promise<void> => {
    const data = await this.accountDelete.execute(requireCtx(req));
    res.status(200).json({ data });
  };

  patchAccount = async (req: Request, res: Response): Promise<void> => {
    const parsed = accountPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const data = await this.accountPatch.execute(requireCtx(req), parsed.data);
    res.status(200).json({ data });
  };

  listTemplates = async (req: Request, res: Response): Promise<void> => {
    const data = await this.templateList.execute(requireCtx(req));
    res.status(200).json({ data });
  };

  listAutomations = async (req: Request, res: Response): Promise<void> => {
    const data = await this.automationList.execute(requireCtx(req));
    res.status(200).json({ data });
  };

  patchAutomation = async (req: Request, res: Response): Promise<void> => {
    const keyParsed = automationKeyParamSchema.safeParse(req.params);
    const bodyParsed = automationPatchSchema.safeParse(req.body);
    if (!keyParsed.success || !bodyParsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, {
        params: keyParsed.success ? undefined : keyParsed.error,
        body: bodyParsed.success ? undefined : bodyParsed.error,
      });
    }
    const data = await this.automationUpdate.execute(requireCtx(req), keyParsed.data.key, bodyParsed.data);
    res.status(200).json({ data });
  };

  getUsage = async (req: Request, res: Response): Promise<void> => {
    const data = await this.usageGet.execute(requireCtx(req));
    res.status(200).json({ data });
  };

  listLogs = async (req: Request, res: Response): Promise<void> => {
    const parsed = logsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.logList.execute(requireCtx(req), parsed.data);
    res.status(200).json({ data: result.items, meta: { nextCursor: result.nextCursor } });
  };
}
