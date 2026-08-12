export type OnboardingStatus = {
  requiredSteps: string[];
  skippedSteps: string[];
  stepsStatus: Record<string, boolean>;
  completed: boolean;
  publicBookingPath: string;
};
