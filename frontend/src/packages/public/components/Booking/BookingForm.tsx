'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookingShell } from '@/packages/public/components/Booking/BookingShell';
import { BookingStepIdentity } from '@/packages/public/components/Booking/BookingStepIdentity';
import { BookingStepOtp } from '@/packages/public/components/Booking/BookingStepOtp';
import { BookingStepProcedure } from '@/packages/public/components/Booking/BookingStepProcedure';
import { BookingStepProfessional } from '@/packages/public/components/Booking/BookingStepProfessional';
import { BookingStepSlot } from '@/packages/public/components/Booking/BookingStepSlot';
import { BookingStepSuccess } from '@/packages/public/components/Booking/BookingStepSuccess';
import type { BookingStep } from '@/packages/public/enum/Booking/BookingStepEnum';
import { addDaysYmd, ymdInTimeZone } from '@/packages/public/helpers/BookingTime';
import { publicErrorMessage, suggestedSlotsFromError } from '@/packages/public/helpers/PublicErrorMessage';
import { useBookingAvailabilityGetHook } from '@/packages/public/hooks/Booking/useBookingAvailabilityGetHook';
import { useBookingClinicGetHook } from '@/packages/public/hooks/Booking/useBookingClinicGetHook';
import { useBookingCreateHook } from '@/packages/public/hooks/Booking/useBookingCreateHook';
import { useBookingIdentityFormHook } from '@/packages/public/hooks/Booking/useBookingIdentityFormHook';
import { useBookingOtpFormHook } from '@/packages/public/hooks/Booking/useBookingOtpFormHook';
import { useBookingVerifyHook } from '@/packages/public/hooks/Booking/useBookingVerifyHook';
import type { BookingIdentityFormValues } from '@/packages/public/schemas/Booking/BookingSchema';
import type { BookingFormProps } from '@/packages/public/types/Booking/BookingFormTypes';
import type { BookingCreateResult, BookingVerifyResult } from '@/packages/public/types/Booking/BookingTypes';
import { ApiClientError } from '@/shared/api/api-client';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

const STEP_META: Record<Exclude<BookingStep, 'success'>, { label: string; index: number }> = {
  procedure: { label: 'Serviço', index: 1 },
  professional: { label: 'Profissional', index: 2 },
  slot: { label: 'Data e horário', index: 3 },
  identity: { label: 'Seus dados', index: 4 },
  otp: { label: 'Código de verificação', index: 5 },
};

