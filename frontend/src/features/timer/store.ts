import { create } from "zustand";

const DEFAULT_REST_TIME = 180;

export interface TimerState {
  currentTime: number;
  restTime: number;
  isRunning: boolean;
  timerInterval: NodeJS.Timeout | null;
  start: () => void;
  pause: () => void;
  play: () => void;
  clear: () => void;
  setTime: (time: number) => void;
}

export const useTimer = create<TimerState>((set, get) => {
  const startInterval = () => {
    const currentInterval = get().timerInterval;
    if (currentInterval) clearInterval(currentInterval);

    const interval = setInterval(() => {
      set((state) => ({ currentTime: state.currentTime - 1 }));
    }, 1000);

    return interval;
  };

  return {
    currentTime: 0,
    restTime: DEFAULT_REST_TIME,
    isRunning: false,
    timerInterval: null,

    start: () => {
      const interval = startInterval();
      set({
        isRunning: true,
        currentTime: get().restTime,
        timerInterval: interval,
      });
    },

    play: () => {
      const interval = startInterval();
      set({ isRunning: true, timerInterval: interval });
    },

    pause: () => {
      const { timerInterval } = get();
      if (timerInterval) clearInterval(timerInterval);
      set({ isRunning: false, timerInterval: null });
    },

    clear: () => {
      const { timerInterval } = get();
      if (timerInterval) clearInterval(timerInterval);
      set({ isRunning: false, timerInterval: null, currentTime: 0 });
    },

    setTime: (time: number) => set({ currentTime: time }),
  };
});
