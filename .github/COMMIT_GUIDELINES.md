# Git Commit Guidelines

## Commit Message Format

All commit messages must be written in **English**.

### Structure

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons, etc. |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding tests |
| `chore` | Maintenance tasks |

### Examples

```
feat(dashboard): add new analytics component

fix(auth): resolve hydration error in login form

docs(readme): update installation instructions
```

### Rules

1. **Always use English** for commit messages
2. Use imperative mood in subject line ("add" not "added")
3. Keep subject line under 72 characters
4. Reference issues with `Closes #123` or `Fixes #456` in footer
5. Be specific about what changed and why

### Good Commit Messages

```
feat(bookings): add confirmation email workflow
fix(calendar): resolve timezone display issue
refactor(employees): extract availability logic to hook
```

### Bad Commit Messages

```
Fixed stuff
WIP
Changes
Updates
```

## Workflow

1. Make changes to code
2. Run `npm run lint` and `npm run build` to verify
3. Create commit with clear English description
4. Push to remote
