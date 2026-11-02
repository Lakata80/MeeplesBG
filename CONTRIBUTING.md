# Contributing

## Branching

- Work on a feature branch off `main`.
- Branch names: `feat/`, `fix/`, `chore/`, `docs/` prefixes.
- Open a pull request to `main`. The CI quality gate must pass.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add game comparison page
fix: correct rating display for unranked games
chore: update dependencies
docs: fix getting-started instructions
```

## Before opening a PR

```bash
npm run typecheck   # must pass with 0 errors
npm run lint        # must pass with 0 errors
```

## Scripts

The scripts in `scripts/` run against live production services. Do not run them unless you know what they do. See [scripts/README.md](scripts/README.md).
