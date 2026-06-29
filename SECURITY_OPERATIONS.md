# Security Operations Runbook

This repository now includes static website hardening and a PHP form endpoint. The items below are required before collecting production broker, driver, owner operator, or customer data.

## Environment Variables

Use `.env` on the server and never commit it. Start from `.env.example` and replace every placeholder.

Required secrets:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `DISPATCH_EMAIL=dispatch@energylog.org`
- `EMAIL_API_KEY` or verified SMTP/API provider credentials
- `DATABASE_URL` when a database is added
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_RESET_SECRET`
- `ANALYTICS_KEY`
- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

## Form Protection

Implemented:

- Honeypot field on all public forms.
- Client-side form length, phone, email, and required-field validation.
- Server-side form type, email, phone, length, honeypot, origin/referrer, and rate-limit validation in `api/submit-lead.php`.
- Optional Cloudflare Turnstile verification when `TURNSTILE_SECRET_KEY` is configured.
- No sensitive lead storage in browser `localStorage`.

Required before launch:

- Add a visible Turnstile widget to forms if spam continues after honeypot and IP rate limiting.
- Route accepted submissions into a database or private CRM instead of long-term JSONL files.
- Review `logs/security.log` and `logs/leads.jsonl` permissions after deployment.

## File Upload Safety

Allowed upload types in the endpoint:

- PDF
- JPG
- PNG
- DOC
- DOCX

Blocked examples:

- EXE
- JS
- PHP
- SH
- BAT
- ZIP
- CMD
- MSI
- PS1

Uploads are moved into `quarantine/` with randomized filenames and are blocked from public web access by `.htaccess`. Admins should scan quarantined files with hosting malware tools or endpoint antivirus before opening or downloading. ZIP files should remain blocked unless an admin manually approves a specific workflow.

## Admin Dashboard Security

No admin dashboard exists in this static site yet. When one is added, it must include:

- HTTPS-only login.
- Password hashing with Argon2id or bcrypt.
- Role-based access: Admin, Dispatch, HR, Accounting.
- Route protection on every admin page and API endpoint.
- Session timeout, default 30 minutes.
- Password reset tokens that expire and are single-use.
- Failed login tracking and lockout or additional challenge after repeated failures.
- Admin activity logs for logins, lead views, document downloads, role changes, exports, and deletions.
- CSRF tokens on all state-changing admin actions.

Suggested role boundaries:

- Admin: full configuration, user management, audit logs.
- Dispatch: freight requests, broker verification, carrier packet workflow.
- HR: driver applications, owner operator inquiries, and recruiting documents.
- Accounting: settlement/payment records only.

Department settings must route Dispatch notifications to `DISPATCH_EMAIL=dispatch@energylog.org` and recruiting notifications to `HR_EMAIL=hrenergylog@gmail.com`. Freight quote, broker request, and carrier packet submissions belong to Dispatch. Driver and owner operator submissions belong to HR.

## Data Protection

Collect only the data required to respond to each request. Driver documents, broker packets, insurance documents, tax records, and private identifiers must not be placed in frontend JavaScript or public files.

Production database requirements:

- Use a dedicated database user for the website.
- Grant only the permissions needed by the application.
- Do not use root database credentials.
- Encrypt backups at rest.
- Restrict database access by host/IP where supported.
- Keep private documents outside the public web root.

## Telegram Notification Safety

Telegram notifications must include summary only:

- Lead ID
- Form type
- Name/company
- Email and phone
- Upload count

Telegram summaries may alert operations, but email destinations remain department-specific: freight quote, broker request, and carrier packet submissions use `DISPATCH_EMAIL`; driver and owner operator submissions use `HR_EMAIL`.

Do not send full driver documents, broker packets, W-9s, insurance certificates, tax records, or identity documents through Telegram. Staff should log into the admin dashboard or server-side private system to review sensitive details.

## Email Safety

Use a verified domain email provider before sending production confirmations.

DNS setup instructions:

- SPF: add a TXT record authorizing the chosen email provider to send for the domain.
- DKIM: add the provider-issued DKIM TXT or CNAME records.
- DMARC: add a TXT record at `_dmarc.example.com`.

Starter DMARC policy:

```text
v=DMARC1; p=none; rua=mailto:dmarc@example.com; adkim=s; aspf=s
```

After monitoring, move to stricter policies:

```text
v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com; adkim=s; aspf=s
```

Then:

```text
v=DMARC1; p=reject; rua=mailto:dmarc@example.com; adkim=s; aspf=s
```

Do not attach private applicant documents to email unless required by a defined workflow. Prefer secure dashboard review.

## Public Website Safety

Implemented:

- USDOT and MC numbers are not displayed in public marketing pages.
- Broker resources are presented inside the Broker Resources / Carrier Packet section.
- Privacy policy page added.
- Terms of use page added.
- Cookie notice added for analytics readiness.

Keep carrier identifiers and sensitive documents out of generated landing pages and public assets.

## Technical Security

Implemented in `.htaccess`:

- HTTPS redirect.
- `Strict-Transport-Security`
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- Directory listing disabled.
- Common private file extensions denied.
- `uploads/`, `quarantine/`, `logs/`, `sessions/`, and `backups/` blocked from public access.

Backend requirements when database/admin code is added:

- Use prepared statements for every SQL query.
- Escape output before rendering HTML.
- Validate every API route input.
- Restrict CORS to the production domain.
- Use CSRF tokens for authenticated state changes.
- Disable stack traces in production responses.
- Log errors server-side with a generic user-facing message.

## Monitoring

Track:

- Server errors.
- Failed form submissions.
- Honeypot triggers.
- Rate limit blocks.
- Failed admin logins.
- Admin document downloads.
- Backup failures.

Recommended uptime monitoring:

- UptimeRobot
- Better Stack
- Pingdom
- Hostinger built-in monitoring if available

Monitor:

- `https://yourdomain.com/`
- `https://yourdomain.com/privacy.html`
- `https://yourdomain.com/api/submit-lead.php` with a non-POST expected 405 response

## Backup and Restore

Minimum backup policy:

- Daily database backup.
- Daily private document backup.
- Weekly full-site backup.
- 30-day retention.
- Encrypted offsite copy.
- Quarterly restore test.

Restore checklist:

1. Provision clean hosting.
2. Deploy website source.
3. Restore `.env` from secure password manager or secrets vault.
4. Restore database backup.
5. Restore private document storage.
6. Verify admin login, role permissions, form submission, Telegram summary, email delivery, and HTTPS headers.
7. Review logs for errors before returning to production traffic.
