# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static marketing/lead-generation website for Energy Logistics LLC, an asset-based refrigerated freight motor carrier (Black Diamond, WA). Single-page site targeting three audiences: direct shippers, freight brokers, and CDL drivers/owner-operators. No framework, no build step, no backend — plain HTML/CSS/JS served as-is.

## Running locally

There is no build tooling (no `package.json`, no bundler). Serve the directory with any static file server, e.g.:

```
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/index.html` — this is the exact preview URL referenced in `TESTING_CHECKLIST.md`. There is no lint/test/build command to run; verify changes by loading the page in a browser.

## File structure

- `index.html` — the entire site. All sections (hero, services, why-choose-us, broker partnerships, driver careers, owner-operator program, about, contact) and all three lead-capture forms live here as `<section id="...">` blocks matching the nav anchors (`#home`, `#services`, `#drivers`, `#owner-operators`, `#about`, `#contact`, plus form anchors `#freight-request`, `#driver-application`, `#owner-operator-application`).
- `styles.css` — all styling, driven by CSS custom properties defined in `:root` (`--ink`, `--navy`, `--orange`, `--paper`, etc.). Brand palette is dark navy + orange accents on white, per `PROJECT_REQUIREMENTS.md`.
- `script.js` — all behavior: mobile nav toggle, scroll-based header/active-nav-link state, and lead form handling.
- `assets/` — image assets referenced by `styles.css` background-image rules.
- `PROJECT_REQUIREMENTS.md` — source of truth for business facts (USDOT/MC numbers, contact emails, service area, page structure, brand direction). Cross-check copy changes against this file.
- `README_PRODUCTION_PLAN.md` — pre-launch punch list (form backend integration, spam protection, legal copy, analytics, SEO, hosting). Read this before treating the site as "done."
- `TESTING_CHECKLIST.md` — manual QA checklist (desktop/mobile layout, nav, each form, phone/email links, validation, success messages). There are no automated tests; use this checklist to verify changes by hand in a browser.

## Lead form architecture

All three forms (`#freight-request`, `#driver-application`, `#owner-operator-application`) share one pattern, wired up generically in `script.js` via `document.querySelectorAll("[data-lead-form]")`:

- Each `<form data-lead-form>` carries `data-form-destination` (`dispatch` or `hr` — determines which team the lead is meant for) and `data-integrations="telegram,gmail,google-sheets"` (declares intended future delivery channels; not yet implemented).
- `buildLeadPayload()` turns `FormData` into a structured payload: `{ formType, destination, integrations, submittedAt, fields }`.
- `submitLeadPayload()` currently only stores payloads to `localStorage` (`energyLogisticsLeads`) and logs to console — **there is no real backend**. Per `README_PRODUCTION_PLAN.md`, wiring this to Telegram/Gmail/Google Sheets (via a backend, serverless function, or form service) is the main pre-launch task, and API keys/tokens must never be placed in this frontend JS.
- Validation is native HTML5 `required`/`checkValidity()`, with manual invalid-field styling (`.field-invalid`, `aria-invalid`) and a shared error/success message pattern (`[data-form-error]`, `[data-form-success]`) per form.
- When adding a new lead form, follow this exact pattern (`data-lead-form`, hidden `formType` input, `data-form-error`/`data-form-success` elements) so it's picked up automatically — no JS changes needed.

## Content conventions

- Business facts (phone, USDOT/MC numbers, emails, service area exclusions, program terms like the 90/10 split) must match `PROJECT_REQUIREMENTS.md` exactly; they appear repeated across the hero, stat strip, about, footer, and contact sections and must stay consistent.
- Dispatch (`energylog.dispatch@gmail.com`) handles shippers, brokers, and owner-operators; HR (`hrenergylog@gmail.com`) handles driver recruiting. Keep `mailto:` links and form `data-form-destination` values aligned with this split.
- Known inconsistency: `styles.css` references `assets/energy-logistics-hero.jpg` in multiple rules, but that file was removed from `assets/` (only `energy-logistics-broker-docks.jpg` remains) — check this when touching hero styling.
