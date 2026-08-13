import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { VerifyAction } from '../../actions/public_booking/public_booking_verify.action.js';
import type { PublicBookingVerifySchema } from '../../schemas/public_booking.schema.js';

export class VerifyService {
  constructor(private readonly verifyAction = new VerifyAction()) {}

  async execute(
    ctx: RequestContext,
    publicBookingSchema: PublicBookingVerifySchema,
    meta?: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    return this.verifyAction.execute(ctx, publicBookingSchema, meta);
  }
}
