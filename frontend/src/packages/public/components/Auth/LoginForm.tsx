'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { AuthBrandPanel } from '@/packages/public/components/Auth/AuthBrandPanel';
import { authErrorMessage } from '@/packages/public/helpers/AuthErrorMessage';
import { useAuthLoginFormHook } from '@/packages/public/hooks/Auth/useAuthLoginFormHook';
import { useAuthLoginHook } from '@/packages/public/hooks/Auth/useAuthLoginHook';
import type { AuthLoginFormValues } from '@/packages/public/schemas/Auth/AuthSchema';
import { ClivraLogo } from '@/shared/brand/ClivraLogo';
import { CLIVRA } from '@/shared/brand/ClivraBrand';
import { cn } from '@/shared/helpers/utils';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

function MicrosoftMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21" aria-hidden>
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const form = useAuthLoginFormHook();
  const login = useAuthLoginHook();
  const [showPassword, setShowPassword] = useState(false);

  const onSave = async (values: AuthLoginFormValues) => {
    await login.mutateAsync(values);
    router.replace('/app');
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#2A0A10] px-3 py-5 sm:px-6 sm:py-8">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            'radial-gradient(circle at 18% 22%, rgb(122 43 54 / 0.4) 0%, transparent 42%)',
            'radial-gradient(circle at 82% 78%, rgb(74 15 22 / 0.5) 0%, transparent 46%)',
          ].join(', '),
        }}
      />
      <div
        className="pointer-events-none absolute -top-48 left-[20%] size-[36rem] rounded-full border border-white/[0.035]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-56 right-[12%] size-[42rem] rounded-full border border-white/[0.03]"
        aria-hidden
      />

      <div
        className={cn(
          'relative z-10 grid w-full max-w-[1040px] overflow-hidden rounded-[1.65rem]',
          'border border-white/10 bg-[#F4F1ED] shadow-[0_28px_90px_rgb(0_0_0/0.5)]',
          'lg:min-h-[620px] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]',
        )}
      >
        {/* Coluna esquerda: altura total do card */}
        <div className="order-2 min-h-0 lg:order-1 lg:h-auto">
          <div className="h-full">
            <AuthBrandPanel />
          </div>
        </div>

        <main className="order-1 flex flex-col items-center justify-center bg-[#F4F1ED] px-5 py-9 sm:px-10 lg:order-2 lg:px-14 lg:py-12">
          <div className="mb-5 flex w-full max-w-[380px] justify-center lg:hidden">
            <ClivraLogo size={34} wordmarkClassName="text-xl text-primary" />
          </div>

          <div className="w-full max-w-[380px] rounded-2xl border border-black/[0.05] bg-white p-6 shadow-[0_10px_40px_rgb(74_15_22/0.07)] sm:p-8">
            <h1 className="mb-6 text-[1.7rem] font-semibold tracking-tight text-[#1A1A1A]">
              Logar
            </h1>

            <form
              className="grid gap-3.5"
              onSubmit={(e) => {
                void form.handleSubmit(onSave)(e);
              }}
            >
              <FieldGroup>
                <Field data-invalid={Boolean(form.formState.errors.email)}>
                  <FieldLabel htmlFor="email" className="text-sm text-[#333]">
                    E-mail ou CPF
                  </FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="h-11 rounded-lg border-[#D9D4CE] bg-white px-3 shadow-none focus-visible:border-[#7A2B36]"
                    {...form.register('email')}
                  />
                  <FieldError>{form.formState.errors.email?.message}</FieldError>
                </Field>
                <Field data-invalid={Boolean(form.formState.errors.password)}>
                  <FieldLabel htmlFor="password" className="text-sm text-[#333]">
                    Senha
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="h-11 rounded-lg border-[#D9D4CE] bg-white px-3 pr-11 shadow-none focus-visible:border-[#7A2B36]"
                      {...form.register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 right-1 size-8 -translate-y-1/2 cursor-pointer text-[#6B6560]"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                    </Button>
                  </div>
                  <FieldError>{form.formState.errors.password?.message}</FieldError>
                </Field>
              </FieldGroup>

              {login.isError ? (
                <Alert variant="destructive">
                  <AlertDescription>{authErrorMessage(login.error)}</AlertDescription>
                </Alert>
              ) : null}

              <div className="relative my-1.5 py-2">
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#E5E1DC]" />
                <span className="relative mx-auto block w-fit bg-white px-3 text-xs text-[#8A847E]">
                  or
                </span>
              </div>

              <div className="grid gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  title="Em breve"
                  className="h-11 justify-start gap-2.5 rounded-lg border-[#D9D4CE] bg-white text-[13px] font-normal text-[#2A2A2A] disabled:opacity-100"
                >
                  <span className="inline-flex items-center gap-1">
                    <GoogleMark className="size-[18px]" />
                    <MicrosoftMark className="size-[18px]" />
                  </span>
                  Logar com Google / Microsoft
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  title="Em breve"
                  className="h-11 justify-start gap-2.5 rounded-lg border-[#D9D4CE] bg-white text-[13px] font-normal text-[#2A2A2A] disabled:opacity-100"
                >
                  <MicrosoftMark className="size-[18px]" />
                  Acessar com SSO da Empresa
                </Button>
              </div>

              <Button
                type="submit"
                disabled={login.isPending}
                className="mt-1 h-11 cursor-pointer rounded-lg bg-[#4A0F16] text-[15px] font-semibold text-white hover:bg-[#3A0C12]"
              >
                {login.isPending ? 'Entrando…' : 'Entrar'}
              </Button>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-sm text-[#5A5550]">
                <Link
                  className="underline-offset-4 hover:text-foreground hover:underline"
                  href="/forgot-password"
                >
                  Esqueci minha senha
                </Link>
                <Link
                  className="underline-offset-4 hover:text-foreground hover:underline"
                  href="/signup"
                >
                  Request access (B2B)
                </Link>
              </div>
            </form>
          </div>

          <p className="mt-7 text-center text-[11px] font-medium tracking-[0.16em] text-[#6B6560] uppercase">
            {CLIVRA.tagline}
          </p>
        </main>
      </div>
    </div>
  );
}
