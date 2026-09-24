# Contributions

Contribution is welcome! I would love 
to see your ideas and suggestions, 
and I will do my best to keep up 
with any reviews/issues.

## Rules
1. Either create an issue or find an existing issue you would like to work on
2. Submit a PR for review (base your branch off of dev branch, not main)
3. Address any issues/comments from the review
4. Once approved, I will merge the PR

## Guidelines
### Branching
- Make a branch off of `dev` branch, not `main`
- Naming convention: `feature/<feature-name>` or `bugfix/<bugfix-name>` etc.
- Keep branches updated with `dev` branch (rebase on top of `dev`)
- Once PR is merged, delete your branch

### Merge Strategy (enforced by branch protection)
- `feature/*` / `fix/*` -> `dev`: **Rebase and merge only**
  - Before opening a PR or when `dev` moves ahead, update your branch:
    ```bash
    git fetch origin
    git rebase origin/dev
    # if conflicts: resolve, then git rebase --continue
    git push --force-with-lease
    ```
  - Why rebase: `dev` has **Require linear history** enabled — merge commits are rejected. Rebasing replays your commits on top of the latest `dev`, keeps PRs small, and avoids the "extra commits from previous PRs" problem. Never `git merge origin/dev` into a feature branch.
  - On GitHub, select **Rebase and merge** (Squash is disabled repo-wide).
- `dev` -> `main`: **Create a merge commit only**
  - `main` has **Require linear history disabled** and repo allows merge commits. Use **Create a merge commit** (not Squash, not Rebase).
  - Why merge commit: `dev` is long-lived; squashing rewrites SHAs and leaves `merge-base` stuck (e.g., `8400eab`), causing perpetual giant PRs and potentially merge conflicts. A merge commit preserves shared ancestry so the next `dev->main` PR shows only new work.
  - Do not force-push `dev` or `main`.


### Commit Messages
- Use Conventional Commits format (https://www.conventionalcommits.org/)
- Keep commit messages concise and descriptive
- Follow the format: type(scope): <description>
- Examples:
    - feat(towers): add attack speed stat
    - fix(enemies): fix enemy movement bug
    - docs: update README

### Testing
- Run tests before submitting a PR
- Tests are located throughout the project close to their actual file due to the feature based structure
- To run tests: npm run test

### Code Style
- Follow existing code style and formatting
- Use Prettier for code formatting
- Run: npm run lint

### Documentation
- Keep documentation updated with code changes
- Documentation is located in the publicdocs folder, please create a folder for your topic if it doesn't exist
- Create an index.md file for your topic and document your changes (in markdown format)
- Add any relevant images or diagrams to your documentation
- Keep documentation updated with code changes
- Add any relevant images or diagrams to your documentation
- Keep documentation updated with code changes
- The structure of publicdocs folder may change from time to time

### Licensing
All code in this repository is licensed under the [Business Source License 1.1](LICENSE).