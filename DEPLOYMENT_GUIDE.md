# Energy Logistics LLC Deployment Guide

This guide explains how to publish the Energy Logistics LLC website using either GitHub Pages or Hostinger.

The website is currently a static HTML, CSS, and JavaScript site. That means it can be hosted on most web hosting platforms without a backend server.

## Recommended Option

Use **Hostinger** for the public business website.

Hostinger is the better long-term option for Energy Logistics LLC because it is easier to connect a professional business domain, manage SSL, add business email/DNS records, and later connect backend form processing for Telegram, Gmail, Google Sheets, or other lead systems.

Use **GitHub Pages** first if you want a simple temporary preview site before launch. It is good for testing, but it is not the best final setup once lead-generation forms and business workflows are connected.

## Option 1: Publish With GitHub Pages

### Step 1: Confirm Files Are in GitHub

Make sure the repository contains:

- `index.html`
- `styles.css`
- `script.js`
- `assets/energy-logistics-hero.svg`
- Project documentation files

The home page must be named `index.html`.

### Step 2: Enable GitHub Pages

1. Open the GitHub repository.
2. Go to **Settings**.
3. Open **Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch.
6. Select the root folder `/`.
7. Save the settings.

GitHub will publish the website and provide a GitHub Pages URL.

### Step 3: Domain Setup for GitHub Pages

If using a custom domain, enter the domain in the GitHub Pages custom domain field.

Example:

```text
energylogisticsllc.com
```

GitHub may create a `CNAME` file in the repository. Keep that file if GitHub adds it.

### Step 4: DNS Setup for GitHub Pages

At the domain provider, add DNS records that point the domain to GitHub Pages.

For an apex/root domain such as `energylogisticsllc.com`, add GitHub Pages `A` records.

For a `www` domain, add a `CNAME` record:

```text
Type: CNAME
Name: www
Value: GigaGene.github.io
```

DNS changes can take several minutes to 48 hours.

### Step 5: SSL Certificate for GitHub Pages

After the domain is connected:

1. Go back to **Settings** > **Pages**.
2. Wait for GitHub to verify the domain.
3. Enable **Enforce HTTPS**.

GitHub Pages provides the SSL certificate automatically.

### Step 6: GitHub Pages Deployment Workflow

To update the website:

1. Edit the website files.
2. Commit the changes to the `main` branch.
3. Push or publish the changes to GitHub.
4. GitHub Pages automatically rebuilds and updates the live site.

### Step 7: Future Updates Workflow

For future edits:

1. Make changes locally or in GitHub.
2. Test the site.
3. Commit changes with a clear message.
4. Publish changes to the `main` branch.
5. Confirm the live GitHub Pages site updated correctly.

## Option 2: Publish With Hostinger

### Step 1: Prepare Website Files

Upload these files and folders to Hostinger:

- `index.html`
- `landing.html`
- `404.html`
- `.htaccess`
- `styles.css`
- `script.js`
- `landing-data.js`
- `landing-page.js`
- `sitemap.xml`
- `robots.txt`
- `assets/`

Documentation files such as `PROJECT_REQUIREMENTS.md`, `TESTING_CHECKLIST.md`, and `README_PRODUCTION_PLAN.md` do not need to be public on the live website.

Dynamic SEO landing pages use `.htaccess` rewrite rules so clean URLs such as `/refrigerated-freight/seattle-wa` render through `landing.html`. When adding cities or services, update `landing-data.js`, run `node generate-sitemap.js`, then upload the regenerated `sitemap.xml`.

### Step 2: Domain Setup for Hostinger

If the domain is purchased through Hostinger:

1. Open Hostinger hPanel.
2. Go to **Websites**.
3. Add or select the Energy Logistics LLC website.
4. Attach the domain to the hosting plan.

If the domain is purchased somewhere else:

1. Open the domain registrar account.
2. Point the domain to Hostinger nameservers, or update DNS records manually.
3. Wait for DNS propagation.

