/**
 * GOOGLE APPS SCRIPT — Form collector for the Natalie Gutman site
 *
 * Captures all three form types into one spreadsheet (three tabs, created
 * automatically) AND optionally emails you on every submission:
 *   • Email Signups      — the free-guide forms (home + buy page)
 *   • Contact Messages   — the contact page + the buy/sell "send a message" forms
 *   • Valuation Requests — the seller valuation form
 *
 * SETUP (one-time, ~5 minutes):
 * ─────────────────────────────
 * 1. Go to https://sheets.google.com and create a new, empty spreadsheet
 *    (name it anything, e.g. "Natalie — Website Leads"). You don't need to add
 *    any tabs or headers by hand — the script creates them on first use.
 *
 * 2. In that spreadsheet: Extensions → Apps Script. Delete the placeholder code,
 *    paste EVERYTHING below the dashed line, and click Save.
 *
 * 3. (Optional) Set NOTIFY_EMAIL below to the inbox that should be pinged on each
 *    submission. Leave it as '' if you only want the spreadsheet.
 *
 * 4. Deploy → New deployment → gear icon → "Web app".
 *      - Execute as:      Me
 *      - Who has access:  Anyone
 *    Click Deploy, then Authorise when prompted (allow Sheets + Gmail access).
 *
 * 5. Copy the "Web app URL" it shows you, then paste it into:
 *        assets/form-endpoint.js   →   window.SHEETS_URL = 'PASTE_URL_HERE';
 *    That's the only place you set it — every form on the site uses it.
 *
 * To check it's live: open the Web app URL in a browser — it should say
 * "Natalie Gutman form collector is running."
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Optional: inbox to notify on every submission. Leave '' to disable email alerts.
var NOTIFY_EMAIL = 'bhinvest7@gmail.com';

function doPost(e) {
  var p = (e && e.parameter) ? e.parameter : {};
  var type = p.type || 'email';
  var now = new Date();

  if (type === 'contact') {
    appendRow_('Contact Messages',
      ['Timestamp', 'Name', 'Email', 'Interested in', 'Message'],
      [now, p.name || '', p.email || '', p.role || '', p.message || '']);
    notify_('New contact message',
      'Name: ' + (p.name || '') + '\n' +
      'Email: ' + (p.email || '') + '\n' +
      'Interested in: ' + (p.role || '') + '\n\n' +
      (p.message || ''));

  } else if (type === 'valuation') {
    appendRow_('Valuation Requests',
      ['Timestamp', 'Name', 'Email', 'Phone', 'Address / area', 'Property type', 'Bedrooms'],
      [now, p.name || '', p.email || '', p.phone || '', p.address || '', p.proptype || '', p.bedrooms || '']);
    notify_('New valuation request',
      'Name: ' + (p.name || '') + '\n' +
      'Email: ' + (p.email || '') + '\n' +
      'Phone: ' + (p.phone || '') + '\n' +
      'Address / area: ' + (p.address || '') + '\n' +
      'Property type: ' + (p.proptype || '') + '\n' +
      'Bedrooms: ' + (p.bedrooms || ''));

  } else { // email signup (the free-guide forms)
    appendRow_('Email Signups',
      ['Timestamp', 'Email', 'Interested in'],
      [now, p.email || '', p.role || '']);
    notify_('New guide signup',
      'Email: ' + (p.email || '') + '\n' +
      'Interested in: ' + (p.role || ''));
  }

  return ContentService
    .createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Visiting the Web app URL in a browser hits this — a friendly health check.
function doGet() {
  return ContentService.createTextOutput('Natalie Gutman form collector is running.');
}

// Append a row, creating the tab + bold header row the first time it's needed.
function appendRow_(sheetName, headers, row) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  sheet.appendRow(row);
}

// Send an alert email if NOTIFY_EMAIL is set. Failures (quota/auth) are ignored
// so a notification problem never blocks the row being saved.
function notify_(subject, body) {
  if (!NOTIFY_EMAIL) return;
  try {
    MailApp.sendEmail(NOTIFY_EMAIL, 'Website lead — ' + subject, body);
  } catch (err) { /* ignore */ }
}
