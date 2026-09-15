'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  UserPlusIcon,
} from 'lucide-react';
import { AuthBrandPanel } from '@/packages/public/components/Auth/AuthBrandPanel';
import { authErrorMessage } from '@/packages/public/helpers/AuthErrorMessage';
import { useAuthLoginFormHook } from '@/packages/public/hooks/Auth/useAuthLoginFormHook';
import { useAuthLoginHook } from '@/packages/public/hooks/Auth/useAuthLoginHook';
import type { AuthLoginFormValues } from '@/packages/public/schemas/Auth/AuthSchema';
import { ClivraLogo } from '@/shared/brand/ClivraLogo';
import { cn } from '@/shared/helpers/utils';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';

/**
 * Login — tipografia em px (não rem) para não herdar o `html { font-size: 15px }`
 * e bater com `prototipos/login-clivra.png`.
 */
export function LoginForm() {
  const router = useRouter();
  const form = useAuthLoginFormHook();
  const login = useAuthLoginHook();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const onSave = async (values: AuthLoginFormValues) => {
    await login.mutateAsync(values);
    router.replace('/app');
  };

  return (
    <div className="login-page grid min-h-dvh bg-[#F7F5F2] lg:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)]">
      <div className="hidden lg:block">
        <AuthBrandPanel />
      </div>

      <main className="relative flex flex-col items-center justify-center px-6 py-10 sm:px-12 lg:px-16 lg:py-12">
        <div className="mb-8 flex w-full max-w-[480px] justify-center lg:hidden">
          <ClivraLogo
            size={34}
            wordmarkClassName="login-display text-[22px] font-semibold text-primary"
          />
        </div>

        <div className="w-full max-w-[480px]">
          <div className="mb-9">
            <div className="mb-5 h-0.5 w-11 bg-primary" aria-hidden />
            <p className="login-sans mb-2 text-[14px] font-medium text-primary">
              Bem-vindo de volta
            </p>
            <h1 className="login-display text-[40px] leading-[1.12] font-semibold text-[#1A1A1A]">
              Acesse sua conta
            </h1>
            <p className="login-sans mt-3 text-[15px] leading-[1.55] text-[#6B6663]">
              Informe seus dados para continuar com o Clivra.
            </p>
          </div>

          <form
            className="grid gap-5"
            onSubmit={(e) => {
              void form.handleSubmit(onSave)(e);
            }}
          >
            <FieldGroup className="gap-5">
              <Field data-invalid={Boolean(form.formState.errors.email)}>
                <FieldLabel
                  htmlFor="email"
                  className="login-sans text-[14px] font-semibold text-[#2A2A2A]"
                >
                  E-mail
                </FieldLabel>
                <div className="relative">
                  <MailIcon
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#8A847E]"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    className={cn(
                      'login-sans h-12 rounded-[10px] border-[#DDD8D3] bg-[#F3F0EC] pl-10 text-[15px] shadow-none md:text-[15px]',
                      'placeholder:text-[#9A948E] focus-visible:border-secondary focus-visible:bg-white',
                    )}
                    {...form.register('email')}
                  />
                </div>
                <FieldError>{form.formState.errors.email?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(form.formState.errors.password)}>
                <FieldLabel
                  htmlFor="password"
                  className="login-sans text-[14px] font-semibold text-[#2A2A2A]"
                >
                  Senha
                </FieldLabel>
                <div className="relative">
                  <LockIcon
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#8A847E]"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    className={cn(
                      'login-sans h-12 rounded-[10px] border-[#DDD8D3] bg-[#F3F0EC] pr-11 pl-10 text-[15px] shadow-none md:text-[15px]',
                      'placeholder:text-[#9A948E] focus-visible:border-secondary focus-visible:bg-white',
                    )}
                    {...form.register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-1 size-8 -translate-y-1/2 cursor-pointer text-[#6B6560] hover:bg-transparent hover:text-foreground"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                  </Button>
                </div>
                <FieldError>{form.formState.errors.password?.message}</FieldError>
              </Field>
            </FieldGroup>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="login-sans flex cursor-pointer items-center gap-2.5 text-[14px] text-[#4A4540]">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  aria-label="Lembrar de mim"
                />
                Lembrar de mim
              </label>
              <Link
                className="login-sans text-[14px] font-semibold text-primary underline-offset-4 hover:underline"
                href="/forgot-password"
              >
                Esqueceu sua senha?
              </Link>
            </div>

            {login.isError ? (
              <Alert variant="destructive">
                <AlertDescription>{authErrorMessage(login.error)}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="submit"
              disabled={login.isPending}
              className="login-sans mt-1 h-12 cursor-pointer gap-2 rounded-[10px] bg-primary text-[15px] font-semibold text-primary-foreground hover:bg-[#3A0C12]"
            >
              {login.isPending ? 'Entrando…' : 'Entrar'}
              {!login.isPending ? <ArrowRightIcon className="size-4" aria-hidden /> : null}
            </Button>

            <div className="relative my-1 py-2">
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#E5E1DC]" />
              <span className="login-sans relative mx-auto block w-fit bg-[#F7F5F2] px-3 text-[13px] text-[#8A847E]">
                ou
              </span>
            </div>

            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/signup" />}
              className="login-sans h-12 justify-center gap-2.5 rounded-[10px] border-[#DDD8D3] bg-white text-[15px] font-medium text-[#2A2A2A] hover:bg-[#F3F0EC]"
            >
              <UserPlusIcon className="size-4 text-primary" strokeWidth={1.75} aria-hidden />
              Criar sua conta
            </Button>
          </form>

          <p className="login-sans mt-9 text-center text-[13px] text-[#6B6663]">
            Não tem uma conta? Entre em contato com sua clínica.
          </p>
        </div>
      </main>
    </div>
  );
}
