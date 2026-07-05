# energy-logistics-website
Official website and business platform for Energy Logistics LLC. Built for freight transportation services, broker partnerships, driver recruiting, owner-operator onboarding, and automated business workflows.

## Telegram Integration

Form submissions send a lead notification to Telegram (EnergyAtlas_bot) through a Make.com webhook. The site is pure static HTML/CSS/JS on GitHub Pages — Make.com acts as the backend bridge.

### Where each value lives

- **Make.com webhook URL** — lives in `js/telegram-notify.js` in the `MAKE_WEBHOOK_URL` constant. If the webhook URL changes, update it there. This URL is not a secret, so it is acceptable in frontend code.
- **Bot token** — lives only inside Make.com (in the Telegram connection). Never commit it to this repo or reference it in frontend code.
- **Chat ID** — lives only inside Make.com (in the Telegram "Send a Message" module). Never commit it to this repo.

### How it works

All three lead forms (Broker Freight Request, Driver Application, Owner Operator Application) go through the shared submit handler in `script.js`, which calls `sendLeadNotification()` from `js/telegram-notify.js`. The call is fire-and-forget: it is not awaited, so a slow or unreachable webhook never blocks form submission or the success message. If the webhook fails, the error is logged to the browser console and the user experience is unaffected. While `MAKE_WEBHOOK_URL` still contains the placeholder value, notifications are skipped silently.

Payloads are flat JSON with a `formType` field (`DRIVER APPLICATION`, `FREIGHT REQUEST`, or `OWNER OPERATOR APPLICATION`) plus the lead fields, ready to map into the Telegram message template in Make.com.

### How to test

1. Open the live site and submit any of the three forms with test data.
2. Check the Telegram chat connected to EnergyAtlas_bot — a formatted notification should arrive within a few seconds.

### How to verify Make.com is receiving

Open the scenario in the Make.com dashboard and check its execution history. Each form submission should appear as a scenario run; open a run to inspect the webhook payload and the Telegram module output.
