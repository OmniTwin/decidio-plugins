---
name: deploy-approvals-setup
description: Set up Decidio deploy approvals in the current GitHub repository - a person approves each deploy before it runs, and Decidio starts the deploy workflow once approved. Use when the user asks to add Decidio deploy approvals, to make deploys wait for approval, or to wire this repository to Decidio's GitHub App.
---

# Set up Decidio deploy approvals in this repository

Two workflow files make each deploy wait for a person:

- `.github/workflows/decidio-request.yml` runs on each push to the default branch and **asks** Decidio for approval. It can only ask. A push that changes only the two Decidio workflow files asks for nothing, and a run started by hand is a connection check that asks for nothing.
- The **deploy workflow** (default `.github/workflows/deploy.yml`) runs only when Decidio starts it, after a person approves. Its first step proves the approval (once, for this commit and environment) and checks out the approved commit.

Both use Decidio's public GitHub Action, pinned to its v1.3.1 commit: `OmniTwin/decidio-actions@f0b43fcb8f8ac5e15d9ad43679e333ffa7038ae2 # v1.3.1`. No repository secret is needed: the job's own GitHub OIDC token is the credential (`permissions: id-token: write`).

## Steps

1. **Find the facts, don't guess them.** Run `git rev-parse --show-toplevel`, `git symbolic-ref --short refs/remotes/origin/HEAD` (the default branch), and list `.github/workflows/`. If the user named the environment, the deploy workflow, or the Decidio API origin, use those. Otherwise use `production`, `.github/workflows/deploy.yml` (or the repository's existing deploy workflow, if one is obvious - confirm it with the user) and `https://mcp.decidioai.com`.

2. **Write the files.** Prefer the SDK, which writes both files and never overwrites an existing one:

   ```bash
   npx -y @decidio/sdk@0.20.1 github init --api https://mcp.decidioai.com --environment production --workflow .github/workflows/deploy.yml
   ```

   If `npx` is unavailable, write them yourself from the templates below.

3. **An existing deploy workflow is edited, never replaced.** It needs, and only these changes:
   - `on: workflow_dispatch` with an input named `decidio` (`required: true`); keep its other triggers only if the user says so - a deploy that can start without Decidio is not gated;
   - `permissions: id-token: write` (and `contents: read`);
   - `environment: <the environment>` on the deploy job;
   - the verify step below as the job's **first** step, and its checkout changed to `ref: ${{ steps.decidio.outputs.sha }}`.
   Show the user the diff. Never change their deploy commands.

4. **Open a pull request** with the user's own git: a new branch, one commit (`Add Decidio deploy approvals`), then `gh pr create` if `gh` is available, otherwise push the branch and give the user the compare link. Do not push to the default branch unless the user asks. Merging it asks for nothing (it changes only the two workflow files); the next push of their code asks for the first approval.

5. **Tell the user what is left in Decidio** (at https://app.decidioai.com/connect/github, the GitHub approvals setup): install the Decidio GitHub App on the repository's account, link their GitHub account, and choose this repository with this deploy workflow and environment. Then lock it down (step 6), or follow the checklist on the repository's Environments tab in Decidio. Once merged, they click **Check the connection** on that page (or run `gh workflow run decidio-request.yml`): it confirms the setup and asks for nothing.

6. **Lock it down - only with the user's explicit yes.** Three GitHub settings keep a deploy from going around Decidio: only the Decidio app and the repository's admins may start the deploy workflow; only the default branch (and admins' rollback branches) reach production's environment; changes to the default branch need a reviewed pull request. The SDK sets them through GitHub's own CLI (`gh`), so neither you nor Decidio ever handles the GitHub sign-in.
   - Check `gh --version`, then whether gh is signed in by its exit status alone, with its output discarded: `gh auth status --hostname github.com >/dev/null 2>&1; echo $?` (0: signed in). If `gh` is missing, give the user https://cli.github.com and the checklist (https://app.decidioai.com/connect/github, the repository's Environments tab) and stop. If it isn't signed in, ask the user to run `gh auth login --web` in their own terminal - never run it for them, and never ask for or handle a token.
   - It reports to Decidio as the user, so they must be the workspace owner, signed in once with `npx @decidio/sdk login` in their own terminal.
   - Ask who should review workflow changes (GitHub users or teams, `@user` or `@org/team`, ideally a team or two people); never choose for them. If the only reviewer they name is themselves, offer `--without-review-rule` instead: GitHub never lets a person approve their own pull request, so the reviewed-changes rule would stop them merging alone. The flag leaves that rule and the CODEOWNERS lines out.
   - Run `npx -y @decidio/sdk@0.20.1 github lockdown --dry-run --codeowners "<their answer>"` and show the user the whole plan, as printed. A dry run changes nothing in GitHub or the checkout and sends no report to Decidio.
   - Ask: "Apply this plan? (yes/no)". Only after an explicit yes to THIS question, run the command it printed: `npx -y @decidio/sdk@0.20.1 github lockdown --yes --plan <id> --codeowners "<the same answer>"`. A yes to anything else is not a yes to this. If it says the plan changed, show the new dry run and ask again.
   - If it wrote CODEOWNERS lines, add the file to a pull request as in step 4. Tell the user what the plan says to do by hand (moving secrets) and to run it again once the pull request merges.

## Templates

`.github/workflows/decidio-request.yml` (replace `main` with the default branch, and `deploy.yml` under `paths-ignore` with the deploy workflow's path):

```yaml
name: Ask Decidio to deploy
on:
  push:
    branches: [main]
    paths-ignore:
      - .github/workflows/decidio-request.yml
      - .github/workflows/deploy.yml
  workflow_dispatch:
permissions:
  id-token: write
  contents: read
jobs:
  ask:
    runs-on: ubuntu-latest
    steps:
      - uses: OmniTwin/decidio-actions@f0b43fcb8f8ac5e15d9ad43679e333ffa7038ae2 # v1.3.1
        with:
          step: request
          environment: production
          api-url: https://mcp.decidioai.com
```

The deploy workflow:

```yaml
name: Deploy
run-name: ${{ inputs.title || format('Decidio {0}', inputs.decidio) }}
on:
  workflow_dispatch:
    inputs:
      decidio:
        description: Set by Decidio
        required: true
      title:
        description: Set by Decidio (the run's name - its record, environment and commit)
        required: false
permissions:
  id-token: write
  contents: read
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - id: decidio
        uses: OmniTwin/decidio-actions@f0b43fcb8f8ac5e15d9ad43679e333ffa7038ae2 # v1.3.1
        with:
          step: verify
          decision: ${{ inputs.decidio }}
          api-url: https://mcp.decidioai.com
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0
        with:
          ref: ${{ steps.decidio.outputs.sha }}
      - name: Deploy
        run: ./deploy.sh   # the user's deploy command
```

## Never

- Never change the action's pinned commit to a tag such as `@v1`: the verify step guards production, so it stays pinned to a commit.
- Never add a secret, token or key to the repository or its settings for this - none is needed.
- Never put `${{ inputs.decidio }}` directly in a `run:` line; it goes only in the action's `decision:` input.
- Never remove or reorder the verify step after the deploy, and never deploy anything other than `steps.decidio.outputs.sha`.
- If the verify step fails, the deploy must not run - do not add `continue-on-error`.
- Never run `gh auth token`, never read gh's config or keychain, and never set `GH_TOKEN` - the lock-down never needs a token in the chat.
- Never run `github lockdown` without `--dry-run` or `--plan`.
