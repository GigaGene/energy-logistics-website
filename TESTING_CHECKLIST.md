# Energy Logistics LLC Website Testing Checklist

Use this checklist to verify the website before publishing.

Preview URL:

- http://127.0.0.1:4173/index.html

## Desktop Layout Test

- [ ] Open the website on a desktop or laptop screen.
- [ ] Confirm the header, logo, and navigation are aligned correctly.
- [ ] Confirm the hero section image, slogan, and buttons display clearly.
- [ ] Confirm all sections have professional spacing and no overlapping text.
- [ ] Confirm service cards, broker cards, forms, and contact cards align neatly.
- [ ] Confirm the footer displays company information correctly.

## Mobile Layout Test

- [ ] Open the website on a phone-sized screen.
- [ ] Confirm the mobile menu button appears.
- [ ] Confirm the hero text fits without being cut off.
- [ ] Confirm all cards stack vertically.
- [ ] Confirm all forms fit the screen width.
- [ ] Confirm buttons are easy to tap.
- [ ] Confirm there is no horizontal scrolling.

## Navigation Test

- [ ] Click Home.
- [ ] Click Services.
- [ ] Click Drivers.
- [ ] Click Owner Operators.
- [ ] Click About Us.
- [ ] Click Contact.
- [ ] Confirm each navigation item scrolls to the correct section.
- [ ] On mobile, confirm the menu closes after selecting a navigation link.

## Broker Form Test

- [ ] Go to the Broker Freight Request form.
- [ ] Fill in all required fields.
- [ ] Select a commodity.
- [ ] Add optional temperature, load number, or notes.
- [ ] Click Submit Freight Request.
- [ ] Confirm the success message appears.

## Driver Form Test

- [ ] Go to the Driver Application form.
- [ ] Fill in all required fields.
- [ ] Select CDL status.
- [ ] Select years of experience.
- [ ] Add optional notes.
- [ ] Click Submit Driver Application.
- [ ] Confirm the success message appears.

## Owner Operator Form Test

- [ ] Go to the Owner Operator Application form.
- [ ] Fill in all required fields.
- [ ] Select equipment type.
- [ ] Select reefer experience.
- [ ] Add optional lane, availability, or equipment notes.
- [ ] Click Submit Owner Operator Application.
- [ ] Confirm the success message appears.

## Phone Button Test

- [ ] Click the phone button in the hero section.
- [ ] Confirm it opens a call prompt or phone app with +1 (206) 446-2631.
- [ ] Click the Call Now button in the contact section.
- [ ] Confirm it opens a call prompt or phone app with +1 (206) 446-2631.

## Email Button Test

- [ ] Click Email Dispatch.
- [ ] Confirm it opens an email draft to dispatch@energylog.org.
- [ ] Click Email HR.
- [ ] Confirm it opens an email draft to hrenergylog@gmail.com.
- [ ] Confirm freight quote, broker, and carrier packet email links go to dispatch.
- [ ] Confirm driver, CDL graduate, owner operator, and recruiting email links go to HR.

## Required Field Validation Test

- [ ] Open each form.
- [ ] Leave required fields blank.
- [ ] Click the submit button.
- [ ] Confirm the form does not submit.
- [ ] Confirm a required-field error message appears.
- [ ] Confirm missing required fields are highlighted.
- [ ] Confirm focus moves to the first missing required field.

## Success Message Test

- [ ] Complete the Broker Freight Request form with valid required fields.
- [ ] Submit the form and confirm the success message appears.
- [ ] Complete the Driver Application form with valid required fields.
- [ ] Submit the form and confirm the success message appears.
- [ ] Complete the Owner Operator Application form with valid required fields.
- [ ] Submit the form and confirm the success message appears.
- [ ] Confirm each form clears after successful submission.

## Telegram Notification Test

- [ ] Add test bot credentials to the server environment: `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
- [ ] Submit the Freight Quote Request form and confirm the test Telegram group receives a summary only.
- [ ] Submit the Broker Resources / Carrier Packet Request form and confirm the test Telegram group receives a summary only.
- [ ] Submit the Driver Application form with a sample upload and confirm Telegram does not receive the uploaded document.
- [ ] Submit the Contact Form for Dispatch, HR, and Admin and confirm routing appears correctly in the Telegram summary.
- [ ] Remove Telegram credentials and confirm form submissions still save and show the normal success message.
- [ ] Use invalid Telegram credentials and confirm submissions still save while `logs/security.log` records `telegram_failed`.
- [ ] Trigger a browser JavaScript error and confirm `api/report-error.php` logs it; if Telegram is configured, confirm the test group receives an error summary.
