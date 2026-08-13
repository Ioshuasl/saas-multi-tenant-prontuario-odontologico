export const QUESTION_TYPES = ['BOOLEAN', 'BOOLEAN_WITH_TEXT', 'SINGLE_CHOICE', 'TEXT'] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  BOOLEAN: 'Sim/Não',
  BOOLEAN_WITH_TEXT: 'Sim/Não com texto',
  SINGLE_CHOICE: 'Escolha única',
  TEXT: 'Texto',
};
