'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function PlanPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Plano de tratamento</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Disponível na Sprint 5.</p>
      </CardContent>
    </Card>
  );
}
