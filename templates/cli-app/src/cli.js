#!/usr/bin/env node
const { Command } = require("commander");
const { createConsoleLogger } = require("@technical-1/logger");
const { run } = require("./run");

const program = new Command();
program
  .name("pptr-cli")
  .description("Browser automation CLI built on the @technical-1 suite")
  .argument("<url>", "URL to navigate to (http/https)")
  .option("--no-headless", "run with a visible browser window")
  .option("--stealth", "apply the stealth plugin")
  .option("--fingerprint", "apply a randomized fingerprint")
  .option("--screenshot <dir>", "capture a full-page screenshot into <dir>")
  .action(async (url, opts) => {
    const logger = createConsoleLogger();
    try {
      await run(
        { url, headless: opts.headless, stealth: opts.stealth, fingerprint: opts.fingerprint, screenshot: Boolean(opts.screenshot), screenshotDir: opts.screenshot },
        logger,
      );
      process.exitCode = 0;
    } catch (err) {
      logger.log(`Failed: ${err?.message ?? String(err)}`, "error");
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv);
