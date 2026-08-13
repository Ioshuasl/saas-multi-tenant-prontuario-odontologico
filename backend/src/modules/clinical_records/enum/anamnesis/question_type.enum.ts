export const QUESTION_TYPES = ['BOOLEAN', 'BOOLEAN_WITH_TEXT', 'SINGLE_CHOICE', 'TEXT'] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];
