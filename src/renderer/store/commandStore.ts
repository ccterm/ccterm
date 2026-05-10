import { create } from 'zustand';

export interface Command {
  id: string;
  label: string;
  description: string;
  keys?: string;
  action: () => void;
}

interface CommandState {
  commands: Command[];
  isOpen: boolean;

  registerCommands: (cmds: Command[]) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useCommandStore = create<CommandState>((set, get) => ({
  commands: [],
  isOpen: false,

  registerCommands: (cmds) => {
    set((state) => ({
      commands: [...state.commands, ...cmds],
    }));
  },

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
