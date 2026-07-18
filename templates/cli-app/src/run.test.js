import { describe, it, expect, vi, beforeEach } from "vitest";
import { run } from "./run.js";

function makeDeps(overrides = {}) {
  return {
    puppeteer: {},
    ensureChrome: vi.fn(async () => "/fake/chrome"),
    withBrowser: vi.fn(async (_p, _o, fn) => fn({ newPage: vi.fn(async () => ({})) })),
    goto: vi.fn(),
    extractText: vi.fn(async () => "Example"),
    applyStealth: vi.fn((p) => p),
    randomFingerprint: vi.fn(() => ({ locale: "en-US", timezoneId: "America/New_York" })),
    applyFingerprint: vi.fn(),
    screenshot: vi.fn(async () => Buffer.from("png")),
    timestampedPath: vi.fn(() => "/tmp/shot.png"),
    ...overrides,
  };
}
function logger() { const lines = []; return { lines, log: (m, l = "info") => lines.push([l, m]) }; }

beforeEach(() => vi.clearAllMocks());

describe("cli run", () => {
  it("ensures Chrome, navigates, logs done", async () => {
    const d = makeDeps(); const lg = logger();
    await run({ url: "https://example.com" }, lg, d);
    expect(d.ensureChrome).toHaveBeenCalledTimes(1);
    expect(d.goto).toHaveBeenCalledTimes(1);
    expect(lg.lines.some(([, m]) => /Done/i.test(m))).toBe(true);
  });
  it("applies stealth only when toggled", async () => {
    const d = makeDeps(); await run({ url: "u", stealth: true }, logger(), d);
    expect(d.applyStealth).toHaveBeenCalledTimes(1);
    const d2 = makeDeps(); await run({ url: "u" }, logger(), d2);
    expect(d2.applyStealth).not.toHaveBeenCalled();
  });
  it("applies fingerprint only when toggled", async () => {
    const d = makeDeps(); await run({ url: "u", fingerprint: true }, logger(), d);
    expect(d.applyFingerprint).toHaveBeenCalledTimes(1);
    const d2 = makeDeps(); await run({ url: "u" }, logger(), d2);
    expect(d2.applyFingerprint).not.toHaveBeenCalled();
  });
  it("captures a screenshot only when toggled", async () => {
    const fs = require("node:fs");
    vi.spyOn(fs, "mkdirSync").mockReturnValue(undefined);
    vi.spyOn(fs, "writeFileSync").mockReturnValue(undefined);
    vi.spyOn(fs, "existsSync").mockReturnValue(true); // happy path: the shot landed
    const d = makeDeps(); await run({ url: "u", screenshot: true, screenshotDir: "/tmp" }, logger(), d);
    expect(d.screenshot).toHaveBeenCalledTimes(1);
    const d2 = makeDeps(); await run({ url: "u" }, logger(), d2);
    expect(d2.screenshot).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
  it("fails loudly if a screenshot was requested but none was produced", async () => {
    const fs = require("node:fs");
    vi.spyOn(fs, "mkdirSync").mockReturnValue(undefined);
    vi.spyOn(fs, "writeFileSync").mockReturnValue(undefined);
    vi.spyOn(fs, "existsSync").mockReturnValue(false); // simulate the shot never landing on disk
    const d = makeDeps();
    await expect(
      run({ url: "u", screenshot: true, screenshotDir: "/tmp" }, logger(), d),
    ).rejects.toThrow(/screenshot was requested but none was produced/i);
    vi.restoreAllMocks();
  });
});
