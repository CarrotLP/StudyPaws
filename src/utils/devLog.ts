type Listener = (text: string) => void;
let currentLog = '';
const listeners: Set<Listener> = new Set();

export const DevLog = {
  log: (text: string) => {
    currentLog = text;
    listeners.forEach((l) => l(currentLog));
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    listener(currentLog);
    return () => listeners.delete(listener);
  },
  getLog: () => currentLog,
};
