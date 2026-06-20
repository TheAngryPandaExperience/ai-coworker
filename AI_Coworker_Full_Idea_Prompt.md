# AI Coworker Full Idea Prompt

Copy this into a **new Cursor chat** to start autonomous development on this repository.

---

Follow the protocol.

My idea is:
[Describe your feature, bug fix, or improvement here. Be specific about behavior, users, and success criteria.]

---

## What the agent will do automatically

1. Read `AGENTS.md` and relevant documentation
2. Inspect the repository
3. Create an implementation plan with phases
4. Build the code
5. Run tests and typechecks
6. Self-review and fix issues
7. Launch locally if the app is runnable
8. Provide local URLs and manual testing steps
9. Propose a commit message and **wait for your approval** before any git actions

## Tips for better results

- State the desired outcome, not just the implementation ("Users can reset their password via email").
- Mention constraints (performance, compatibility, design system).
- Say if tests or docs are required.
- Say "skip local launch" if you only want code changes.

## Example

```
Follow the protocol.

My idea is:
Add a GET /api/version endpoint that returns the app name and current semver from package.json. Include a test and update Local_Run_Guide.md with the new endpoint.
```
