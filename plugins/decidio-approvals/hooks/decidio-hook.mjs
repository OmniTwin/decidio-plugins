#!/usr/bin/env node
// Decidio approvals: the plugin's ONE hook launcher (cycle plugins, founder F-1109-13 (a')). Every hook in hooks.json runs
// `node ${CLAUDE_PLUGIN_ROOT}/hooks/decidio-hook.mjs <event>` in exec form, so no hook command holds a shell variable, a command
// substitution or an inline program (the Claude plugin directory's pre-submission checklist), and Windows runs the same line as
// macOS and Linux - no Git Bash, no PowerShell.
//
// What it does, and nothing more - exactly what the shell lines it replaces did:
//   1. Enter the project folder Claude Code names (CLAUDE_PROJECT_DIR), as `cd "$CLAUDE_PROJECT_DIR"` did; if it can't, exit 1, so
//      the pretool hook's onFailure "block" holds (a gate that cannot answer never answers yes).
//   2. Run the pinned SDK release's hook, `npx -y @decidio/sdk@<release> hook <event>`, with this process's stdin, stdout and
//      stderr, and exit with its exit code. On Windows npx is a .cmd file, which Node starts only through a shell - and cmd.exe looks
//      in the current folder (the project, after step 1) before PATH, so NoDefaultCurrentDirectoryInExePath=1 keeps it from running
//      an npx.cmd that sits in the project.
//   3. For `prompt`, the pre-filter the shell `case` was: the SDK starts only when the prompt's JSON mentions Decidio (any case), so
//      every other prompt costs one read of stdin.
// The release pin moves with the SDK (packages/conformance/manifests.mjs holds every pin under the plugin to the SDK's version).
import { spawn } from "node:child_process";

const SDK = "@decidio/sdk@0.19.0";
const EVENTS = ["pretool", "posttool", "session", "prompt"];

const event = process.argv[2];
if (!EVENTS.includes(event) || process.argv.length !== 3) {
  process.stderr.write(`decidio-hook: expected one of ${EVENTS.join(", ")}\n`);
  process.exit(1);
}
const dir = process.env.CLAUDE_PROJECT_DIR;
if (dir) {
  try {
    process.chdir(dir);
  } catch (e) {
    process.stderr.write(`decidio-hook: can't enter the project folder (${e instanceof Error ? e.message : String(e)})\n`);
    process.exit(1);
  }
}

/** Run the SDK's hook; `input` (the prompt hook's stdin, already read) is written to it, else it reads this process's stdin. */
function runHook(input) {
  const win = process.platform === "win32";
  const child = spawn("npx", ["-y", SDK, "hook", event], {
    stdio: [input === undefined ? "inherit" : "pipe", "inherit", "inherit"],
    shell: win, // npx is npx.cmd on Windows; the arguments are fixed words, so the shell parses nothing of ours
    windowsHide: true,
    env: { ...process.env, NoDefaultCurrentDirectoryInExePath: "1" }, // cmd.exe: never an npx from the project folder, only PATH's
  });
  for (const sig of ["SIGTERM", "SIGINT", "SIGHUP"]) process.on(sig, () => child.kill(sig));
  child.on("error", (e) => {
    process.stderr.write(`decidio-hook: couldn't start npx (${e.message}) - Decidio's hook needs Node 18+ and npm on this computer\n`);
    process.exit(1);
  });
  child.on("exit", (code) => process.exit(code ?? 1));
  if (input !== undefined) child.stdin.end(input);
}

if (event === "prompt") {
  const chunks = [];
  process.stdin.on("data", (c) => chunks.push(c));
  process.stdin.on("end", () => {
    const input = Buffer.concat(chunks);
    if (/decidio/i.test(input.toString("utf8"))) runHook(input);
    else process.exit(0);
  });
} else {
  runHook(undefined);
}
