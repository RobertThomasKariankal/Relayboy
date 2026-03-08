# RelayBoy

Post-quantum chat app with Kyber-based key exchange, browser-side private key ownership, and AES-GCM symmetric ratchet encryption.

## Render Deployment

This repo includes `render.yaml` for one-click Blueprint deploy.

1. Push this repo to GitHub.
2. In Render, create a new Blueprint and select the repo.
3. Set all required secrets in Render:
   - `APP_ORIGIN` (your Render HTTPS URL)
   - `SESSION_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `REDIS_URL`
   - `SENDGRID_API_KEY`
   - `SENDGRID_FROM_EMAIL`
4. Deploy and verify:
   - `GET /api/auth-status` returns JSON
   - Login/WS upgrades succeed from your Render domain

## Security + PQ Notes

- Kyber private keys are never stored on the server.
- Only encrypted private-key backup metadata is stored server-side.
- Message/session recovery data stored in IndexedDB does **not** include raw shared secrets per message.
- Ciphertext-linked artifacts use hashed lookup keys in IndexedDB for resilient local history recovery across refresh/reconnect scenarios.
