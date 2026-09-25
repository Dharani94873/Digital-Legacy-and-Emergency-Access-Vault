# Project Rules

## Git Automation & Quality Gate
Whenever you complete a block of coding work or a requested feature:
1. **Pre-push Quality Gate (MANDATORY)**: You MUST run `npm run type-check` (`npx tsc --noEmit`) and verify that there are ZERO TypeScript errors (exit code 0). Never push code if compilation fails.
2. **Commit and Push**: Automatically commit all changes (`git add -A && git commit -m "..."`) and push them to the git repository without waiting for the user to ask. Use clear and descriptive commit messages based on the work completed.
3. **Verify Deployment**: Ensure changes build cleanly for Vercel without build failures.
