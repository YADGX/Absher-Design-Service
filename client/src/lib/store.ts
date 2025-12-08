import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Contact {
  name: string;
  phone: string;
  relationship: string;
}

export interface MedicalInfo {
  bloodType: string;
  chronicDiseases: string;
}

interface AppState {
  isSetupComplete: boolean;
  contacts: Contact[];
  medicalInfo: MedicalInfo | null;
  city: string;
  setSetupComplete: (complete: boolean) => void;
  setContacts: (contacts: Contact[]) => void;
  setMedicalInfo: (info: MedicalInfo) => void;
  setCity: (city: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isSetupComplete: false,
      contacts: [],
      medicalInfo: null,
      city: '',
      setSetupComplete: (complete) => set({ isSetupComplete: complete }),
      setContacts: (contacts) => set({ contacts }),
      setMedicalInfo: (info) => set({ medicalInfo: info }),
      setCity: (city) => set({ city }),
    }),
    {
      name: 'absher-tracking-storage',
    }
  )
);
