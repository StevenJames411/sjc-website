// ONE CLIENT'S OWN SHEET — Google Apps Script, bound to that client's spreadsheet.
//
// Steven owns the sheet and shares it with the client VIEW-ONLY. It holds two tabs:
//
//   Leads       every enquiry from their website, newest at the bottom
//   Onboarding  what they told us when they signed up — one row, filled once
//
// ── WHY THIS IS A SEPARATE SCRIPT FROM apply-webhook.gs ────────────────────────────────────────
// That one is SJC's OWN operations sheet: three tabs for Steven's three forms, and a written rule
// against growing a fourth. A client is a different shape entirely — one website, one form, their
// own sheet. Their leads and their onboarding never land in Steven's sheet, and his never land in
// theirs. Two scripts, because they are two different jobs, not one job with a flag.
//
// It is also the client's safety net and the renewal proof: they can open it any time and see
// every lead their site produced, which settles "I never got that enquiry" permanently.
//
// ── SETUP, ONCE PER CLIENT ─────────────────────────────────────────────────────────────────────
//   1. Create a new spreadsheet named "<Business> — Leads".
//   2. Rename the default "Sheet1" to "Leads", or delete it. Otherwise the client opens their
//      sheet and finds an empty tab sitting next to their real ones.
//   3. Extensions → Apps Script. Paste this file in. Save.
//   4. Set EMAIL_TO below to the OWNER's email — leads should reach them, not Steven.
//   5. Deploy → New deployment → Web app.
//        Execute as:  Me
//        Who has access:  Anyone      ← NOT "Only myself", or the website cannot post to it
//      Copy the /exec URL.
//   6. ⚠️ AUTHORIZE. Google will demand consent before the deployment works, and it CANNOT be
//      automated — it is a per-client click, every time. Expect "Google hasn't verified this
//      app" (you wrote it a minute ago): Advanced → Go to project → Allow. It asks for the
//      spreadsheet and for send-email, which is exactly what the script does.
//   7. Put the /exec URL on the site record as `sheetWebhook` (lib/sitesShared.ts).
//   8. Open the /exec URL in a browser. It must say "ok — client-sheet is deployed".
//   9. Share the spreadsheet with the owner as VIEWER. Not editor — one accidental sort and
//      their own history is scrambled, and they'll ask you to fix it.
//
// Proven end to end on Lucky Dog Wash House, 2026-07-30: onboarding wrote one row with the
// questions as headers, re-submitting after a reopen UPDATED that row rather than adding a
// second, a newly-answered question added its own column, and SJC's own sheet gained nothing.
//
// ⚠️ Redeploying: use Deploy → Manage deployments → edit the EXISTING one. "New deployment"
// mints a different URL and silently orphans the one stored on the record.

var EMAIL_TO = '';                 // the OWNER's address. Blank = no email, rows still land.
var TAB_LEADS = 'Leads';
var TAB_ONBOARDING = 'Onboarding';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var answers = data.answers || [];

    // Which tab. Onboarding is marked explicitly by the sender; everything else is a lead.
    var source = '';
    for (var i = 0; i < answers.length; i++) {
      var k = String(answers[i].key || answers[i].label || '').toLowerCase();
      if (k === 'source') { source = String(answers[i].value || '').toLowerCase(); break; }
    }
    var isOnboarding = source === 'onboarding';
    var sheet = tab(isOnboarding ? TAB_ONBOARDING : TAB_LEADS);

    // Columns are matched by a STABLE KEY held in the header cell's NOTE, not by position.
    // Reword a question and the column stays; drag columns around and nothing breaks. Same
    // approach as SJC's sheet, and for the same reason: these questions will change.
    var items = [{ key: '__time__', label: 'Time', value: data.submittedAt || new Date() }];
    answers.forEach(function (a) {
      items.push({ key: String(a.key || a.label), label: String(a.label || ''), value: a.value });
    });

    var lastCol = sheet.getLastColumn();
    var headerVals = [], headerNotes = [];
    if (lastCol > 0) {
      var hr = sheet.getRange(1, 1, 1, lastCol);
      headerVals = hr.getValues()[0];
      headerNotes = hr.getNotes()[0];
    }

    function columnFor(key, label) {
      for (var i = 0; i < headerNotes.length; i++) {
        if (headerNotes[i] === key) {
          if (headerVals[i] !== label) { sheet.getRange(1, i + 1).setValue(label); headerVals[i] = label; }
          return i;
        }
      }
      var idx = headerVals.length;
      sheet.getRange(1, idx + 1).setValue(label).setNote(key).setFontWeight('bold');
      headerVals.push(label); headerNotes.push(key);
      return idx;
    }

    var row = [];
    items.forEach(function (it) {
      var c = columnFor(it.key, it.label);
      while (row.length <= c) row.push('');
      row[c] = it.value == null ? '' : it.value;
    });
    while (row.length < headerVals.length) row.push('');

    // ONBOARDING IS ONE ROW, NOT A LOG. She can reopen the form and add photos later; that should
    // update what's there, not leave two half-rows to reconcile. Leads always append.
    if (isOnboarding && sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
    if (sheet.getFrozenRows() < 1) sheet.setFrozenRows(1);

    notify(sheet.getName(), items, isOnboarding);
    return reply('ok');
  } catch (err) {
    // Returned in the BODY on purpose — Apps Script sends HTTP 200 even when it throws, so the
    // caller has no other way to tell a failed write from a successful one.
    console.error(err);
    return reply('error: ' + (err && err.message ? err.message : err));
  }
}

/** Health check — open the web-app URL in a browser and it should say ok. */
function doGet() {
  return reply('ok — client-sheet is deployed');
}

function reply(text) {
  return ContentService.createTextOutput(text);
}

function tab(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('script is not attached to a spreadsheet');
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Leads first — it's the one they'll open every day.
    if (name === TAB_LEADS) ss.setActiveSheet(sheet), ss.moveActiveSheet(1);
  }
  return sheet;
}

/**
 * Email the owner. A lead sitting unread in a spreadsheet is a lead lost — their phone is the
 * system, so the row is the record and the email is the alert.
 * Onboarding doesn't email: they just filled it in, they know what they said.
 */
function notify(tabName, items, isOnboarding) {
  if (!EMAIL_TO || isOnboarding) return;
  var lines = items.map(function (it) { return it.label + ': ' + (it.value == null ? '' : it.value); });
  var replyTo = '';
  items.forEach(function (it) {
    var v = String(it.value || '');
    if (!replyTo && v.indexOf('@') > 0 && v.indexOf(' ') === -1) replyTo = v;
  });
  var opts = { name: 'Website' };
  // Reply-to is the LEAD, so hitting reply on a phone starts the conversation with the customer.
  if (replyTo) opts.replyTo = replyTo;
  MailApp.sendEmail(EMAIL_TO, 'New enquiry from your website', lines.join('\n'), opts);
}
