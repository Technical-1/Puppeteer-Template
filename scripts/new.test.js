import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scaffold, listTemplates } from "./new.js";

let work;
beforeEach(() => { work = mkdtempSync(join(tmpdir(), "tmpl-")); });
afterEach(() => rmSync(work, { recursive: true, force: true }));

describe("scaffold", () => {
  it("lists available templates from templates/", () => {
    expect(listTemplates()).toContain("electron-gui-app");
  });
  it("copies a template into an empty target, skipping node_modules, keeping lockfile", () => {
    const target = join(work, "proj");
    scaffold("electron-gui-app", target);
    expect(existsSync(join(target, "package.json"))).toBe(true);
    expect(existsSync(join(target, "main.js"))).toBe(true);
    expect(existsSync(join(target, "node_modules"))).toBe(false);
    expect(existsSync(join(target, "pnpm-lock.yaml"))).toBe(true);
    expect(existsSync(join(target, ".npmrc"))).toBe(true);
  });
  it("throws on an unknown template", () => {
    expect(() => scaffold("nope", join(work, "x"))).toThrow(/Unknown template/);
  });
  it("throws when the target exists and is non-empty", () => {
    const target = join(work, "full");
    mkdirSync(target); writeFileSync(join(target, "f"), "x");
    expect(() => scaffold("electron-gui-app", target)).toThrow(/not empty/);
  });
});
