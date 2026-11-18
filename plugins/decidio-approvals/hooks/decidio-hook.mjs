#!/usr/bin/env node
// Decidio approvals: the plugin's ONE hook launcher (cycle plugins, founder F-1109-13 (a')). Every hook in hooks.json runs
// `node ${CLAUDE_PLUGIN_ROOT}/hooks/decidio-hook.mjs <event>` in exec form, so no hook command holds a shell variable, a command
// substitution or an inline program (the Claude plugin directory's pre-submission checklist), and Windows runs the same line as
// macOS and Linux - no Git Bash, no PowerShell.
//
// What it does, and nothing more - exactly what the shell lines it replaces did:
//   1. Enter the project folder Claude Code names (CLAUDE_PROJECT_DIR), as `cd "$CLAUDE_PROJECT_DIR"` did; if it can't, exit 1 (pretool:
//      a deny), so a gate that cannot answer never answers yes. npx itself starts in the home folder (Lane L, l-lock) and is told the
//      project in DECIDIO_HOOK_CWD, so the project's node_modules and .npmrc never decide which code runs.
//   2. Run the pinned SDK release's hook, `npx -y @decidio/sdk@<release> hook <event>`, with this process's stdin, stdout and
//      stderr, and exit with its exit code. On Windows npx is a .cmd file, which Node starts only through a shell - and cmd.exe looks
//      in the current folder (the project, after step 1) before PATH, so NoDefaultCurrentDirectoryInExePath=1 keeps it from running
//      an npx.cmd that sits in the project.
//   3. For `prompt`, the pre-filter the shell `case` was: the SDK starts only when the prompt's JSON mentions Decidio (any case), so
//      every other prompt costs one read of stdin.
//   4. For `pretool` (Lane L, GH-12): the launcher refuses by itself. It reads the SDK's answer and passes it on only when the SDK exited
//      0 and said nothing (a call it lets alone) or exactly one JSON object; if the SDK can't start, exits otherwise or on a signal, says
//      something else, or runs past 140 s, the launcher prints a deny - so a Claude Code too old for `onFailure: "block"` (below 2.1.295)
//      still gets a deny from a hook that failed. DECIDIO_HOOK_STARTED_AT tells the SDK when this began, so its hold ends in time.
//   5. For `notice` (Lane L, l-mcp-notice; F-1117-LL1's condition): the one-time line to the person after an MCP call Decidio didn't
//      check, answered here in this process, before step 1 - never through npx, which every MCP call would wait 0.8-1.1 s for. Its line is
//      the SDK's hookNoticeScript() verbatim, the line every settings file runs with `node -e` (cli-smoke holds the two equal). It never
//      errors: any surprise is silence and exit 0.
// The release pin moves with the SDK (packages/conformance/manifests.mjs holds every pin under the plugin to the SDK's version).
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { createRequire } from "node:module";

const SDK = "@decidio/sdk@0.20.1";
const EVENTS = ["pretool", "posttool", "session", "prompt"];

