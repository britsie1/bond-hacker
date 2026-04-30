import { create } from 'zustand';

interface UIState {
  currentStep: number;
  isDarkMode: boolean;
  setCurrentStep: (step: number) => void;
  setIsDarkMode: (isDark: boolean) => void;
  toggleDarkMode: () => void;
}

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  return false;
};

export const useUIStore = create<UIState>((set) => ({
  currentStep: 1,
  isDarkMode: getInitialTheme(),
  setCurrentStep: (step) => set({ currentStep: step }),
  setIsDarkMode: (isDark) => {
    set({ isDarkMode: isDark });
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },
  toggleDarkMode: () => set((state) => {
    const newIsDark = !state.isDarkMode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
      if (newIsDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    return { isDarkMode: newIsDark };
  })
}));

// Initialize theme class on load
if (typeof window !== 'undefined') {
  if (getInitialTheme()) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
