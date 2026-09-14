/** Tokens Notion-like para a grade de agenda (ui-ux-pro-max + globals Notion). */
export const AGENDA_NOTION = {
  /** Fundo da grade — cinza papel Notion */
  gridBg: 'bg-[#F7F6F3] dark:bg-background',
  /** Linha de hora */
  hourLine: 'border-[#E9E9E7] dark:border-border',
  /** Cabeçalho do dia */
  dayHeader: 'bg-white dark:bg-card border-[#E9E9E7] dark:border-border',
  /** Slot vazio hover */
  slotHover: 'hover:bg-[#EFEFEF]/40 dark:hover:bg-muted/40',
  /** Bloqueio */
  blockBg: 'bg-[#E3E2E0]/80 text-[#787774] dark:bg-muted/80 dark:text-muted-foreground',
  /** Transição padrão (150–300ms) */
  transition: 'transition-colors duration-200',
  /** Altura px por minuto na grade (densidade alta) */
  pxPerMinute: 1.2,
  dayStartHour: 7,
  dayEndHour: 20,
} as const;

export const SLOT_MINUTES_OPTIONS = [10, 15, 20, 30, 60] as const;
export type SlotMinutes = (typeof SLOT_MINUTES_OPTIONS)[number];
