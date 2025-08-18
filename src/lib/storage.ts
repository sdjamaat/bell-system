const STORAGE_KEY = "bell-system:schedule";
const SOUND_KEY = "bell-system:sound-enabled";

export function saveSchedule<T>(data: T) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function loadSchedule<T>(fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, JSON.stringify(enabled));
  } catch {
    // ignore
  }
}

export function loadSoundEnabled(fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(SOUND_KEY);
    if (raw === null) return fallback;
    return JSON.parse(raw) as boolean;
  } catch {
    return fallback;
  }
}


