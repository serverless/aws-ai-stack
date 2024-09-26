import { execSync } from "child_process";

/**
 * This is a custom Serverless Framework Plugin that allows you to
 * define and run custom scripts in your serverless.yml file, similar to npm scripts.
 * For more information on creating custom plugins, see the documentation:
 * https://www.serverless.com/framework/docs/guides/plugins/creating-plugins
 *
 * In this AI example, we need to run vite build script before deploying the website service.
 * So we built this quick plugin, and loaded it in the serverless.yml file.
 */

class Scripts {
  constructor(serverless, options, utils) {
    this.serverless = serverless;
    this.options = options; // CLI options are passed to the plugin
    this.utils = utils; // Helper logging functions are passed to the plugin

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
    // By default, only show stderr in the terminal
    // So that you can see any build errors that may occur
    let stdio = ["ignore", "ignore", "inherit"];

    // But in verbose or debug mode, we show all output
    if (this.options.verbose || this.options.debug) {
      stdio = "inherit";
    }

    // Execute the command/script in a child service
    execSync(command, { stdio });
  }
}

export default Scripts;
