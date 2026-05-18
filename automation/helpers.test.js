import { describe, it, expect, vi } from 'vitest';
import { safeClick, safeType, waitAndGet, screenshot, scroll } from './helpers.js';
import os from 'os';
import path from 'path';
import fs from 'fs';

function mockPage(overrides = {}) {
  return {
    waitForSelector: vi.fn().mockResolvedValue(true),
    click: vi.fn().mockResolvedValue(),
    type: vi.fn().mockResolvedValue(),
    evaluate: vi.fn().mockResolvedValue(undefined),
    screenshot: vi.fn().mockResolvedValue(),
    ...overrides
  };
}

describe('safeClick', () => {
  it('waits then clicks', async () => {
    const page = mockPage();
    await safeClick(page, '#btn');
    expect(page.waitForSelector).toHaveBeenCalledWith('#btn', expect.objectContaining({ visible: true }));
    expect(page.click).toHaveBeenCalledWith('#btn');
  });
  it('throws a clear error with the selector when not found', async () => {
    const page = mockPage({ waitForSelector: vi.fn().mockRejectedValue(new Error('timeout')) });
    await expect(safeClick(page, '#missing')).rejects.toThrow(/safeClick.*#missing/);
  });
});

describe('safeType', () => {
  it('waits then types', async () => {
    const page = mockPage();
    await safeType(page, '#in', 'abc');
    expect(page.waitForSelector).toHaveBeenCalledWith('#in', expect.objectContaining({ visible: true }));
    expect(page.type).toHaveBeenCalledWith('#in', 'abc', expect.any(Object));
  });
  it('throws a clear error with the selector when not found', async () => {
    const page = mockPage({ waitForSelector: vi.fn().mockRejectedValue(new Error('timeout')) });
    await expect(safeType(page, '#missing', 'x')).rejects.toThrow(/safeType.*#missing/);
  });
});

describe('waitAndGet', () => {
  it('returns trimmed text content', async () => {
    const page = mockPage({ evaluate: vi.fn().mockResolvedValue('  hello  ') });
    const text = await waitAndGet(page, '#x');
    expect(page.waitForSelector).toHaveBeenCalledWith('#x', expect.objectContaining({ visible: true }));
    expect(page.evaluate).toHaveBeenCalled();
    expect(text).toBe('hello');
  });
});

describe('screenshot', () => {
  it('creates dir and returns a timestamped png path', async () => {
    const dir = path.join(os.tmpdir(), 'kdt-test-' + Date.now());
    const page = mockPage();
    const out = await screenshot(page, 'shot', { dir });
    expect(out.startsWith(dir)).toBe(true);
    expect(out.endsWith('.png')).toBe(true);
    expect(out).toContain('shot');
    expect(fs.existsSync(dir)).toBe(true);
    expect(page.screenshot).toHaveBeenCalledWith(expect.objectContaining({ path: out }));
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('scroll', () => {
  it('scrolls to bottom by default', async () => {
    let captured;
    const page = mockPage({ evaluate: vi.fn(async (fn, by) => { captured = { fn, by }; }) });
    await scroll(page);
    const win = { scrollBy: vi.fn(), scrollTo: vi.fn() };
    global.window = win;
    global.document = { body: { scrollHeight: 4321 } };
    captured.fn(captured.by);
    expect(win.scrollTo).toHaveBeenCalledWith(0, 4321);
    expect(win.scrollBy).not.toHaveBeenCalled();
    delete global.window; delete global.document;
  });
  it('scrolls by a pixel amount when opts.by is given', async () => {
    let captured;
    const page = mockPage({ evaluate: vi.fn(async (fn, by) => { captured = { fn, by }; }) });
    await scroll(page, { by: 500 });
    const win = { scrollBy: vi.fn(), scrollTo: vi.fn() };
    global.window = win;
    global.document = { body: { scrollHeight: 4321 } };
    captured.fn(captured.by);
    expect(win.scrollBy).toHaveBeenCalledWith(0, 500);
    expect(win.scrollTo).not.toHaveBeenCalled();
    delete global.window; delete global.document;
  });
});
