import { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileProvider } from "@/src/features/profile/components/ProfileProvider";
import { WorkoutContextProvider } from "@/src/features/workout/components/WorkoutContext";
import { Profile } from "@/src/features/profile/types";
import { PreviousSet } from "@/src/features/workout/types";
import { makeProfile } from "./factories";

interface ProviderOptions {
  profile?: Partial<Profile>;
  previousSets?: Record<number, PreviousSet[]>;
  restSettings?: Record<number, number | null>;
}

/**
 * Renders inside the same providers the dashboard layout supplies, and returns a
 * user-event instance for realistic interaction.
 */
export function renderWithProviders(
  ui: ReactElement,
  { profile, previousSets = {}, restSettings = {} }: ProviderOptions = {},
  options?: RenderOptions,
) {
  const workoutContext = {
    previousSets,
    ensurePreviousSets: async () => previousSets,
    restSettings,
    setRestSetting: () => {},
  };
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ProfileProvider profile={makeProfile(profile)}>
        <WorkoutContextProvider value={workoutContext}>
          {children}
        </WorkoutContextProvider>
      </ProfileProvider>
    );
  }
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}
