# Energy Logistics LLC Production Launch Plan

This website is structured as a lead-generation website for Energy Logistics LLC. It includes broker, driver, and owner operator forms with validation and success messages.

## Current Website Status

- Static HTML, CSS, and JavaScript website is built.
- Branding is in place: "Driven by Reliability. Powered by Opportunity."
- Broker Freight Request Form is present.
- Driver Application Form is present.
- Owner Operator Application Form is present.
- Required-field validation is active.
- Success messages are active.
- Forms create structured lead payloads in JavaScript.
- Forms include future integration hooks for Telegram, Gmail, and Google Sheets.
- Mobile responsive styling is included.
- Trust badges and broker-focused proof points are included.

## What Remains Before Public Launch

### 1. Connect Form Submissions

The forms currently validate and prepare structured lead data in the browser. Before public launch, connect submissions to a secure backend or form service.

Recommended destinations:

- Telegram lead notifications
- Gmail email notifications
- Google Sheets lead storage

Do not expose private API keys, bot tokens, service account credentials, or email credentials in frontend JavaScript.

### 2. Choose Backend or Form Service

Pick one production-safe approach:

- Small backend endpoint
- Serverless function
- Google Apps Script endpoint
- Trusted form handling service
- CRM or automation platform webhook

The frontend is already prepared with `data-integrations="telegram,gmail,google-sheets"` attributes and a `submitLeadPayload` function in `script.js`.

### 3. Add Spam Protection

Before launch, add basic spam protection:

- Honeypot field
- Rate limiting on the backend
- CAPTCHA or turnstile if spam becomes a problem
- Server-side validation

### 4. Confirm Legal and Compliance Copy

Review all transportation claims and recruiting language before publishing.

Confirm:

- USDOT number
- MC number
- Service area
- Asset-based carrier language
- Driver recruiting benefits
- Owner operator program details
- Tracking platform support claims

### 5. Add Privacy Notice

Because the website collects names, emails, phone numbers, driver details, and equipment details, add a privacy notice explaining how leads are used and stored.

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
