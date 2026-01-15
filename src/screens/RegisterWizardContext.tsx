import React, { createContext, useContext, useMemo, useState } from "react";

export type FocusArea = "EDUCATION" | "CAREER" | "FINANCE" | "HEALTH_SPORTS" | "RELATIONSHIPS";
export type MotivationCard =
  | "FAMILY_LOVED_ONES"
  | "FREEDOM_INDEPENDENCE"
  | "PROVE_YOURSELF"
  | "COMFORT_LUXURY"
  | "CURIOSITY_GROWTH"
  | "INNER_PEACE_BALANCE";

export type RegisterDraft = {
  fullName: string;
  gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" | null;
  birthDate: string | null; // ISO string
  zodiacSign: string | null;

  city: string;
  hometown: string;

  focusArea: FocusArea | null;
  focusDetail: string;

  motivationCard: MotivationCard | null;

  email: string;
  phone: string;
};

const initialDraft: RegisterDraft = {
  fullName: "",
  gender: null,
  birthDate: null,
  zodiacSign: null,
  city: "",
  hometown: "",
  focusArea: null,
  focusDetail: "",
  motivationCard: null,
  email: "",
  phone: "",
};

type Ctx = {
  draft: RegisterDraft;
  patch: (p: Partial<RegisterDraft>) => void;
  reset: () => void;
};

const C = createContext<Ctx | null>(null);

export function RegisterWizardProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<RegisterDraft>(initialDraft);

  const value = useMemo<Ctx>(() => {
    return {
      draft,
      patch: (p) => setDraft((prev) => ({ ...prev, ...p })),
      reset: () => setDraft(initialDraft),
    };
  }, [draft]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useRegisterWizard() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useRegisterWizard must be used within RegisterWizardProvider");
  return ctx;
}
