import { Router } from 'express';
import {
  buildAppointmentRoutes,
  buildAvailabilityRoutes,
} from './routes/v1/appointment.routes.js';
import {
  buildAppointmentSeriesRoutes,
  buildScheduleBlockRoutes,
} from './routes/v1/schedule_extras.routes.js';

export function buildSchedulingRouter(): Router {
  const router = Router();
  router.use('/appointments', buildAppointmentRoutes());
  router.use('/availability', buildAvailabilityRoutes());
  router.use('/schedule-blocks', buildScheduleBlockRoutes());
  router.use('/appointment-series', buildAppointmentSeriesRoutes());
  return router;
}
