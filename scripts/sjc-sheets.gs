// SJC SHEETS — ONE script for every client sheet, forever. Google Apps Script, STANDALONE.
//
// ── WHY THIS REPLACES THE PER-CLIENT SCRIPT ────────────────────────────────────────────────────
// The first version bound a copy of a script to each client's spreadsheet. That worked, and it
// carried a cost we only saw once we did it for real: every new client meant creating a script,
// deploying it, and clicking through a Google authorization screen — a manual hoop per customer,
// forever, with an unverified-app warning in the middle of it.
//
// A script does not have to live inside the sheet it writes to. Running as Steven, it can open
// ANY spreadsheet he owns by id. So: ONE script, deployed once, authorized once, that writes
// wherever it is told. Adding a client stops touching Google at all.
//
//   before   new client -> new sheet + new script + new deployment + authorize      (~3 min each)
//   after    new client -> ask this script to make her a sheet                      (one call)
//
// ── SECURITY: THIS IS A DIFFERENT ANIMAL FROM THE BOUND SCRIPT ─────────────────────────────────
// ⚠️ A bound script could only ever touch its own spreadsheet, so leaving it open was survivable.
// This one can create spreadsheets and write into any of them. Deployed as "Anyone", its URL is
// all that stands between a stranger and Steven's Drive — so a shared secret is REQUIRED, not a
// nicety. It fails closed: no secret configured means every request is refused.
//
// The secret lives in Script Properties (Project Settings → Script properties), never in this
// file, because this file is in git.
//
// ── SETUP, ONCE EVER ───────────────────────────────────────────────────────────────────────────
//   1. script.google.com → New project. Paste this in. Name it "SJC Sheets".
//   2. Project Settings → Script properties → add  SJC_SECRET  = a long random string.
//   3. Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone.
//   4. Authorize (the unverified-app warning is expected — you wrote it).
//   5. Put the /exec URL and the same secret in the website's environment as
//      SHEETS_WEBHOOK_URL and SHEETS_SECRET.
//
// After that, never again.

var TAB_LEADS = 'Leads';
var TAB_ONBOARDING = 'Onboarding';

function secret_() {
  return PropertiesService.getScriptProperties().getProperty('SJC_SECRET') || '';
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    // Fail closed. An unset secret must refuse everything rather than accept everything.
    var want = secret_();
    if (!want || String(body.secret || '') !== want) {
      return reply({ ok: false, error: 'unauthorized' });
    }

    switch (String(body.action || '')) {
      case 'createClientSheet':
        return reply(createClientSheet_(body));
      case 'write':
        return reply(writeRow_(body));
      case 'ping':
        return reply({ ok: true, pong: true });
      default:
        return reply({ ok: false, error: 'unknown action: ' + body.action });
    }
  } catch (err) {
    // Apps Script returns HTTP 200 even when it throws, so the failure has to travel in the BODY
    // or the caller cannot tell a failed write from a successful one.
    console.error(err);
    return reply({ ok: false, error: String((err && err.message) || err) });
  }
}

