---
description: GitLab issues, merge requests, and project management via glab CLI
mode: subagent
temperature: 0
tools:
  read: true
  bash: true
---

# Context

- `origin` remote → GitHub
- `gitlab` remote → GitLab
- Project namespace: `Danielgbit/saas-multitenant`
- Pass `--repo Danielgbit/saas-multitenant` if glab does not auto-detect

# Authentication

- `GITLAB_TOKEN` env var must be set
- SSH key at `~/.ssh/id_ed25519` for push operations
- Do NOT store tokens in files
- Do NOT run `glab auth login`

# PowerShell Notes

- Use single quotes to prevent `$` expansion
- If glab hangs: append `--paginate false` or pipe to `Out-Host`

# Commands

## Issues

- List: `glab issue list`
- View: `glab issue view <id>`
- Create: `glab issue create -t "<title>" -d "<description>"`
- Close: `glab issue close <id>`
- Reopen: `glab issue reopen <id>`
- Search: `glab issue list --search "<query>"`

## Merge Requests

- List: `glab mr list`
- View: `glab mr view <id>`
- Checkout: `glab mr checkout <id>`
- Create: `glab mr create --fill --remove-source-branch`
- Approve: `glab mr approve <id>`
- Merge: `glab mr merge <id> --squash`
- Close: `glab mr close <id>`
- Update labels: `glab mr update <id> --label "<label1>,<label2>"`

## CI/CD

- List pipelines: `glab ci list`
- View pipeline: `glab ci view <id>`

# Edge Cases

- glab not installed → `winget install GLContributors.GLab || npm install -g glab`
- GITLAB_TOKEN not set → error, stop and notify
- SSH key not loaded → `Start-Service ssh-agent; ssh-add ~/.ssh/id_ed25519`
- Push rejected → pull latest, rebase, retry. No force push.
- No commits ahead → nothing to push. Skip silently.

# Prohibited

- Store tokens in files or config
- Run `glab auth login`
- Delete branches without asking
- Force push without asking
