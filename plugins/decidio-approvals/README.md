# Decidio approvals

A person approves Claude Code's destructive shell commands before they run: deleting files (`rm -rf`), force-pushing,
dropping tables, `terraform apply`, `kubectl delete`, publishing a package, `curl | sh`, and any edit that would turn
Decidio's own check off. The approver answers on their phone, Slack, Teams or the web, and each approval is a sealed,
verifiable Authority Receipt for that exact command. Everything else runs as before. The plugin also sets up Decidio
deploy approvals in a GitHub repository (a person approves each deploy before it runs).

Installing it installs the `decidio` plugin too (the Decidio connector and the skill that checks your organisation's
decisions), which it depends on.

## Where it runs

- **Claude Code**, on the computer where the plugin is installed (`claude plugin install` keeps it on that computer).
- **Cowork, in the Claude app**, when the plugin is on the person's Claude account (added by the person, or by an
  organisation's admin for everyone). It works there as on a laptop: the first risky command connects that Cowork machine
  to Decidio once - through the Decidio connector's `connect_device`, or a link the workspace owner allows - and after that
  each risky command waits for a person's approval on their phone, Slack, Teams or the web.

## What runs on your computer

Every hook runs `node ${CLAUDE_PLUGIN_ROOT}/hooks/decidio-hook.mjs <event>`. That small script enters the project folder
and runs the pinned release of Decidio's SDK, `npx -y @decidio/sdk@0.19.0 hook <event>`. It needs Node 18+ and npm, and
**Claude Code 2.1.295 or later**: an older Claude Code lets a command through when a hook can't answer, and can't run these
hooks (`npx @decidio/sdk connect` checks your version and says so).

- **Before and after each Bash or PowerShell call** (and a Write, Edit or MultiEdit on Claude Code's settings files or
  this plugin's files): asks Decidio whether the command needs a person's approval, then records that it ran. If the
  check can't answer, the command is blocked.
- **When a session starts** (and after `/clear` or a compaction): shows you one line saying approvals are on and who
  approves. Claude is given this text and, if you are signed in to Decidio on this computer (`npx @decidio/sdk login`),
  your Decidio context (your units, your context packs and the always-on decisions, as the connector's
  `get_company_context` answers it):

  > Decidio's hook asks a person before destructive shell commands in this project. When it refuses one, tell the user
  > what its message says (who must approve, the link that connects this computer, or the request to hand Decidio's
  > guard_request tool) and follow it; never work around it. Mention Decidio only when it stops a command or the user
  > asks about it.

- **When you send a prompt that mentions Decidio**: answers your own `decidio pause`, `decidio start`, `decidio status`,
  `decidio check` and `decidio help`. Other prompts start nothing.

## Setup

1. Add the plugin from the Decidio marketplace, `OmniTwin/decidio-plugins` (a listing in Claude's plugin directory is coming).
   It brings the `decidio` plugin with it.
   - **In Claude Code:** `/plugin marketplace add OmniTwin/decidio-plugins`, then `claude plugin install decidio-approvals@decidio`.
   - **In the Claude app** (for Cowork): Customize › Plugins › Add › Add marketplace, enter `OmniTwin/decidio-plugins`, then
     add `decidio-approvals`.
2. The first destructive command shows a link: the workspace owner opens it, checks the code and taps Allow, once for
   every project on this computer. Or run `npx @decidio/sdk connect` yourself.

Privacy: https://decidioai.com/privacy/product - Licence: MIT - Publisher: OmniTwin Technologies Inc.
