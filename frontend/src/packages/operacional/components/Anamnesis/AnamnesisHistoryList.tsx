'use client';

import { ANSWERED_BY_LABELS } from '@/packages/operacional/enum/Anamnesis/AnsweredByEnum';
import { formatAnamnesisAnswer, formatDateTimePt } from '@/packages/operacional/helpers/AnamnesisAnswer';
import type { AnamnesisResponseSummary } from '@/packages/operacional/types/Anamnesis/AnamnesisTypes';

type AnamnesisHistoryListProps = {
  items: AnamnesisResponseSummary[];
};

export function AnamnesisHistoryList({ items }: AnamnesisHistoryListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma anamnese respondida ainda.</p>;
  }

  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li key={item.id} className="grid gap-2 rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">
              {item.formName} · v{item.formVersion}
            </p>
            <p className="text-xs text-muted-foreground">
              {ANSWERED_BY_LABELS[item.answeredBy as keyof typeof ANSWERED_BY_LABELS] ?? item.answeredBy}{' '}
              · {formatDateTimePt(item.answeredAt)}
            </p>
          </div>
          <dl className="grid gap-2 text-sm">
            {item.questions.map((question) => (
              <div key={question.id}>
                <dt className="text-muted-foreground">{question.label}</dt>
                <dd>{formatAnamnesisAnswer(item.answers[question.id])}</dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  );
}