/** Health check — open the /exec URL in a browser. */
function doGet() {
  return reply({ ok: true, service: 'sjc-sheets', configured: Boolean(secret_()) });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Make a new client their sheet, ready to use.
 *
 * Both tabs are created up front and the default "Sheet1" removed — a client opening their sheet
 * to a stray empty tab looks like nobody set it up properly, and that is their first impression
 * of the thing they are paying for.
 */
function createClientSheet_(body) {
  var name = String(body.businessName || '').trim();
  if (!name) return { ok: false, error: 'businessName required' };

  var ss = SpreadsheetApp.create(name + ' — Leads');

  // Leads first: it's the tab they'll open every day.
  var leads = ss.getSheets()[0];
  leads.setName(TAB_LEADS);
  ss.insertSheet(TAB_ONBOARDING);
  ss.setActiveSheet(leads);

  // Optional, and deliberately VIEWER — one accidental sort by an owner scrambles their own lead
  // history, and then Steven is the one restoring it.
  // ⚠️ SWALLOWING THIS FAILURE IS FINE. LYING ABOUT IT IS NOT.
  //
  // Catching is correct — a typo'd address must not lose the spreadsheet we just built. But the
  // return used to report `sharedWith: share` whether or not addViewer threw, so a share that
  // failed looked exactly like one that worked: the sheet exists, SJC's side goes green, the record
  // gets a sheetId, and the client has never once been able to open the thing she is paying for.
  // Nobody finds out until she asks where her leads are, months later.
  //
  // So: still don't throw, but say what actually happened. `sharedWith` is now only ever set when
  // the share genuinely landed, and `shareError` carries the reason when it didn't.
  var share = String(body.shareWith || '').trim();
  var shared = false;
  var shareError = null;
  if (share) {
    try {
      ss.addViewer(share);
      shared = true;
    } catch (err) {
      shareError = String(err);
      console.error('addViewer failed for ' + share + ': ' + shareError);
    }
  }

  return {
    ok: true,
    spreadsheetId: ss.getId(),
    url: ss.getUrl(),
    sharedWith: shared ? share : null,
    // Present only on failure, so a caller can branch on truthiness without knowing the shape.
    shareError: shareError,
  };
}

/**
 * Write one row into a client's sheet.
 *
 * Columns are matched by a STABLE KEY kept in the header cell's NOTE, never by position. Reword a
 * question and the column stays with its data; drag columns around and nothing breaks. These
 * questions WILL change, and a positional sheet silently shifts every value one column left the
 * first time one is removed.
 */
function writeRow_(body) {
  var id = String(body.spreadsheetId || '').trim();
  if (!id) return { ok: false, error: 'spreadsheetId required' };

  var answers = body.answers || [];
  var isOnboarding = String(body.tab || '') === TAB_ONBOARDING;
  var ss = SpreadsheetApp.openById(id);
  var sheet = ss.getSheetByName(isOnboarding ? TAB_ONBOARDING : TAB_LEADS);
  if (!sheet) sheet = ss.insertSheet(isOnboarding ? TAB_ONBOARDING : TAB_LEADS);

  // ⚠️ A REAL DATE, NOT THE ISO STRING — AND IDENTICAL TO apply-webhook.gs ON PURPOSE.
  //
  // The site sends "2026-08-05T21:01:04.680Z". Appended verbatim that is a TEXT cell reading in
  // UTC 24-hour time: unreadable at a glance, and not a date as far as Sheets is concerned, so no
  // amount of column formatting fixes it. Parsed here so the cell holds an actual date value,
  // then formatted after the write.
  //
  // Kept the same as the intake script deliberately. These two scripts write into different
  // spreadsheets, and every business's sheet — Steven's own included — should read the same way.
  // Change one, change both, or he opens two sheets and finds two conventions.
  var when = new Date(body.submittedAt);
  if (!body.submittedAt || isNaN(when.getTime())) when = body.submittedAt ? body.submittedAt : new Date();
  var items = [{ key: '__time__', label: 'Time', value: when }];
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
        if (headerVals[i] !== label) {
          sheet.getRange(1, i + 1).setValue(label);
          headerVals[i] = label;
        }
        return i;
      }
    }
    var idx = headerVals.length;
    sheet.getRange(1, idx + 1).setValue(label).setNote(key).setFontWeight('bold');
    headerVals.push(label);
    headerNotes.push(key);
    return idx;
  }

  var row = [];
  items.forEach(function (it) {
    var c = columnFor(it.key, it.label);
    while (row.length <= c) row.push('');
    row[c] = it.value == null ? '' : it.value;
  });
  while (row.length < headerVals.length) row.push('');

  // ONBOARDING IS ONE ROW, NOT A LOG. She can reopen her form and add photos later; that should
  // update what is there, not leave two half-rows to reconcile. Leads always append.
  if (isOnboarding && sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  if (sheet.getFrozenRows() < 1) sheet.setFrozenRows(1);

  // Regular time, not army time — same format string as apply-webhook.gs. Applied on every write
  // so a sheet created next month formats itself without anyone remembering to.
  var timeCol = headerNotes.indexOf('__time__') + 1;
  if (timeCol > 0) {
    var timeRow = (isOnboarding && sheet.getLastRow() > 1) ? 2 : sheet.getLastRow();
    sheet.getRange(timeRow, timeCol).setNumberFormat('M/d/yyyy  h:mm AM/PM');
  }

  notify_(body, items, isOnboarding);
  return { ok: true, tab: sheet.getName(), row: sheet.getLastRow() };
}

/**
 * Tell the owner a lead came in. A lead sitting unread in a spreadsheet is a lead lost — their
 * phone is the system, the row is the record, the email is the alert.
 * Onboarding never emails: she just filled it in, she knows what she said.
 */
function notify_(body, items, isOnboarding) {
  var to = String(body.notifyEmail || '').trim();
  if (!to || isOnboarding) return;

  var lines = items.map(function (it) {
    return it.label + ': ' + (it.value == null ? '' : it.value);
  });

  var replyTo = '';
  items.forEach(function (it) {
    var v = String(it.value || '');
    if (!replyTo && v.indexOf('@') > 0 && v.indexOf(' ') === -1) replyTo = v;
  });

  var opts = { name: 'Website' };
  // Reply-to is the LEAD, so hitting reply on a phone starts the conversation with the customer
  // rather than with us.
  if (replyTo) opts.replyTo = replyTo;

  try {
    MailApp.sendEmail(to, 'New enquiry from your website', lines.join('\n'), opts);
  } catch (err) {
    // The row is already written. A bounced alert must not fail the request and cost the lead.
    console.error('notify failed: ' + err);
  }
}