const event = process.argv[2];
if (event === "notice") {
const require = createRequire(import.meta.url);
"decidio hook notice";(function(){function go(raw){try{const fs=require("fs"),p=require("path"),os=require("os"),E=process.env;const i=JSON.parse(raw);if(!i||typeof i!=="object"||Array.isArray(i))return;if(i.agent_id!==undefined&&i.agent_id!==null)return;const t=typeof i.tool_name==="string"?i.tool_name:"";if(!t.startsWith("mcp__")||new RegExp("^mcp__.+__(?:(?:[^_-]+[_-])*|.*[a-z])(?:(?:[Dd]elete|DELETE|[Dd]rop|DROP|[Dd]estroy|DESTROY|[Pp]urge|PURGE|[Tt]erminate|TERMINATE|[Tt]runcate|TRUNCATE|[Ww]ipe|WIPE|[Rr]eset|RESET|[Ff]lush|FLUSH|[Rr]emove|REMOVE|[Pp]rune|PRUNE|[Uu]npublish|UNPUBLISH|[Yy]ank|YANK|[Dd]eprecate|DEPRECATE|[Aa]rchive|ARCHIVE|[Rr]ollback|ROLLBACK|[Pp]ublish|PUBLISH|[Ss]ql|SQL|[Ee]xecute|EXECUTE|[Ee]xec|EXEC|[Ss]tatement|STATEMENT|[Mm]igration|MIGRATION|[Mm]igrate|MIGRATE|[Ss]hell|SHELL|[Tt]erminal|TERMINAL|[Bb]ash|BASH|[Cc]ommand|COMMAND|[Cc]md|CMD|[Ss]pawn|SPAWN)|(?:[Ff]orce|FORCE)[_-]?(?:[Pp]ush|PUSH)|(?:[Cc]reate|CREATE)[_-]?(?:[Rr]elease|RELEASE)|(?:[Ww]rite|WRITE|[Ee]dit|EDIT|[Mm]ove|MOVE|[Rr]ename|RENAME|[Cc]opy|COPY|[Ss]ave|SAVE|[Pp]ut|PUT|[Cc]reate|CREATE|[Uu]pdate|UPDATE|[Aa]ppend|APPEND)[_-]?(?:[Ff]ile|FILE)|(?:[Ww]rite|WRITE|[Ee]dit|EDIT|[Mm]ove|MOVE|[Rr]ename|RENAME|[Cc]opy|COPY|[Ss]ave|SAVE|[Pp]ut|PUT|[Cc]reate|CREATE|[Uu]pdate|UPDATE|[Aa]ppend|APPEND)[_-]?(?:[Tt]ext|TEXT)[_-]?(?:[Ff]ile|FILE)|(?:[Ee]dit|EDIT)[_-]?(?:[Bb]lock|BLOCK)|(?:[Ss]tart|START)[_-]?(?:[Pp]rocess|PROCESS)|(?:[Rr]un|RUN)[_-]?(?:[Cc]ommand|COMMAND|[Ss]cript|SCRIPT))").test(t))return;const s=i.mcp_server&&typeof i.mcp_server.name==="string"?i.mcp_server.name:t.slice(5,Math.max(5,t.lastIndexOf("__")));if(/decidio/i.test(s))return;const c=[...s.replace(/[\p{Cc}\p{Cf}]/gu,"")],n=c.length>64?c.slice(0,63).join("")+"\u2026":c.join("");const id=typeof i.session_id==="string"?i.session_id:"";if(!n||!id)return;const w=process.platform==="win32",h=w?(E.USERPROFILE??os.homedir()):(E.HOME??os.homedir());const d=E.CLAUDE_PLUGIN_DATA?p.join(E.CLAUDE_PLUGIN_DATA,"hooks"):p.join(w?(E.LOCALAPPDATA??p.join(h,"AppData","Local")):(E.XDG_CONFIG_HOME??p.join(h,".config")),"decidio","hooks");fs.mkdirSync(d,{recursive:true});fs.writeFileSync(p.join(d,"notice-"+require("crypto").createHash("sha256").update(id+"\0"+s,"utf8").digest("hex")),"",{flag:"wx"});process.stdout.write(JSON.stringify({systemMessage:"Claude just used "+n+" via MCP. This call isn\u0027t protected by Decidio - to have "+n+"\u0027s calls approved first, see \"MCP tool calls\" at https://www.npmjs.com/package/@decidio/sdk"})+"\n")}catch(e){}}process.stdout.on("error",function(){});let raw="";process.stdin.setEncoding("utf8");process.stdin.on("data",function(c){if(raw===null)return;raw+=c;if(raw.length>4e6){raw=null;process.stdin.destroy()}});process.stdin.on("end",function(){if(raw!==null)go(raw)});process.stdin.on("error",function(){})})()
} else {   // every other event: the pinned SDK's hook through npx (this block is the rest of the file)
const PRETOOL = event === "pretool";
const PRETOOL_LIMIT_MS = 140_000;   // under the hook's own 150 s timeout, above the SDK's 120 s hold cap
let answered = false;
/** pretool only: the launcher's own deny, printed once (a gate that cannot answer never answers yes). */
function denyAndExit(why) {
  if (answered) return;
  answered = true;
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: `Decidio hook: ${why} - refusing this tool call (fail closed). Nothing ran.` } }) + "\n");
  process.exit(0);
}
if (!EVENTS.includes(event) || process.argv.length !== 3) {
  process.stderr.write(`decidio-hook: expected one of ${EVENTS.join(", ")}\n`);
  if (PRETOOL) denyAndExit("Decidio's hook line is malformed");
  process.exit(1);
}
const dir = process.env.CLAUDE_PROJECT_DIR;
if (dir) {
  try {
    process.chdir(dir);
  } catch (e) {
    process.stderr.write(`decidio-hook: can't enter the project folder (${e instanceof Error ? e.message : String(e)})\n`);
    if (PRETOOL) denyAndExit("Decidio's hook can't enter the project folder");
    process.exit(1);
  }
}

