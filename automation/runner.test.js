import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "node:events";
import { createRequire } from "node:module";
import { run } from "./runner.js";

// runner.js is CJS — grab the same fs object it uses so spies intercept correctly
const require = createRequire(import.meta.url);
const fs = require("fs");

// ── shared mock fns ──────────────────────────────────────────────────────────
const mockApplyStealth  = vi.fn((p) => p);
const mockGoto          = vi.fn();
const mockApplyFP       = vi.fn();
const mockScreenshot    = vi.fn(async () => Buffer.from("png"));
const mockExtractText   = vi.fn(async () => "Example Domain");

function makeEventLogger() {
  const e = new EventEmitter();
  e.log = (message, level = "info") => e.emit("log", { message, level });
  return e;
}

/** Builds a full deps object with every field mocked. */
function makeDeps(overrides = {}) {
  return {
    puppeteer:         { launch: vi.fn() },
    resolveChromePath: vi.fn(() => "/fake/chrome"),
    withBrowser:       vi.fn(async (_pptr, _opts, fn) =>
      fn({ newPage: vi.fn(async () => ({})) })
    ),
    goto:              mockGoto,
    extractText:       mockExtractText,
    applyStealth:      mockApplyStealth,
    randomFingerprint: vi.fn(() => ({ locale: "en-US", timezoneId: "America/New_York" })),
    applyFingerprint:  mockApplyFP,
    screenshot:        mockScreenshot,
    timestampedPath:   vi.fn(() => "/tmp/shot-x.png"),
    createEventLogger: makeEventLogger,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── tests ─────────────────────────────────────────────────────────────────────
describe("runner.run", () => {
  // ── navigation + logging ──────────────────────────────────────────────────
  it("navigates and streams logs through onLog", async () => {
    const logs = [];
    const deps = makeDeps();
    await run(
      { url: "https://example.com", headless: true },
      (m, l) => logs.push([l, m]),
      deps,
    );
    expect(mockGoto).toHaveBeenCalledTimes(1);
    expect(logs.some(([, m]) => /Automation complete/i.test(m))).toBe(true);
  });

  // ── stealth toggle ────────────────────────────────────────────────────────
  it("applies stealth only when toggled ON", async () => {
    const deps = makeDeps();
    await run({ url: "https://x.test", headless: true, stealth: true }, () => {}, deps);
    expect(mockApplyStealth).toHaveBeenCalledTimes(1);
  });

  it("does NOT apply stealth when toggle is absent", async () => {
    const deps = makeDeps();
    await run({ url: "https://x.test", headless: true }, () => {}, deps);
    expect(mockApplyStealth).not.toHaveBeenCalled();
  });

  // ── fingerprint toggle ────────────────────────────────────────────────────
  it("applies a fingerprint only when toggled ON", async () => {
    const deps = makeDeps();
    await run({ url: "https://x.test", headless: true, fingerprint: true }, () => {}, deps);
    expect(mockApplyFP).toHaveBeenCalledTimes(1);
  });

  it("does NOT apply fingerprint when toggle is absent", async () => {
    const deps = makeDeps();
    await run({ url: "https://x.test", headless: true }, () => {}, deps);
    expect(mockApplyFP).not.toHaveBeenCalled();
  });

  // ── screenshot toggle ─────────────────────────────────────────────────────
  it("captures a screenshot only when toggled ON", async () => {
    vi.spyOn(fs, "mkdirSync").mockReturnValue(undefined);
    vi.spyOn(fs, "writeFileSync").mockReturnValue(undefined);
    const deps = makeDeps();
    await run(
      { url: "https://x.test", headless: true, screenshot: true, screenshotDir: "/tmp" },
      () => {},
      deps,
    );
    expect(mockScreenshot).toHaveBeenCalledTimes(1);
  });

  it("does NOT capture a screenshot when toggle is absent", async () => {
    const deps = makeDeps();
    await run({ url: "https://x.test", headless: true }, () => {}, deps);
    expect(mockScreenshot).not.toHaveBeenCalled();
  });
});