### Step 3: DNS Setup for Hostinger

The simplest setup is to use Hostinger nameservers.

Hostinger will provide nameservers similar to:

```text
ns1.dns-parking.com
ns2.dns-parking.com
```

If using manual DNS records instead, point the domain to the Hostinger hosting IP address using an `A` record.

Common setup:

```text
Type: A
Name: @
Value: Hostinger hosting IP address
```

```text
Type: CNAME
Name: www
Value: energylogisticsllc.com
```

Use the exact IP address shown in Hostinger hPanel.

### Step 4: Upload Files to Hostinger

Use Hostinger File Manager:

1. Open hPanel.
2. Go to **Files** > **File Manager**.
3. Open the website folder, usually `public_html`.
4. Upload `index.html`, `styles.css`, `script.js`, and the `assets` folder.
5. Confirm `index.html` is directly inside `public_html`.

Alternative workflow:

1. Use Hostinger Git deployment if available on the hosting plan.
2. Connect the GitHub repository.
3. Deploy from the `main` branch.

### Step 5: SSL Certificate for Hostinger

Hostinger normally provides free SSL certificates.

To enable SSL:

1. Open hPanel.
2. Go to **Websites**.
3. Select the domain.
4. Open **Security** or **SSL**.
5. Install or activate the free SSL certificate.
6. Enable HTTPS redirect if available.

After SSL is active, the website should load at:

```text
https://yourdomain.com
```

### Step 6: Hostinger Deployment Workflow

Manual upload workflow:

1. Edit the website files locally.
2. Test the website locally.
3. Upload changed files to `public_html`.
4. Refresh the website and confirm the changes.

Git-based workflow:

1. Edit the website files locally.
2. Commit changes to GitHub.
3. Push changes to the `main` branch.
4. Trigger Hostinger Git deployment.
5. Confirm the live website updated.

### Step 7: Future Updates Workflow

Recommended future workflow:

1. Keep the GitHub repository as the source of truth.
2. Make all website changes in the project workspace.
3. Test changes locally.
4. Commit changes to GitHub.
5. Deploy to Hostinger from GitHub or upload the changed files.
6. Review the live website after each update.

## Which Method to Use Before Connecting Telegram and Forms

Before connecting Telegram, Gmail, Google Sheets, or other live form delivery systems, use **GitHub Pages or a private Hostinger staging page for visual testing only**.

For the final public lead-generation website, use **Hostinger** before connecting the forms.

Reason:

- Telegram bot tokens, email credentials, Google credentials, and webhook secrets should not be placed inside frontend JavaScript.
- GitHub Pages only hosts static files and does not provide a secure backend by itself.
- Hostinger can support backend scripts, server-side form handling, redirects, security rules, and future integrations.
- Lead forms should be connected only after the live domain, SSL certificate, and form security plan are ready.

## Production Security Setup

Before accepting real submissions:

1. Copy `.env.example` to `.env` on the server only.
2. Replace every placeholder with production values.
3. Confirm `.env` is not public and is ignored by Git.
4. Confirm PHP is enabled for `api/submit-lead.php`.
5. Confirm HTTPS redirect and security headers from `.htaccess` are active.
6. Confirm `logs/`, `sessions/`, `quarantine/`, `uploads/`, and `backups/` are not publicly accessible.
7. Configure SPF, DKIM, and DMARC for the sending domain before enabling confirmation email.
8. Configure Cloudflare Turnstile if spam continues after honeypot and IP rate limiting.
9. Review `SECURITY_OPERATIONS.md` for admin dashboard, backup, monitoring, role, and document-handling requirements.

Recommended order:

1. Publish a staging or preview version.
2. Test the design, mobile layout, navigation, phone links, and email links.
3. Set up the final domain on Hostinger.
4. Activate SSL.
5. Add secure backend form handling.
6. Connect Telegram, Gmail, and Google Sheets.
7. Test every form submission on the live HTTPS domain.
8. Launch the public website.
