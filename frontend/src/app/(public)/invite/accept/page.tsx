import { InvitationAcceptForm } from '@/packages/public/components/Invitation/InvitationAcceptForm';

type InviteAcceptPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function InviteAcceptPage({ searchParams }: InviteAcceptPageProps) {
  const params = await searchParams;
  return <InvitationAcceptForm token={params.token ?? ''} />;
}
