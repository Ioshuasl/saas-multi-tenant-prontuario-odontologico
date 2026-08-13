import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { CreateAction } from '../../actions/public_booking/public_booking_create.action.js';
import type { PublicBookingCreateSchema } from '../../schemas/public_booking.schema.js';

export class CreateService {
  constructor(private readonly createAction = new CreateAction()) {}

  async execute(ctx: RequestContext, publicBookingSchema: PublicBookingCreateSchema) {
    return this.createAction.execute(ctx, publicBookingSchema);
  }
}
