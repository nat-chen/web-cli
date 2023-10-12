#!/usr/bin/env node

import path from "path";
import ora from "ora";
import fs from "fs-extra";
import download from "download-git-repo";
import {
  copyFiles,
  parseCmdParams,
  getGitUser,
  runCmd,
  log,
} from "../utils/index.js";
import { exit } from "process";
import inquirer from "inquirer";
import { InquirerConfig, RepoPath } from "../utils/config.js";

class Commander {
  constructor(source, destination, ops = {}) {
    this.source = source;
    this.cmdParams = parseCmdParams(destination);
    this.repoMaps = Object.assign(
      {
        repo: RepoPath,
        temp: path.join(path.resolve(), "../../__temp__"),
        target: this.genTargetPath(this.source),
      },
      ops
    );
    this.gitUser = {};
    this.spinner = ora();
    this.init();
  }
  genTargetPath(relPath = "vue-ts-template") {
    return path.resolve(process.cwd(), relPath);
  }
  async init() {
    try {
      await this.checkFolderExist();
      await this.downloadRepo();
      await this.copyRepoFiles();
      await this.updatePkgFile();
      await this.initGit();
      await this.runApp();
    } catch (error) {
      console.log("");
      log.error(error);
      exit(1);
    } finally {
      this.spinner.stop();
    }
  }
  checkFolderExist() {
    return new Promise(async (resolve, reject) => {
      const { target } = this.repoMaps;
      if (this.cmdParams.force) {
        await fs.removeSync(target);
        return resolve(undefined);
      }
      try {
        const isTarget = await fs.pathExistsSync(target);
        if (!isTarget) return resolve(undefined);
        const { recover } = await inquirer.prompt(InquirerConfig.folderExist);
        if (recover === "cover") {
          await fs.removeSync(target);
          return resolve(undefined);
        } else if (recover === "newFolder") {
          const { inputNewName } = await inquirer.prompt(InquirerConfig.rename);
          console.log(inputNewName);
          this.source = inputNewName;
          this.repoMaps.target = this.genTargetPath(`./${inputNewName}`);
          return resolve(undefined);
        } else {
          exit(1);
        }
      } catch (error) {
        log.error(`[web-cli]Error: ${error}`);
        exit(1);
      }
    });
  }
  downloadRepo() {
    this.spinner.start("Fetching target project template");
    const { repo, temp } = this.repoMaps;
    return new Promise(async (resolve, reject) => {
      await fs.removeSync(temp);
      download(repo, temp, {}, async (err) => {
        if (err) return reject(err);
        this.spinner.succeed("tempalte downloaded successfully");
        return resolve(undefined);
      });
    });
  }
  async copyRepoFiles() {
    const { temp, target } = this.repoMaps;
    await copyFiles(temp, target, ["./git", "./changelogs"]);
  }
  async updatePkgFile() {
    this.spinner.start("Updating package.json");
    const pkgPath = path.resolve(this.repoMaps.target, "package.json");
    const unnessaryKey = ["keywords", "license", "files"];
    const { name = "", email = "" } = await getGitUser();
    const jsonData = fs.readJsonSync(pkgPath);
    unnessaryKey.forEach((key) => delete jsonData[key]);
    Object.assign(jsonData, {
      name: this.source,
      author: name && email ? `${name} ${email}` : "",
      provide: true,
      version: "1.0.0",
    });
    await fs.writeJsonSync(pkgPath, jsonData, { spaces: "\t" });
    this.spinner.succeed("updated package.json");
  }
  async initGit() {
    this.spinner.start("initing git");
    await runCmd(`cd ${this.repoMaps.target}`);
    process.chdir(this.repoMaps.target);
    await runCmd(`git init`);
    this.spinner.succeed("completedly inited git");
  }
  async runApp() {
    try {
      this.spinner.start("installing dependencies, wait a moment...");
      await runCmd(`npm install`);
      await runCmd(`git add . && git commit -m "init: project structure"`);
      this.spinner.succeed("installed dependencies successfully！");
      console.log("try to run bleow command：\n");
      log.success(`   cd ${this.source}`);
      log.success(`   npm run serve`);
    } catch (error) {
      console.log(
        "failed installation, try to execute bloew command to install manually"
      );
      log.success(`   cd ${this.source}`);
      log.success(`   npm run install`);
    }
  }
}

export default Commander;
