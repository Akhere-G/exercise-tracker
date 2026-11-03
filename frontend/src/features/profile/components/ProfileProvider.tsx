"use client";
import { createContext, useContext } from "react";
import { DEFAULT_PROFILE, Profile } from "../types";

const ProfileContext = createContext<Profile>(DEFAULT_PROFILE);

export function ProfileProvider({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  return (
    <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
export const useWeightUnit = () => useProfile().weightUnit;
