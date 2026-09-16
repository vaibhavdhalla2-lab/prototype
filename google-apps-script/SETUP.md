# FORMÉ feedback → Google Sheets setup

This connects the "Tell Us What You Think" form to a Google Sheet, with a
Google Apps Script web app as the only thing in between. No Google account
is required from people filling out the form — the sheet is for the FORMÉ
team only.

```
USER → FORMÉ feedback form → Apps Script web app (doPost) → Google Sheet (new row)
```

## 1. Create the Google Sheet

1. Create a new Google Sheet (any name, e.g. "FORMÉ Feedback").
2. You don't need to add headers or a "Feedback" tab yourself — `Code.gs`
   creates the `Feedback` sheet and header row automatically on first run.

## 2. Add the script

1. In the Sheet, open **Extensions → Apps Script**.
2. Delete the default `Code.gs` contents and paste in this repo's
   `google-apps-script/Code.gs`.
3. Save the project (any project name is fine).

## 3. Deploy as a web app

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me (your account)
   - **Who has access:** Anyone
4. Click **Deploy**, then **Authorize access** and approve the permissions
   Google prompts for (it only needs access to this one spreadsheet).
5. Copy the **Web app URL** it gives you — it ends in `/exec`.

## 4. Point the frontend at it

In the FORMÉ repo, create a `.env` file (copy `.env.example`) and set:

```
VITE_FEEDBACK_ENDPOINT=https://script.google.com/macros/s/XXXXXXXXXXXX/exec
```

Restart `npm run dev` (or redeploy your hosting) after changing it — Vite
only reads `VITE_*` vars at build/start time.

## 5. Re-deploying after script changes

Apps Script web app URLs are versioned. If you edit `Code.gs` later, the
live `/exec` URL keeps serving the *old* version until you either:

- **Manage deployments → edit (pencil) icon → Version: New version → Deploy**
  (keeps the same URL), or
- Create a brand new deployment (gives you a new URL — you'd need to update
  `VITE_FEEDBACK_ENDPOINT` too).

The first option is almost always what you want.

## 6. Verify it end-to-end

1. Open the deployment URL directly in a browser — you should see
   `{"status":"ok", ...}` (that's `doGet`, just a health check).
2. Submit the feedback form on the actual site.
3. Check the Sheet — a `Feedback` tab should now have a header row plus
   exactly one data row.
4. Submit again and confirm a second row appears (and only one).

## Notes on how the frontend talks to this

- The request body is JSON, but sent with `Content-Type: text/plain`. This
  is deliberate: Apps Script web apps can't respond to the CORS preflight
  (`OPTIONS`) request a `application/json` content-type would trigger from
  a browser, so `text/plain` is used to keep it a "simple request" (no
  preflight) while the body itself is still parsed as JSON in `doPost`.
- `doPost` validates the required fields, stamps the timestamp
  **server-side** (never trusts the browser's clock), and uses
  `LockService` so two near-simultaneous submissions can't race each other
  into the same row.
- Nothing in the frontend needs a Google account, an API key, or the
  spreadsheet ID — the `/exec` URL is the entire interface.
