# Decidio

Decidio is your organisation's record of what was decided or approved, by whom, and whether it still holds. This plugin
lets Claude check that record whenever your organisation's own rules or past decisions could change the answer - spending
and approval limits, vendors and contracts, expenses, accounting entries, people processes, security and technology
choices - even when you don't mention Decidio. It is not used for general knowledge, personal matters, or your own
employment.

## What it adds

- **The Decidio connector** (`https://mcp.decidioai.com/mcp`). You sign in to Decidio as yourself, so Claude sees only the
  records you may see. Names and amounts reach Claude as placeholders; the real values stay in Decidio.
- **The `decidio` skill**, which tells Claude when to look: before answering or drafting work your organisation's decisions
  could change, and before acting on a plan with amounts. It tells Claude to apply what is in force, to say when a decision
  was replaced or retired, to cite record numbers, and never to guess a masked value.

No hooks and no programs: nothing from this plugin runs on your computer.

## Setup

1. Add the plugin from the Decidio marketplace, `OmniTwin/decidio-plugins` (a listing in Claude's plugin directory is coming):
   - **In the Claude app:** Customize › Plugins › Add › Add marketplace, enter `OmniTwin/decidio-plugins`, then add `decidio`.
     Your workspace admin can add it for everyone.
   - **In Claude Code:** `/plugin marketplace add OmniTwin/decidio-plugins`, then `claude plugin install decidio@decidio`.
2. Open the Decidio connector and sign in with your Decidio account.

Ask a work question as you normally would; Claude checks Decidio when it is relevant. For a person's approval before
Claude Code runs a destructive command, add the `decidio-approvals` plugin as well.

Privacy: https://decidioai.com/privacy/product - Licence: MIT - Publisher: OmniTwin Technologies Inc.
