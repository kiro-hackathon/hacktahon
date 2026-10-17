# Minimal agent updates

Do not flood the user with generated project plans. Send brief updates at three high-signal moments:

1. **Scope locked:** `Building [X] for [user]. Core demo: [A → B → C]. Leaving out [Y].`
2. **First end-to-end feature works:** `Core flow runs locally. Implemented [items]; now testing [risk].`
3. **Final delivery:** `Run: [verified commands]. Demo: [3–5 steps]. Tests: [what ran + result]. Known issues: [truthful].`

If execution pauses because of credentials/tool permissions, give exact steps needed and proceed with a safe local fallback if possible. Do not tell the user to wait for an unseen/background completion. Never claim more than you verified.