export function BookingForm({ slug }: BookingFormProps) {
  const clinicQuery = useBookingClinicGetHook(slug);
  const identityForm = useBookingIdentityFormHook();
  const otpForm = useBookingOtpFormHook();
  const create = useBookingCreateHook();
  const verify = useBookingVerifyHook();

  const [step, setStep] = useState<BookingStep>('procedure');
  const [procedureId, setProcedureId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [rangeOffset, setRangeOffset] = useState(0);
  const [booking, setBooking] = useState<BookingCreateResult | null>(null);
  const [verifyResult, setVerifyResult] = useState<BookingVerifyResult | null>(null);
  const [slotAlert, setSlotAlert] = useState<string | null>(null);
  const [suggestedSlots, setSuggestedSlots] = useState<string[]>([]);

  const clinic = clinicQuery.data;
  const timezone = clinic?.timezone ?? 'America/Sao_Paulo';
  const today = ymdInTimeZone(new Date(), timezone);
  const from = addDaysYmd(today, rangeOffset);
  const to = addDaysYmd(today, rangeOffset + 6);
  const skipProfessional = (clinic?.professionals.length ?? 0) <= 1;

  const availabilityQuery = useBookingAvailabilityGetHook({
    slug,
    procedureId,
    professionalId,
    from,
    to,
    enabled: Boolean(procedureId && professionalId) && (step === 'slot' || step === 'identity'),
  });

  useEffect(() => {
    if (step !== 'professional' || !clinic) return;
    if (clinic.professionals.length === 1) {
      const only = clinic.professionals[0];
      if (!only) return;
      setProfessionalId(only.id);
      setStep('slot');
    }
  }, [step, clinic]);

  const procedure = clinic?.procedures.find((item) => item.id === procedureId);
  const professional = clinic?.professionals.find((item) => item.id === professionalId);

  const visibleTotal = skipProfessional ? 4 : 5;
  const visibleIndex = useMemo(() => {
    if (step === 'success') return visibleTotal;
    const raw = STEP_META[step].index;
    if (skipProfessional && raw > 2) return raw - 1;
    return raw;
  }, [skipProfessional, step, visibleTotal]);

  const goBackFromSlot = () => {
    if (skipProfessional) {
      setStep('procedure');
      return;
    }
    setStep('professional');
  };

  const onCreate = async (values: BookingIdentityFormValues) => {
    setSlotAlert(null);
    setSuggestedSlots([]);
    try {
      const result = await create.mutateAsync({
        slug,
        procedureId,
        professionalId,
        startsAt,
        name: values.name,
        phone: values.phone,
        email: values.email,
        consentDataProcessing: values.consentDataProcessing,
        consentTerms: values.consentTerms,
        consentWhatsappMarketing: values.consentWhatsappMarketing,
      });
      setBooking(result);
      otpForm.reset({ code: '' });
      setStep('otp');
    } catch (error) {
      if (error instanceof ApiClientError && error.code === 'SLOT_UNAVAILABLE') {
        setSlotAlert(publicErrorMessage(error));
        setSuggestedSlots(suggestedSlotsFromError(error));
        setStartsAt('');
        create.reset();
        setStep('slot');
      }
    }
  };

  const onVerify = async (values: { code: string }) => {
    if (!booking) return;
    const result = await verify.mutateAsync({
      slug,
      bookingId: booking.bookingId,
      code: values.code,
    });
    setVerifyResult(result);
    setStep('success');
  };

  if (clinicQuery.isLoading) {
    return (
      <BookingShell title="Carregando…">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </BookingShell>
    );
  }

  if (clinicQuery.isError || !clinic) {
    const notFound = clinicQuery.error instanceof ApiClientError && clinicQuery.error.status === 404;
    return (
      <BookingShell title="Agendamento">
        <Alert variant="destructive">
          <AlertDescription>
            {notFound ? 'Clínica não encontrada.' : publicErrorMessage(clinicQuery.error)}
          </AlertDescription>
        </Alert>
        {!notFound ? (
          <Button type="button" size="lg" className="w-full" onClick={() => void clinicQuery.refetch()}>
            Tentar novamente
          </Button>
        ) : null}
      </BookingShell>
    );
  }

  const stepMeta = step === 'success' ? null : STEP_META[step];

  return (
    <BookingShell
      title={clinic.name}
      description={step === 'success' ? undefined : 'Escolha o serviço e o horário em poucos passos.'}
      stepLabel={stepMeta ? `Passo ${visibleIndex} de ${visibleTotal} · ${stepMeta.label}` : undefined}
      progress={step === 'success' ? 100 : Math.round((visibleIndex / visibleTotal) * 100)}
    >
      {step === 'procedure' ? (
        <BookingStepProcedure
          procedures={clinic.procedures}
          selectedId={procedureId}
          onSelect={setProcedureId}
          onContinue={() => {
            setProfessionalId(skipProfessional ? (clinic.professionals[0]?.id ?? '') : '');
            setStep(skipProfessional ? 'slot' : 'professional');
          }}
        />
      ) : null}

      {step === 'professional' ? (
        <BookingStepProfessional
          professionals={clinic.professionals}
          selectedId={professionalId}
          onSelect={setProfessionalId}
          onBack={() => setStep('procedure')}
          onContinue={() => setStep('slot')}
        />
      ) : null}

      {step === 'slot' ? (
        <BookingStepSlot
          timezone={timezone}
          days={availabilityQuery.data?.days ?? []}
          loading={availabilityQuery.isLoading}
          errorMessage={availabilityQuery.isError ? publicErrorMessage(availabilityQuery.error) : null}
          slotAlert={slotAlert}
          suggestedSlots={suggestedSlots}
          selectedStartsAt={startsAt}
          canGoBackRange={rangeOffset > 0}
          onSelect={setStartsAt}
          onPrevRange={() => setRangeOffset((value) => Math.max(0, value - 7))}
          onNextRange={() => setRangeOffset((value) => value + 7)}
          onRetry={() => void availabilityQuery.refetch()}
          onBack={goBackFromSlot}
          onContinue={() => setStep('identity')}
        />
      ) : null}

      {step === 'identity' ? (
        <BookingStepIdentity
          form={identityForm}
          pending={create.isPending}
          errorMessage={create.isError ? publicErrorMessage(create.error) : null}
          onBack={() => setStep('slot')}
          onSave={(values) => {
            void onCreate(values);
          }}
        />
      ) : null}

      {step === 'otp' && booking ? (
        <BookingStepOtp
          form={otpForm}
          sentVia={booking.otpSentVia}
          pending={verify.isPending}
          errorMessage={verify.isError ? publicErrorMessage(verify.error) : null}
          onBack={() => setStep('identity')}
          onSave={(values) => {
            void onVerify(values);
          }}
        />
      ) : null}

      {step === 'success' && verifyResult ? (
        <BookingStepSuccess
          timezone={timezone}
          startsAt={verifyResult.appointment.startsAt}
          procedureName={procedure?.name}
          professionalName={professional?.name}
          requested={verifyResult.appointment.status === 'REQUESTED'}
        />
      ) : null}
    </BookingShell>
  );
}
