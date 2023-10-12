import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import childProcess from "child_process";

export const log = {
  warning(msg = "") {
    console.log(chalk.yellow(`${msg}`));
  },
  error(msg = "") {
    console.log(chalk.red(`${msg}`));
  },
  success(msg = "") {
    console.log(chalk.green(`${msg}`));
  },
};

export const copyFiles = async (tempPath, targetPath, excludes = []) => {
  await fs.copySync(tempPath, targetPath);
  if (excludes.length) {
    await Promise.all(
      excludes.map(
        (file) => async () =>
          await fs.removeSync(path.resolve(targetPath, file))
      )
    );
  }
};

export const isFunction = (val) => typeof val === "function";

export const parseCmdParams = (cmd) => {
  if (!cmd) return {};
  const resOps = {};
  Object.keys(cmd).forEach((key) => {
    if (cmd[key] && !isFunction(cmd[key])) {
      resOps[key] = cmd[key];
    }
  });
  return resOps;
};

export const runCmd = (cmd) => {
  return new Promise((resolve, reject) => {
    childProcess.exec(cmd, (err, ...arg) => {
      if (err) return reject(err);
      return resolve(arg);
    });
  });
};

export const getGitUser = () => {
  return new Promise(async (resolve, reject) => {
    const user = {};
    try {
      const [name] = await runCmd("git config user.name");
      const [email] = await runCmd("git config user.email");
      if (name) user.name = name.replace(/\n/g, "");
      if (email) user.email = `<${email || ""}>`.replace(/\n/g, "");
    } catch (error) {
      log.error("failed to get git info for current user");
      reject(error);
    } finally {
      resolve(user);
    }
  });
};
