import { ResetPasswordForm } from '@/packages/public/components/Auth/ResetPasswordForm';

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  return <ResetPasswordForm token={params.token ?? ''} />;
}
