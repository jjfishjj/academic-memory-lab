# MemoDesk mnemonic API

This Cloudflare Worker keeps the OpenAI API key off the GitHub Pages client.

## Deploy

1. Authenticate Wrangler: `npx wrangler login`.
2. Store the secret: `npx wrangler secret put OPENAI_API_KEY --config worker/wrangler.toml`.
3. Deploy: `npx wrangler deploy --config worker/wrangler.toml`.
4. Add the deployed Worker URL as the GitHub Actions repository variable `VITE_MNEMONIC_API_URL`.
5. Re-run the `Deploy GitHub Pages` workflow.

The frontend automatically keeps the three offline suggestions available when the Worker is not configured or temporarily fails.
