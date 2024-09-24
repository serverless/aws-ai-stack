import { execSync } from "child_process";

class Scripts {
  constructor(serverless, options, utils) {
    this.serverless = serverless;
    this.options = options;
    this.utils = utils;

    this.commands = {};
    this.hooks = {};

    this.defineCommands();
    this.defineHooks();
  }

  getConfig() {
    const service = this.serverless.service;
    return service.custom && service.custom.scripts;
  }

  defineCommands() {
    const config = this.getConfig();
    const commands = config && config.commands;
    if (!commands) return;

    for (const name of Object.keys(commands)) {
      if (!this.commands[name]) {
        this.commands[name] = { lifecycleEvents: [] };
      }
      this.commands[name].lifecycleEvents.push(name);

      this.hooks[`${name}:${name}`] = this.runCommand.bind(this, name);
    }
  }

  defineHooks() {
    const config = this.getConfig();
    const hooks = config && config.hooks;
    if (!hooks) return;

    for (const name of Object.keys(hooks)) {
      this.hooks[name] = this.runHook.bind(this, name);
    }
  }

  runCommand(name) {
    const commands = this.getConfig().commands;
    const command = commands[name];
    this.execute(command);
  }

  runHook(name) {
    const hooks = this.getConfig().hooks;
    const hook = hooks[name];
    this.execute(hook);
  }

  execute(command) {
    let stdio = ["ignore", "ignore", "inherit"];

    if (this.options.verbose || this.options.debug) {
      stdio = "inherit";
    }

    execSync(command, { stdio });
  }
}

export default Scripts;
