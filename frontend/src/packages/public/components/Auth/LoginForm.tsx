'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthCard } from '@/packages/public/components/Auth/AuthCard';
import { authErrorMessage } from '@/packages/public/helpers/AuthErrorMessage';
import { useAuthLoginFormHook } from '@/packages/public/hooks/Auth/useAuthLoginFormHook';
import { useAuthLoginHook } from '@/packages/public/hooks/Auth/useAuthLoginHook';
import type { AuthLoginFormValues } from '@/packages/public/schemas/Auth/AuthSchema';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';

export function LoginForm() {
  const router = useRouter();
  const form = useAuthLoginFormHook();
  const login = useAuthLoginHook();

  const onSave = async (values: AuthLoginFormValues) => {
    await login.mutateAsync(values);
    router.replace('/app');
  };

  return (
    <AuthCard title="Entrar" description="Acesse a clínica com e-mail e senha.">
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          void form.handleSubmit(onSave)(e);
        }}
      >
        <FieldGroup>
          <Field data-invalid={Boolean(form.formState.errors.email)}>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
            <FieldError>{form.formState.errors.email?.message}</FieldError>
          </Field>
          <Field data-invalid={Boolean(form.formState.errors.password)}>
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...form.register('password')}
            />
            <FieldError>{form.formState.errors.password?.message}</FieldError>
          </Field>
        </FieldGroup>

        {login.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{authErrorMessage(login.error)}</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </Button>

        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <Link className="underline-offset-4 hover:underline" href="/forgot-password">
            Esqueci a senha
          </Link>
          <Link className="underline-offset-4 hover:underline" href="/signup">
            Criar clínica
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
