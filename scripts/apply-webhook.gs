// SJC Intake — Google Apps Script webhook (KEYED columns, one TAB PER OFFER).
//
// Each question maps to a column by a STABLE ID kept invisibly in the header cell's NOTE.
// Reword a question -> same column (header just updates). Add a question -> new column.
// Drag any column anywhere (Time included) -> nothing breaks. Also emails Steven every lead.
//
// ── WHAT CHANGED AND WHY ────────────────────────────────────────────────────
// The old version ended line 10 with getSheets()[0] — it wrote EVERY form to the
// FIRST tab. Three different offers (AI discovery, podcast guests, the website
// build) all piled into "New-Client", each carving out its own columns off to
// the right because their question keys differ. Opening the sheet showed
// columns A–M empty and read as "the website leads never arrived", when they
// were sitting in columns N–V the whole time.
//
// Now the TAB is chosen by the lead's Source. The website offer gets its own
// tab, created the first time one comes in. Nothing existing is moved or
// touched — "New-Client" keeps its history exactly as it stands.

var FALLBACK_TAB = 'Leads';
var TZ = 'America/Chicago';

/**
 * The timestamp as READABLE TEXT — "8/5/2026  4:47 PM" — not a date value.
 *
 * ⚠️ Deliberately dumb. Writing a real Date and applying a number format deployed fine, ran to
 * "Completed", and still left raw ISO in the sheet on 2026-08-05 — the format never landed on the
 * cell the value went into. Formatting the string here removes every moving part: no Date object,
 * no number format, no row or column arithmetic. What is written is what is displayed.
 *
 * Identical to sjc-sheets.gs on purpose. Change one, change both.
 */
function readableTime_(iso) {
  var d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) return String(iso || '');
  return Utilities.formatDate(d, TZ, 'M/d/yyyy  h:mm a');
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var answers = data.answers || [];
    var sheet = sheetFor(data, answers);

    // Everything to write, timestamp first. Each item carries a stable key + a display label.
    //
    // Readable text, not a date value — see readableTime_ for why this is deliberately dumb.
    var items = [{ key: '__time__', label: 'Time', value: readableTime_(data.submittedAt) }];
    answers.forEach(function (a) {
      items.push({ key: String(a.key || a.label), label: String(a.label || ''), value: a.value });
    });

    // Current header row: values (labels) + notes (keys). Empty sheet => empty arrays.
    var lastCol = sheet.getLastColumn();
    var headerVals = [], headerNotes = [];
    if (lastCol > 0) {
      var hr = sheet.getRange(1, 1, 1, lastCol);
      headerVals = hr.getValues()[0];
      headerNotes = hr.getNotes()[0];
    }

    // Find (or create) the column for a key; keep its header label current.
    function columnFor(key, label) {
      // 1) match by the stable key (the note) — reword just updates the visible label
      for (var i = 0; i < headerNotes.length; i++) {
        if (headerNotes[i] === key) {
          if (headerVals[i] !== label) { sheet.getRange(1, i + 1).setValue(label); headerVals[i] = label; }
          return i;
        }
      }
      // 2) migrate an existing label-only column (no key yet) by matching its label
      for (var j = 0; j < headerVals.length; j++) {
        if (!headerNotes[j] && headerVals[j] === label) {
          sheet.getRange(1, j + 1).setNote(key); headerNotes[j] = key;
          return j;
        }
      }
      // 3) brand-new column at the end
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

    sheet.appendRow(row);
    if (sheet.getFrozenRows() < 1) sheet.setFrozenRows(1);

    // ⚠️ NO EMAIL FROM HERE. Resend owns the alert — see lib/leadDelivery.ts.
    //
    // This used to MailApp.sendEmail on every lead, from Steven's own Google account, subject
    // "New lead — <tab name>". Two problems. It cannot carry reply-to, so hitting reply reached
    // Steven rather than the person who filled the form. And its subject was named after whichever
    // tab the routing picked, so the day the routing broke it announced the wrong offer.
    //
    // It stayed switched on until 2026-08-05 only because SJC's own /apply and podcast forms had
    // no Resend address; deleting it sooner would have made those two forms silent. The Consulting
    // site now has leadEmail set, so Resend covers all three and this is pure duplication.
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
  return reply('ok — apply-webhook is deployed');
}

