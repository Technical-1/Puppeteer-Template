#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const TEMPLATES_DIR = path.join(__dirname, "..", "templates");
const SKIP = new Set(["node_modules", "dist", "chrome-local", ".git"]);

/** Names of available templates (directories under templates/). */
function listTemplates() {
  try {
    return fs
      .readdirSync(TEMPLATES_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return [];
  }
}

/** Copy templates/<template> into target (skipping build/dep cruft). */
function scaffold(template, target) {
  const src = path.join(TEMPLATES_DIR, template);
  if (!fs.existsSync(src) || !fs.statSync(src).isDirectory()) {
    throw new Error(
      `Unknown template "${template}". Available: ${listTemplates().join(", ") || "(none)"}`,
    );
  }
  if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
    throw new Error(`Target "${target}" exists and is not empty.`);
  }
  fs.cpSync(src, target, {
    recursive: true,
    filter: (s) => !SKIP.has(path.basename(s)),
  });
}

function main(argv) {
  const [template, target] = argv;
  if (!template || !target) {
    console.error("usage: node scripts/new.js <template> <target-dir>");
    console.error(`templates: ${listTemplates().join(", ") || "(none)"}`);
    return 1;
  }
  try {
    scaffold(template, target);
  } catch (err) {
    console.error(err.message);
    return 1;
  }
  console.log(`Scaffolded "${template}" → ${target}`);
  console.log(`Next: cd ${target} && pnpm install && pnpm test`);
  if (template === "electron-gui-app") {
    console.log("Then: pnpm run download-chrome && pnpm start");
  }
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { scaffold, listTemplates };
