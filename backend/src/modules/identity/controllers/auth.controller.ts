import type { Request, Response } from 'express';
import { REFRESH_COOKIE_NAME } from '../../../shared/auth/refresh_cookie.js';
import { clearRefreshCookie, setRefreshCookie } from '../../../shared/auth/refresh_cookie.js';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import {
  loginSchema,
  passwordForgotSchema,
  passwordResetSchema,
  signupSchema,
  switchTenantSchema,
} from '../schemas/auth.schema.js';
import { CreateService as SignupService } from '../services/auth/auth_signup.service.js';
import { LoginService } from '../services/auth/auth_login.service.js';
import { RefreshService } from '../services/auth/auth_refresh.service.js';
import { LogoutService } from '../services/auth/auth_logout.service.js';
import { LogoutAllService } from '../services/auth/auth_logout_all.service.js';
import { MeService } from '../services/auth/auth_me.service.js';
import { SwitchTenantService } from '../services/auth/auth_switch_tenant.service.js';
import { ForgotService } from '../services/auth/auth_password_forgot.service.js';
import { ResetService } from '../services/auth/auth_password_reset.service.js';

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

export class AuthController {
  constructor(
    private readonly signupService = new SignupService(),
    private readonly loginService = new LoginService(),
    private readonly refreshService = new RefreshService(),
    private readonly logoutService = new LogoutService(),
    private readonly logoutAllService = new LogoutAllService(),
    private readonly meService = new MeService(),
    private readonly switchTenantService = new SwitchTenantService(),
    private readonly forgotService = new ForgotService(),
    private readonly resetService = new ResetService(),
  ) {}

  signup = async (req: Request, res: Response): Promise<void> => {
    const signupInput = parseBody(signupSchema, req.body);
    const result = await this.signupService.execute(signupInput, requestMeta(req));

    setRefreshCookie(res, result.refreshToken);
    res.status(201).json({
      data: {
        accessToken: result.accessToken,
        user: result.user,
        tenant: result.tenant,
        membership: result.membership,
      },
    });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const loginInput = parseBody(loginSchema, req.body);
    const result = await this.loginService.execute(loginInput, requestMeta(req));

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

  refresh = async (req: Request, res: Response): Promise<void> => {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    const result = await this.refreshService.execute(rawRefreshToken, requestMeta(req));

    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({
      data: {
        accessToken: result.accessToken,
      },
    });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    const result = await this.logoutService.execute(rawRefreshToken, requestMeta(req));

    clearRefreshCookie(res);
    res.status(200).json({ data: result });
  };

  logoutAll = async (req: Request, res: Response): Promise<void> => {
    if (!req.ctx) {
      throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
    }

    const result = await this.logoutAllService.execute(req.ctx, requestMeta(req));

    clearRefreshCookie(res);
    res.status(200).json({ data: result });
  };

  me = async (req: Request, res: Response): Promise<void> => {
    if (!req.ctx) {
      throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
    }
    const result = await this.meService.execute(req.ctx);
    res.status(200).json({ data: result });
  };

  switchTenant = async (req: Request, res: Response): Promise<void> => {
    if (!req.ctx) {
      throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
    }
    const switchInput = parseBody(switchTenantSchema, req.body);
    const result = await this.switchTenantService.execute(
      req.ctx,
      switchInput,
      requestMeta(req),
    );

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

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const forgotInput = parseBody(passwordForgotSchema, req.body);
    const result = await this.forgotService.execute(forgotInput);
    res.status(202).json({ data: result });
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    const resetInput = parseBody(passwordResetSchema, req.body);
    const result = await this.resetService.execute(resetInput, requestMeta(req));
    res.status(200).json({ data: result });
  };
}
