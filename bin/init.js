#!/usr/bin/env node

import { Command } from "commander";
import Commander from "../src/commands/index.js";
import packageJson from "../package.json" assert { type: "json" };

const program = new Command();

program
  .usage("<command> [options]")
  .version(packageJson.version, "-v, --version", "display version for web-cli");

program
  .command("create")
  .description("create a template project")
  .argument("<name>", "project name")
  .option(
    "-f, --force",
    "ignore to check folder exists or not, it will cover the folders if existed"
  )
  .action((source, destination) => {
    new Commander(source, destination);
  });

try {
  program.parse(process.argv); // handle multiple argv
} catch (error) {
  console.log("err: ", error);
}
