'use client';

import { BusinessHoursExceptionForm } from '@/packages/admin/components/BusinessHours/BusinessHoursExceptionForm';
import { BusinessHoursForm } from '@/packages/admin/components/BusinessHours/BusinessHoursForm';
import { ClivraPageHeader } from '@/shared/layout/ClivraPage';

export function BusinessHoursIndex() {
  return (
    <div className="grid min-w-0 gap-4">
      <ClivraPageHeader
        title="Horários"
        description="Grade semanal da unidade ou do profissional, e exceções de feriado ou férias."
      />
      <BusinessHoursForm />
      <BusinessHoursExceptionForm />
    </div>
  );
}
