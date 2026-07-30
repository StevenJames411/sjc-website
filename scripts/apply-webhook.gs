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

var EMAIL_TO = 'steven@stevenbarchetti.com';
var FALLBACK_TAB = 'Leads';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var answers = data.answers || [];
    var sheet = sheetFor(data, answers);

    // Everything to write, timestamp first. Each item carries a stable key + a display label.
    var items = [{ key: '__time__', label: 'Time', value: data.submittedAt || new Date() }];
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

    notify(sheet.getName(), items);
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

// ── AND ONE THAT IS NOT A LEAD TAB (2026-07-30) ────────────────────────────────────────────────
// The rule above — never a fourth tab — is about LEAD forms proliferating from free-text Source
// values, which is what produced a duplicate "Apply" tab. This is a different animal and breaks
// none of that reasoning:
//   • It is not a lead. It's a client who has already bought, filling in onboarding once.
//   • It is ONE row per client, not a stream of enquiries.
//   • The tab name is fixed here, never derived from anything the caller sends.
// Their onboarding answers belong with Steven because it's his build process — unlike their
// LEADS, which go to their own sheet and never land here.
var TAB_ONBOARD = 'Onboarding';        // /<business>/onboard — filled once, after the sale

function sheetFor(data, answers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('script is not attached to a spreadsheet');

  var source = '';
  for (var i = 0; i < answers.length; i++) {
    var k = String(answers[i].key || answers[i].label || '').toLowerCase();
    if (k === 'source') { source = String(answers[i].value || ''); break; }
  }
  var s = source.toLowerCase();
  var site = String(data.site || '');
  var isClientSite = site && site.toLowerCase().indexOf('steven james') === -1;

  // Checked FIRST and matched exactly. An onboarding row also carries the business name, and a
  // client site sets isClientSite — either would otherwise drag it into Website Offer, mixing a
  // finished customer's onboarding in with raw enquiries.
  var name;
  if (s === 'onboarding') name = TAB_ONBOARD;
  else if (s.indexOf('website') !== -1 || isClientSite) name = TAB_WEBSITE;
  else if (s.indexOf('guest') !== -1 || s.indexOf('podcast') !== -1) name = TAB_PODCAST;
  else name = TAB_AI; // the default, because /apply sends no source at all

  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function notify(tabName, items) {
  var lines = [];
  for (var i = 0; i < items.length; i++) {
    if (String(items[i].value || '').trim()) lines.push(items[i].label + ': ' + items[i].value);
  }
  MailApp.sendEmail({
    to: EMAIL_TO,
    subject: 'New lead — ' + tabName,
    body: lines.join('\n') + '\n\nTab: ' + tabName,
  });
}
