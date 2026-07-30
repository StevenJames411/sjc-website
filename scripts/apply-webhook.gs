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
 * THE FIX. Pick the tab from the lead's Source instead of always taking the first sheet.
 * "/websites — $795 website offer" -> a tab called "Websites".
 */
function sheetFor(data, answers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('script is not attached to a spreadsheet');

  var source = '';
  for (var i = 0; i < answers.length; i++) {
    var k = String(answers[i].key || answers[i].label || '').toLowerCase();
    if (k === 'source') { source = String(answers[i].value || ''); break; }
  }

  var raw = (source || data.site || '').split('—')[0].split('|')[0].replace(/^\//, '').trim();
  raw = raw.replace(/[\[\]:*?\/\\]/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 90);
  var name = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : FALLBACK_TAB;

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
