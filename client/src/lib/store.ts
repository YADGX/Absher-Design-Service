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
  userProfileId: number | null;
  isSetupComplete: boolean;
  contacts: Contact[];
  medicalInfo: MedicalInfo | null;
  city: string;
  theme: 'light' | 'dark';
  setUserProfileId: (id: number) => void;
  setSetupComplete: (complete: boolean) => void;
  setContacts: (contacts: Contact[]) => void;
  setMedicalInfo: (info: MedicalInfo) => void;
  setCity: (city: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userProfileId: null,
      isSetupComplete: false,
      contacts: [],
      medicalInfo: null,
      city: '',
      theme: 'dark', // Default to dark mode
      setUserProfileId: (id) => set({ userProfileId: id }),
      setSetupComplete: (complete) => set({ isSetupComplete: complete }),
      setContacts: (contacts) => set({ contacts }),
      setMedicalInfo: (info) => set({ medicalInfo: info }),
      setCity: (city) => set({ city }),
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        get().setTheme(newTheme);
      },
    }),
    {
      name: 'absher-tracking-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme on hydration
        if (state?.theme) {
          if (state.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },
    }
  )
);
