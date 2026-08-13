import { Router } from 'express';
import { buildMedicalRecordRoutes } from './routes/v1/medical_record.routes.js';
import { buildAnamnesisFormRoutes } from './routes/v1/anamnesis_form.routes.js';
import { buildPublicAnamnesisRoutes } from './routes/v1/public_anamnesis.routes.js';
import { buildAttachmentRoutes } from './routes/v1/attachment.routes.js';

export function buildClinicalRecordsRouter(): Router {
  const router = Router();
  router.use('/anamnesis-forms', buildAnamnesisFormRoutes());
  router.use('/patients', buildMedicalRecordRoutes());
  router.use('/attachments', buildAttachmentRoutes());
  return router;
}

export function buildPublicAnamnesisRouter(): Router {
  return buildPublicAnamnesisRoutes();
}