/** Run the SDK's hook; `input` (the prompt hook's stdin, already read) is written to it, else it reads this process's stdin. */
function runHook(input) {
  const win = process.platform === "win32";
  const child = spawn("npx", ["-y", SDK, "hook", event], {
    stdio: [input === undefined ? "inherit" : "pipe", PRETOOL ? "pipe" : "inherit", "inherit"],
    shell: win, // npx is npx.cmd on Windows; the arguments are fixed words, so the shell parses nothing of ours
    windowsHide: true,
    // Lane L (l-lock, the privacy council's finding): npx starts in the person's home folder, never the project's, so a project's
    // node_modules or .npmrc never decides what code runs here (npm reads ~/.npmrc anyway; the folders above home are the
    // administrator's - never the shared temp folder, which anyone on the computer can write); the hook is told the project
    // (DECIDIO_HOOK_CWD) and works in it as before
    cwd: homedir(),
    env: { ...process.env, NoDefaultCurrentDirectoryInExePath: "1", DECIDIO_HOOK_CWD: process.cwd(), ...(PRETOOL ? { DECIDIO_HOOK_STARTED_AT: String(Date.now()) } : {}) }, // cmd.exe: never an npx from the project folder, only PATH's
  });
  for (const sig of ["SIGTERM", "SIGINT", "SIGHUP"]) process.on(sig, () => child.kill(sig));
  child.on("error", (e) => {
    process.stderr.write(`decidio-hook: couldn't start npx (${e.message}) - Decidio's hook needs Node 18+ and npm on this computer\n`);
    if (PRETOOL) denyAndExit("Decidio's hook couldn't start (it needs Node 18+ and npm on this computer)");
    process.exit(1);
  });
  if (PRETOOL) {
    const out = [];
    child.stdout.on("data", (c) => out.push(c));
    const timer = setTimeout(() => { child.kill("SIGTERM"); denyAndExit("Decidio's hook didn't answer in time"); }, PRETOOL_LIMIT_MS);
    child.on("close", (code) => {
      clearTimeout(timer);
      if (answered) return;
      const text = Buffer.concat(out).toString("utf8").trim();
      if (code !== 0) return denyAndExit(`Decidio's hook failed (${code === null ? "stopped by a signal" : `exit ${code}`})`);
      let ok = text === "";   // exit 0, nothing said: a call the hook lets alone (Claude Code's own check decides)
      if (!ok) { try { const j = JSON.parse(text); ok = !!j && typeof j === "object" && !Array.isArray(j); } catch { ok = false; } }
      if (!ok) return denyAndExit("Decidio's hook gave an answer this launcher doesn't understand");
      answered = true;
      if (text) process.stdout.write(text + "\n");
      process.exit(0);
    });
  } else child.on("exit", (code) => process.exit(code ?? 1));
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
}
