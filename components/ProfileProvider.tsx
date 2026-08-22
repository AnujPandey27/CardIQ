"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

export type Profile = {
  id: string;
  name: string;
  country_code: string;
  currency_code: string;
  is_default: boolean | null;
  created_at: string;
};

type ProfileContextValue = {
  profiles: Profile[];
  activeProfile: Profile | null;
  loadingProfiles: boolean;
  switchProfile: (profileId: string) => void;
  refreshProfiles: () => Promise<void>;
};

const ProfileContext =
  createContext<ProfileContextValue | undefined>(
    undefined
  );

const ACTIVE_PROFILE_KEY = "cardiq-active-profile-id";

export function useCardIQProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error(
      "useCardIQProfile must be used inside ProfileProvider"
    );
  }

  return context;
}

export default function ProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] =
    useState<Profile | null>(null);
  const [loadingProfiles, setLoadingProfiles] =
    useState(true);

  const loadProfiles = async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfiles([]);
      setActiveProfile(null);
      setLoadingProfiles(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, name, country_code, currency_code, is_default, created_at"
      )
      .eq("user_id", user.id)
      .order("is_default", {
        ascending: false,
        nullsFirst: false,
      })
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error("Profile load error:", error);
      setProfiles([]);
      setActiveProfile(null);
      setLoadingProfiles(false);
      return;
    }

    const loadedProfiles = data ?? [];

    setProfiles(loadedProfiles);

    if (loadedProfiles.length === 0) {
      setActiveProfile(null);
      setLoadingProfiles(false);
      return;
    }

    const savedProfileId =
      typeof window !== "undefined"
        ? window.localStorage.getItem(
            ACTIVE_PROFILE_KEY
          )
        : null;

    const savedProfile = savedProfileId
      ? loadedProfiles.find(
          (profile) =>
            profile.id === savedProfileId
        )
      : null;

    const selectedProfile =
      savedProfile ??
      loadedProfiles.find(
        (profile) => profile.is_default
      ) ??
      loadedProfiles[0];

    setActiveProfile(selectedProfile);

    if (
      typeof window !== "undefined" &&
      selectedProfile
    ) {
      window.localStorage.setItem(
        ACTIVE_PROFILE_KEY,
        selectedProfile.id
      );
    }

    setLoadingProfiles(false);
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const switchProfile = (profileId: string) => {
    const selectedProfile = profiles.find(
      (profile) => profile.id === profileId
    );

    if (!selectedProfile) {
      return;
    }

    setActiveProfile(selectedProfile);

    window.localStorage.setItem(
      ACTIVE_PROFILE_KEY,
      selectedProfile.id
    );
  };

  const refreshProfiles = async () => {
    setLoadingProfiles(true);
    await loadProfiles();
  };

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        loadingProfiles,
        switchProfile,
        refreshProfiles,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
