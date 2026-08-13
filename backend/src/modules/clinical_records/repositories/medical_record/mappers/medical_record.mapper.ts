import type { ClinicalAlertSummary } from '../../../types/medical_record/medical_record_get.types.js';

const STALE_MS = 365 * 24 * 60 * 60 * 1000;

export function isAnamnesisStale(lastAnamnesisAt: Date | null, now = new Date()): boolean {
  if (!lastAnamnesisAt) return true;
  return now.getTime() - lastAnamnesisAt.getTime() > STALE_MS;
}

export function mapAlertSummary(input: {
  id: string;
  severity: string;
  category: string;
  description: string;
  source: string;
  active: boolean;
}): ClinicalAlertSummary {
  return {
    id: input.id,
    severity: input.severity,
    category: input.category,
    description: input.description,
    source: input.source,
    active: input.active,
  };
}
