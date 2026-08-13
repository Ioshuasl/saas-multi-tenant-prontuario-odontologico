import { Skeleton } from '@/shared/ui/skeleton';

export default function AppLoading() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
