import {
  MAX_BOOST,
  MAX_MASTER,
  MIN_BOOST,
  MIN_MASTER,
  STORAGE_KEY,
} from "./constants";

/**
 * Per-browser boost settings, stored next to Sharkord's own volume settings
 * in localStorage. Keys use the same format as Sharkord's volume keys:
 * `user-{id}`, `userscreen-{id}` and `external-{pluginId}-{key}`.
 */
type TSettings = {
  /** boost in percent per volume key, only stored when above 100 */
  boosts: Record<string, number>;
  /** run boosted audio through a limiter so it does not clip */
  limiter: boolean;
  /**
   * one percentage that scales every voice down together, 100 by default.
   * It never changes the per-user volumes, only what reaches the speakers.
   */
  master: number;
};

const DEFAULT_SETTINGS: TSettings = { boosts: {}, limiter: true, master: 100 };

const clampBoost = (value: number) =>
  Math.min(MAX_BOOST, Math.max(MIN_BOOST, Math.round(value)));

const clampMaster = (value: number) =>
  Math.min(MAX_MASTER, Math.max(MIN_MASTER, Math.round(value)));

/**
 * Turns whatever is in storage into settings. Anything missing or malformed
 * falls back to its default, so a record written by an older version, or by a
 * version that never had a master slider, keeps working.
 */
const parseSettings = (raw: string | null): TSettings => {
  if (!raw) return DEFAULT_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as Partial<TSettings>;
    const boosts: Record<string, number> = {};

    for (const [key, value] of Object.entries(parsed.boosts ?? {})) {
      if (typeof value !== "number" || !Number.isFinite(value)) continue;

      const boost = clampBoost(value);

      if (boost > MIN_BOOST) boosts[key] = boost;
    }

    return {
      boosts,
      limiter:
        typeof parsed.limiter === "boolean"
          ? parsed.limiter
          : DEFAULT_SETTINGS.limiter,
      master:
        typeof parsed.master === "number" && Number.isFinite(parsed.master)
          ? clampMaster(parsed.master)
          : DEFAULT_SETTINGS.master,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const load = (): TSettings => parseSettings(localStorage.getItem(STORAGE_KEY));

let state: TSettings = load();
const listeners = new Set<() => void>();

const commit = (next: TSettings) => {
  state = next;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage full or blocked, the value still applies for this session
  }

  listeners.forEach((listener) => listener());
};

const getSettings = () => state;

const subscribeSettings = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const getBoost = (key: string) => state.boosts[key] ?? MIN_BOOST;

const setBoost = (key: string, value: number) => {
  const boost = clampBoost(value);

  if (getBoost(key) === boost) return;

  const boosts = { ...state.boosts };

  if (boost > MIN_BOOST) {
    boosts[key] = boost;
  } else {
    delete boosts[key];
  }

  commit({ ...state, boosts });
};

const resetAllBoosts = () => commit({ ...state, boosts: {} });

const setLimiter = (limiter: boolean) => commit({ ...state, limiter });

const getMaster = () => state.master;

const setMaster = (value: number) => {
  const master = clampMaster(value);

  if (state.master === master) return;

  commit({ ...state, master });
};

// keep several open tabs in sync
window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY) return;

  state = load();
  listeners.forEach((listener) => listener());
});

export {
  getBoost,
  getMaster,
  getSettings,
  parseSettings,
  resetAllBoosts,
  setBoost,
  setLimiter,
  setMaster,
  subscribeSettings,
};
export type { TSettings };
