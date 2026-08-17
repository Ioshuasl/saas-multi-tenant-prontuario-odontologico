export type PatientMessageTimelineItem = {
  id: string;
  conversationId: string;
  direction: string;
  type: string;
  body: string | null;
  occurredAt: string;
};
