import type { AnamnesisQuestion } from '../types/anamnesis/anamnesis_question.types.js';

export const ANAMNESIS_GERAL_NAME = 'Anamnese Geral';

/** JSON do módulo §3 — seed v1 (sprint S4 Bloco 2). */
export const ANAMNESIS_GERAL_V1_QUESTIONS: AnamnesisQuestion[] = [
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
];
