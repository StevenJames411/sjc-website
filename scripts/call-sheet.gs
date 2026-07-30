// THE SOLD BUTTON — paste this into any call sheet, once per sheet.
//
// Tick "Sold" on the row you are looking at during the call. By the time you have hung up, that
// row has her onboarding link in it, and behind the scenes she has a website, her own Google
// sheet, and an open onboarding form.
//
// It replaces, per customer: New website in the builder · create her spreadsheet · bind and deploy
// a script · authorize it · store the webhook · open her onboarding · copy the link.
//
// ── WHY IT READS HEADERS INSTEAD OF FIXED COLUMNS ──────────────────────────────────────────────
// Steven's call sheets already disagree with each other — the groomer sheet and the deck-builder
// sheet have different columns, and both will grow. So nothing here is positional. The business
// name is found by looking for a header that means "name", and EVERY OTHER COLUMN IS SENT ALONG
// VERBATIM. What he knew going into the call stays attached to her record even where we have no
// field named for it. Add a column next month and nothing breaks.
//
// ── SETUP, ONCE PER SHEET ──────────────────────────────────────────────────────────────────────
//   1. Extensions → Apps Script. Paste this file in. Save.
//   2. Project Settings → Script properties, add:
//        SJC_BASE    https://www.stevenjamesconsulting.com
//        SJC_TOKEN   the SITE_EDIT_TOKEN value
//   3. Run the `setup` function once (Run ▸ setup). Authorize when asked.
//      This installs the trigger — a plain onEdit cannot reach the internet, which is why the
//      checkbox does nothing without this step.
//   4. Add a column headed "Sold" (Insert → Tick box) if the sheet has not got one.
//
// Then: tick the box.

var COL_SOLD = 'sold';
var COL_LINK = 'Onboarding Link';

/** Run once, by hand, to install the trigger and add the menu. */
function setup() {
  var ss = SpreadsheetApp.getActive();

  // Remove ours first so running setup twice doesn't fire the endpoint twice per tick.
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onSoldEdit') ScriptApp.deleteTrigger(t);
  });

  ScriptApp.newTrigger('onSoldEdit').forSpreadsheet(ss).onEdit().create();
  SpreadsheetApp.getUi().alert(
    'Ready.\n\nTick the "Sold" box on a row and her onboarding link will appear in the ' +
      '"' + COL_LINK + '" column.'
  );
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('SJC')
    .addItem('Set up this sheet', 'setup')
    .addItem('Sold — set up the row I have selected', 'sellSelectedRow')
    .toTitle();
}

/** The checkbox path. */
function onSoldEdit(e) {
  try {
    if (!e || !e.range) return;
    var sheet = e.range.getSheet();
    var headers = headerRow_(sheet);
    var col = indexOfHeader_(headers, [COL_SOLD]);
    if (col < 0 || e.range.getColumn() !== col + 1) return;
    if (e.range.getRow() < 2) return;

    var v = String(e.value == null ? '' : e.value).toLowerCase();
    // Ticked, or set to yes/true/sold. Unticking must not re-run anything.
    if (v !== 'true' && v !== 'yes' && v !== 'sold') return;

    sell_(sheet, e.range.getRow(), headers);
  } catch (err) {
    console.error(err);
  }
}

/** The menu path, for when you would rather click deliberately. */
function sellSelectedRow() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var row = sheet.getActiveRange().getRow();
  if (row < 2) {
    SpreadsheetApp.getUi().alert('Select a row first.');
    return;
  }
  var msg = sell_(sheet, row, headerRow_(sheet));
  SpreadsheetApp.getUi().alert(msg);
}

function sell_(sheet, row, headers) {
  var base = prop_('SJC_BASE');
  var token = prop_('SJC_TOKEN');
  if (!base || !token) {
    return 'SJC_BASE / SJC_TOKEN are not set in Project Settings → Script properties.';
  }

  var values = sheet.getRange(row, 1, 1, headers.length).getValues()[0];

  // Pull out the handful we have real fields for; everything else rides along in `extra`.
  var payload = { extra: {} };
  var known = {
    businessName: ['company', 'business', 'business name', 'name'],
    phone: ['phone', 'phone number', 'telephone'],
    email: ['email', 'email address'],
    address: ['address', 'location'],
    hours: ['hours', 'opening hours'],
    notes: ['notes', 'note'],
  };

  for (var c = 0; c < headers.length; c++) {
    var head = String(headers[c] || '').trim();
    if (!head) continue;
    var val = values[c];
    if (val === '' || val == null) continue;

    // ⚠️ SCRAPED SHEETS ARE FULL OF THE WORD "null". The groomer pull wrote it literally into
    // every Hours cell. Passed through, that becomes her opening hours on her record — and
    // because the onboarding form skips whatever we already have an answer for, she would never
    // be asked to correct it. A customer would see it before she did.
    var clean = String(val).trim();
    if (/^(null|undefined|n\/a|na|none|-|—)$/i.test(clean)) continue;

    var matched = '';
    for (var field in known) {
      if (known[field].indexOf(head.toLowerCase()) >= 0) { matched = field; break; }
    }
    if (matched && !payload[matched]) payload[matched] = clean;
    else payload.extra[head] = clean;
  }

  if (!payload.businessName) {
    return 'Could not find a business name on that row — is there a "Company" or "Name" column?';
  }

  var res = UrlFetchApp.fetch(base.replace(/\/+$/, '') + '/api/admin/onboard-client', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  var body;
  try {
    body = JSON.parse(res.getContentText());
  } catch (err) {
    return 'The website replied with something unreadable (HTTP ' + res.getResponseCode() + ').';
  }
  if (!body.ok) return 'Failed: ' + (body.error || 'unknown');

  // Write the link back into the row. The whole point is that it is waiting for you when you
  // finish the call, not somewhere you have to go and look for it.
  var linkCol = indexOfHeader_(headers, [COL_LINK.toLowerCase()]);
  if (linkCol < 0) {
    linkCol = headers.length;
    sheet.getRange(1, linkCol + 1).setValue(COL_LINK).setFontWeight('bold');
  }
  sheet.getRange(row, linkCol + 1).setValue(body.onboardUrl);

  return body.reused
    ? 'Already set up — link is in the row.'
    : 'Done. Her website, her sheet and her onboarding form are ready. Link is in the row.';
}

function headerRow_(sheet) {
  var lastCol = sheet.getLastColumn();
  return lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
}

function indexOfHeader_(headers, names) {
  for (var i = 0; i < headers.length; i++) {
    if (names.indexOf(String(headers[i] || '').trim().toLowerCase()) >= 0) return i;
  }
  return -1;
}

function prop_(k) {
  return PropertiesService.getScriptProperties().getProperty(k) || '';
}