function reply(text) {
  return ContentService.createTextOutput(text);
}

/**
 * Which tab a lead belongs in.
 *
 * ⚠️ DELIBERATE, FIXED NAMES — never derived from the Source text. Source is free text that each
 * form sets independently: the website form says "/websites — $795 website offer", and /apply
 * sends no source at all. Naming tabs from it produced an "Apply" tab that duplicated the
 * discovery intake, and would eventually give you a wall of near-identical tabs nobody can read.
 *
 * There are exactly three of Steven's own offers. Anything from a CLIENT's website gets a tab of
 * its own under the business name, which is what the 2026-07-26 record specifies.
 */
// THREE TABS BECAUSE THERE ARE THREE INTAKE FORMS ON ONE WEBSITE.
//
// stevenjamesconsulting.com is a single website carrying three forms — the AI-implementation
// application, the podcast-guest form, and the website offer at /websites, which is a nested page
// that behaves like its own site but isn't one. One website, three forms, three tabs. That is the
// whole reason this sheet exists and the whole reason it should never grow a fourth tab.
//
// ⚠️ A CLIENT IS A DIFFERENT SHAPE ENTIRELY. Each client is ONE website with ONE form, and gets
// its OWN SHEET — Steven owns it and shares it with the client VIEW-ONLY, so they can look any
// time and copy it if they want to reorganise their own version. Their leads never land here.
// Until a demo is sold it has no customer to own a sheet, so its enquiries fold into Website Offer.
var TAB_AI      = 'AI Implementation'; // /apply — the discovery intake. Sends NO source.
var TAB_WEBSITE = 'Website Offer';     // /websites, and any client site's own form
var TAB_PODCAST = 'Podcast Guests';    // /guest (normally its own webhook; here as a safety net)

function sheetFor(data, answers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('script is not attached to a spreadsheet');

  var source = '';
  for (var i = 0; i < answers.length; i++) {
    var k = String(answers[i].key || answers[i].label || '').toLowerCase();
    if (k === 'source') { source = String(answers[i].value || ''); break; }
  }
  var s = source.toLowerCase();

  // ⚠️ NEVER ROUTE ON THE BUSINESS NAME. THAT IS THE BUG THIS REPLACED (2026-08-05).
  //
  // The old test was `isClientSite = site.indexOf('steven james') === -1`, written when "Steven
  // James" meant only Consulting. The moment stevenjamesdesigns.com existed, Steven's OWN studio
  // site matched that string, isClientSite went false, and its source ("imported design — contact
  // section") matched neither 'website' nor 'guest' — so every enquiry from the studio fell
  // through to the AI Implementation default. It landed under headers it doesn't fit (First name
  // / Last name / Cell phone) and emailed a subject line naming the wrong offer.
  //
  // A brand name is not an identity, and renaming a company must never re-route its leads. Route
  // on what the FORM says about itself:
  //   no source at all  -> /apply, the discovery intake. It has never sent one; that IS its tell.
  //   guest / podcast   -> the podcast form.
  //   anything else     -> a website enquiry. Website Offer is the safe catch-all: a misfiled
  //                        website lead is obvious and recoverable, while one filed under the
  //                        discovery headers is silently mis-columned.
  var name;
  if (!s) name = TAB_AI;
  else if (s.indexOf('guest') !== -1 || s.indexOf('podcast') !== -1) name = TAB_PODCAST;
  else name = TAB_WEBSITE;

  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.setFrozenRows(1);
  }
  return sheet;
}


