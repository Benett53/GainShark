import { beforeEach, describe, expect, test } from "bun:test";

const STORAGE_KEY = "gainshark-settings";
const store = new Map<string, string>();

// the module reads storage at import time and listens for storage events
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  },
});

Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: { addEventListener: () => undefined },
});

const settings = await import("../settings");

beforeEach(() => {
  store.clear();
});

describe("master volume defaults", () => {
  test("nothing in storage means 100, so a fresh install sounds unchanged", () => {
    expect(settings.parseSettings(null).master).toBe(100);
  });

  test("a record written before the field existed keeps working", () => {
    const parsed = settings.parseSettings(
      JSON.stringify({ boosts: { "user-7": 150 }, limiter: false }),
    );

    expect(parsed.master).toBe(100);
    expect(parsed.boosts["user-7"]).toBe(150);
    expect(parsed.limiter).toBe(false);
  });

  test("a stored master is restored next to the per-user volumes", () => {
    const parsed = settings.parseSettings(
      JSON.stringify({ boosts: { "user-7": 150 }, master: 35 }),
    );

    expect(parsed.master).toBe(35);
    expect(parsed.boosts["user-7"]).toBe(150);
  });

  test("a stored master that is not a number falls back to 100", () => {
    expect(settings.parseSettings(JSON.stringify({ master: "half" })).master).toBe(
      100,
    );
  });

  test("a stored master outside 0-100 is clamped", () => {
    expect(settings.parseSettings(JSON.stringify({ master: 250 })).master).toBe(
      100,
    );
    expect(settings.parseSettings(JSON.stringify({ master: -10 })).master).toBe(
      0,
    );
  });
});

describe("setMaster", () => {
  test("clamps and rounds what it stores", () => {
    settings.setMaster(52.6);
    expect(settings.getMaster()).toBe(53);

    settings.setMaster(-20);
    expect(settings.getMaster()).toBe(0);

    settings.setMaster(180);
    expect(settings.getMaster()).toBe(100);
  });

  test("is saved in the same record as the boosts", () => {
    settings.setMaster(40);
    settings.setBoost("user-7", 150);

    const saved = JSON.parse(store.get(STORAGE_KEY) ?? "{}");

    expect(saved.master).toBe(40);
    expect(saved.boosts["user-7"]).toBe(150);
  });
});
