import { apiClient } from '@/shared/api/api-client';
import { toAnamnesisFormQuestions } from '@/packages/admin/schemas/AnamnesisForm/AnamnesisFormSchema';
import type { AnamnesisFormCreateFormValues } from '@/packages/admin/schemas/AnamnesisForm/AnamnesisFormSchema';
import type { AnamnesisFormSummary } from '@/packages/admin/types/AnamnesisForm/AnamnesisFormTypes';

export async function AnamnesisFormCreateData(
  formSchema: AnamnesisFormCreateFormValues,
): Promise<AnamnesisFormSummary> {
  return apiClient.request<AnamnesisFormSummary>('/anamnesis-forms', {
    method: 'POST',
    body: JSON.stringify({
      name: formSchema.name.trim(),
      questions: toAnamnesisFormQuestions(formSchema.questions),
    }),
  });
}
