# Wheel API Tests

API end-to-end tests for a mobile game's backend: guest login and the prize-wheel spin.

**What it checks**
- Login: new device creates an account, same device reconnects, balance fields agree
- Wheel config: 26 wedges, valid reward types, identical across sessions
- Spinning: reward matches the selected wedge, each spin costs 1 energy, spinning with 0 energy or a bad token is rejected, balance persists after re-login, wedge sequence is deterministic for new users
- Multipliers: tier config matches expected thresholds, a new user can't use locked multipliers

**Tools:** Playwright Test (API `request` fixture, no browser), TypeScript, GitHub Actions

## Run it

```bash
npm ci
export API_BASE_URL=https://<api-host>
export LOGIN_SOURCE=<your-login-source>
npm test
npm run report   # open the HTML report
```

`tests/` holds the specs; `api/` holds small clients for the login and spin endpoints.
In CI, set `API_BASE_URL` and `LOGIN_SOURCE` as repository secrets.
