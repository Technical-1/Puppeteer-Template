import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "node:events";
import { run } from "./runner.js";

// ── shared mock objects ──────────────────────────────────────────────────────
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
    createEventLogger: makeEventLogger,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── tests ────────────────────────────────────────────────────────────────────
describe("runner.run", () => {
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

  it("applies stealth only when toggled", async () => {
    const deps = makeDeps();
    await run({ url: "https://x.test", headless: true, stealth: true }, () => {}, deps);
    expect(mockApplyStealth).toHaveBeenCalledTimes(1);
  });

  it("applies a fingerprint only when toggled", async () => {
    const deps = makeDeps();
    await run({ url: "https://x.test", headless: true, fingerprint: true }, () => {}, deps);
    expect(mockApplyFP).toHaveBeenCalledTimes(1);
  });

  it("captures a screenshot only when toggled", async () => {
    const deps = makeDeps();
    await run(
      { url: "https://x.test", headless: true, screenshot: true, screenshotDir: "/tmp" },
      () => {},
      deps,
    );
    expect(mockScreenshot).toHaveBeenCalledTimes(1);
  });
});
