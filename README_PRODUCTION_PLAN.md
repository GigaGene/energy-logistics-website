# Energy Logistics LLC Production Launch Plan

This website is structured as a lead-generation website for Energy Logistics LLC. It includes broker, driver, and owner operator forms with validation and success messages.

## Current Website Status

- Static HTML, CSS, and JavaScript website is built.
- Branding is in place: "Driven by Reliability. Powered by Opportunity."
- Broker Freight Request Form is present.
- Driver Application Form is present.
- Owner Operator Application Form is present.
- Required-field validation is active.
- Honeypot spam fields are active.
- Client-side rate limiting is active.
- Forms submit to the server-side endpoint at `api/submit-lead.php`.
- The server endpoint validates, sanitizes, rate limits, optionally verifies Turnstile, quarantines approved uploads, logs accepted/rejected submissions, and sends summary-only notifications.
- Private form data is no longer stored in browser `localStorage`.
- Mobile responsive styling is included.
- Trust badges and broker-focused proof points are included.
- Privacy policy, terms of use, cookie notice, `.env.example`, security headers, and `SECURITY_OPERATIONS.md` are included.

## What Remains Before Public Launch

### 1. Connect Form Submissions

The forms now submit to `api/submit-lead.php`. Before public launch, deploy to PHP-capable hosting and configure `.env` from `.env.example`.

Recommended destinations:

- Telegram lead summary notifications
- Verified-domain email notifications
- Private database or CRM lead storage

Do not expose private API keys, bot tokens, service account credentials, or email credentials in frontend JavaScript.

### 2. Choose Backend or Form Service

Pick one production-safe approach:

- Small backend endpoint
- Serverless function
- Google Apps Script endpoint
- Trusted form handling service
- CRM or automation platform webhook

The frontend posts to the PHP endpoint in `script.js`. Keep secrets server-side only.

### 3. Add Spam Protection

Implemented spam controls:

- Honeypot field
- Rate limiting on frontend and backend
- Server-side validation
- Optional Cloudflare Turnstile when `TURNSTILE_SECRET_KEY` is configured

Add a visible Turnstile widget if production spam continues.

### 4. Confirm Legal and Compliance Copy

Review all transportation claims and recruiting language before publishing.

Confirm privately, but do not place these identifiers on public marketing pages:

- USDOT number
- MC number
- Service area
- Asset-based carrier language
- Driver recruiting benefits
- Owner operator program details
- Tracking platform support claims

### 5. Privacy Notice

The privacy policy is available at `privacy.html`. Review it with counsel before launch.

### 6. Add Analytics and Conversion Tracking

Recommended tracking:

- Form submissions
- Phone button clicks
- Email button clicks
- Broker CTA clicks
- Driver application clicks
- Owner operator application clicks

### 7. Optimize SEO

Before launch:

- Add final page title and meta description.
- Add Open Graph preview tags.
- Add local business schema if desired.
- Add favicon and brand icon.
- Confirm heading structure.
- Confirm image alt text and loading behavior.

### 8. Performance Check

Before launch:

- Compress hero image if needed.
- Test on mobile data speed.
- Check layout on common screen sizes.
- Confirm no horizontal scrolling.
- Confirm forms are easy to use on mobile.

### 9. Hosting and Domain

Launch steps:

- Choose hosting provider.
- Connect the production domain.
- Enable HTTPS.
- Configure redirects if needed.
- Test all buttons and forms on the live domain.

### 10. Final QA

Use `TESTING_CHECKLIST.md` before launch.

Required final checks:

- Desktop layout
- Mobile layout
- Navigation
- Broker form
- Driver form
- Owner operator form
- Required field validation
- Success messages
- Phone links
- Email links
- Form delivery to Telegram, Gmail, and Google Sheets after backend connection
