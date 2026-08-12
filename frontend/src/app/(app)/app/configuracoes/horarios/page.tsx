import { BusinessHoursExceptionForm } from '@/packages/admin/components/BusinessHours/BusinessHoursExceptionForm';
import { BusinessHoursForm } from '@/packages/admin/components/BusinessHours/BusinessHoursForm';

export default function BusinessHoursPage() {
  return (
    <div className="grid gap-2">
      <BusinessHoursForm />
      <BusinessHoursExceptionForm />
    </div>
  );
}
