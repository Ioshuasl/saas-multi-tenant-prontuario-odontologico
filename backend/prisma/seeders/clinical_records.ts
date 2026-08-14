import type { PrismaClient } from '@prisma/client';
import { idGenerator } from '../../src/shared/helpers/id_generator.js';

export async function seedClinicalRecords(
  prisma: PrismaClient,
  tenantId: string,
  patientIds: string[],
) {
  for (const patientId of patientIds) {
    const existing = await prisma.medicalRecord.findUnique({
      where: { tenantId_patientId: { tenantId, patientId } },
    });
    if (existing) continue;
    await prisma.medicalRecord.create({
      data: {
        id: idGenerator.next(),
        tenantId,
        patientId,
      },
    });
  }

  const form = await prisma.anamnesisForm.findFirst({
    where: { tenantId, name: 'Anamnese Geral' },
  });
  if (form) return;

  await prisma.anamnesisForm.create({
    data: {
      id: idGenerator.next(),
      tenantId,
      name: 'Anamnese Geral',
      version: 1,
      active: true,
      questions: [
        {
          id: 'allergy_meds',
          label: 'Possui alergia a medicamentos?',
          type: 'BOOLEAN_WITH_TEXT',
          alertWhen: { equals: true },
          alertSeverity: 'CRITICAL',
          alertCategory: 'ALLERGY',
        },
        {
          id: 'anticoagulant',
          label: 'Usa anticoagulante?',
          type: 'BOOLEAN_WITH_TEXT',
          alertWhen: { equals: true },
          alertSeverity: 'CRITICAL',
          alertCategory: 'MEDICATION',
        },
        {
          id: 'diabetes',
          label: 'É diabético?',
          type: 'SINGLE_CHOICE',
          options: ['Não', 'Tipo 1', 'Tipo 2', 'Gestacional'],
          alertWhen: { notEquals: 'Não' },
          alertSeverity: 'WARNING',
          alertCategory: 'CONDITION',
        },
        {
          id: 'pregnant',
          label: 'Está gestante?',
          type: 'BOOLEAN',
          showWhen: { patientGender: 'F' },
          alertWhen: { equals: true },
          alertSeverity: 'CRITICAL',
        },
        {
          id: 'hypertension',
          label: 'Tem pressão alta?',
          type: 'BOOLEAN_WITH_TEXT',
          alertWhen: { equals: true },
          alertSeverity: 'WARNING',
        },
        {
          id: 'cardiac',
          label: 'Problema cardíaco?',
          type: 'BOOLEAN_WITH_TEXT',
          alertWhen: { equals: true },
          alertSeverity: 'CRITICAL',
        },
        {
          id: 'smoker',
          label: 'Fumante?',
          type: 'SINGLE_CHOICE',
          options: ['Não', 'Sim', 'Ex-fumante'],
        },
        {
          id: 'anesthesia_reaction',
          label: 'Já teve reação a anestesia?',
          type: 'BOOLEAN_WITH_TEXT',
          alertWhen: { equals: true },
          alertSeverity: 'CRITICAL',
        },
        {
          id: 'bleeding',
          label: 'Sangramento excessivo em extrações?',
          type: 'BOOLEAN_WITH_TEXT',
          alertWhen: { equals: true },
          alertSeverity: 'WARNING',
        },
        { id: 'current_meds', label: 'Medicamentos em uso', type: 'TEXT' },
        { id: 'main_complaint', label: 'Queixa principal', type: 'TEXT', required: true },
      ],
    },
  });
}
