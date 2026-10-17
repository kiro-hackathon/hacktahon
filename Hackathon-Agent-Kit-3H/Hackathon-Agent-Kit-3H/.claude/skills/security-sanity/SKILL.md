---
name: security-sanity
description: Use whenever a hackathon project touches authentication, uploads, external APIs, tokens, user data, payments, database permissions or deployment. Prevents obvious secret leaks and deceptive implementation shortcuts without overengineering security.
license: MIT
---

# Fast security gate

- Check `git status`, `.gitignore`, `.env.example` and frontend bundles for accidental keys. Do not print or copy secret values into generated docs/logs.
- Never hardcode API tokens or service role keys in client-side JS, Vite `VITE_*` env vars, or public repo files. Vite public env vars are exposed to the browser.
- Use server-side credentials where necessary. If none available, switch to a **clearly marked** local demo mode rather than faking production API responses.
- Treat user input as untrusted; sanitize/validate appropriately. Avoid `innerHTML` with untrusted strings, eval, uncontrolled file writes, or user-defined command execution.
- Explain any limitations of local storage and absence of real authentication.
- Do not expose personal data or real third-party account records in demos; use non-sensitive sample fixtures.
- Do not configure open CORS, blanket auth bypass, public storage permissions, or wide DB access just to make the demo work.
- Don't spend money, create public deployments, delete resources, or modify production data without authorization.
- If requirements demand real auth/security but time is insufficient, deliver a truthful local prototype and document limitation.

Record any meaningful security limitation in `.hackathon/QA.md`.
