# COREVERITAS

A German-language publication site with a Node.js backend, protected publishing tools, file downloads, and Stripe-hosted card checkout.

## Requirements

- Node.js 20 or newer
- A Stripe account for paid checkouts

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Set `ADMIN_PASSWORD` and a long random `SESSION_SECRET`.
4. Add a Stripe test secret to `STRIPE_SECRET_KEY` to test card checkout. Free downloads work without Stripe credentials.
5. Run `npm start` and open `http://localhost:3000`.

## Netlify deployment

Connect the repository to Netlify and deploy the repository root. The included `netlify.toml` runs `npm run build`, publishes `dist/`, and routes `/api/*` to the Netlify Function in `netlify/functions/api.mjs`. Netlify Blobs stores the publication catalog and uploaded files between function invocations and deploys.

In the Netlify project settings, add `ADMIN_PASSWORD`, `SESSION_SECRET`, and `STRIPE_SECRET_KEY` under environment variables with the Functions scope, then trigger a new deploy. Use a Stripe test secret until test checkout is complete. Paid checkout returns a setup message when the Stripe key is absent; public articles and free content do not require Stripe. Netlify function uploads are limited to 4 MB by this project.

Use Stripe test keys and Stripe's test card numbers while testing. Replace the test secret with a live secret only after configuring the production URL and reviewing the Stripe account settings. Never expose a Stripe secret in browser code.

## Publishing files

The admin form accepts PDF, EPUB, MOBI, AZW3, DOCX, TXT, RTF, and ZIP files. Netlify uploads are limited to 4 MB; the local Express server accepts files up to 50 MB. Set the price to zero for a free download. Paid publications must include an attachment. Netlify stores data in Blobs; local Express stores uploaded files and the publication catalog under `data/`, which is excluded from version control.

## Deployment

Run the Node server behind HTTPS. Configure `APP_BASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, and `STRIPE_SECRET_KEY` in the hosting provider's secret settings. Use persistent disk storage for `data/` or replace the local JSON/file store with managed storage before running multiple server instances. Configure Stripe tax, receipts, and applicable legal requirements for the sales regions before accepting live payments.
