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

var SCRIPT_VERSION = '3c19aaa1625a';
var TAB_LEADS = 'Leads';
var TAB_ONBOARDING = 'Onboarding';
// Money events, in SJC's OWN operations sheet — never a client's. Appends like Leads (it's a log,
// not a record that gets corrected) and never emails: Stripe already emails Steven on every one
// of these, and a second alert saying the same thing is how a board dies of false alarms.
var TAB_PAYMENTS = 'Payments';
var TZ = 'America/Chicago';

/**
 * Which tab a write is for.
 *
 * ⚠️ AN UNKNOWN NAME BECOMES Leads. That is the behaviour this replaced and it is kept on
 * purpose: a typo must never create a stray tab in a customer's spreadsheet that then quietly
 * collects her enquiries somewhere nobody is looking.
 */
function tabFor_(name) {
  var n = String(name || '');
  if (n === TAB_ONBOARDING) return TAB_ONBOARDING;
  if (n === TAB_PAYMENTS) return TAB_PAYMENTS;
  return TAB_LEADS;
}

/**
 * The timestamp as READABLE TEXT — "8/5/2026  4:47 PM" — not a date value.
 *
 * ⚠️ TWO CLEVERER VERSIONS OF THIS FAILED SILENTLY ON 2026-08-05, WHICH IS WHY IT IS DUMB NOW.
 *
 * The site sends ISO ("2026-08-05T21:47:12.894Z"). Writing that verbatim gives a text cell in UTC
 * 24-hour time — unreadable, and immune to column formatting because Sheets sees a string. The
 * fixes attempted were: write a real Date and set a number format on the cell, then on the whole
 * column. Both deployed, both ran to "Completed", and the sheet still showed raw ISO — the number
 * format never landed on the cell the value went into.
 *
 * Formatting the string HERE removes every moving part: no Date object, no number format, no
 * column or row arithmetic, nothing that can point at the wrong cell. What is written is exactly
 * what is displayed. The tradeoff is that the cell sorts as text, which costs nothing — leads are
 * appended in order, and the ISO string it replaces sorted as text too.
 *
 * Identical to apply-webhook.gs on purpose. Change one, change both.
 */
function readableTime_(iso) {
  var d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) return String(iso || '');
  return Utilities.formatDate(d, TZ, 'M/d/yyyy  h:mm a');
}

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
      case 'readRows':
        return reply(readRows_(body));
      case 'logCall':
        return reply(logCall_(body));
      case 'logSession':
        return reply(logSession_(body));
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

/**
 * Health check — open the /exec URL in a browser.
 *
 * Reports SCRIPT_VERSION so /api/admin/check-scripts can tell whether the LIVE script matches the
 * file in this repo. Nothing else connects the two: a paste that never happened looks exactly like
 * one that did, which is how a timestamp fix "deployed" twice and changed nothing.
 */
function doGet() {
  return reply({ ok: true, service: 'sjc-sheets', version: SCRIPT_VERSION, configured: Boolean(secret_()) });
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
  var tab = tabFor_(body.tab);
  var isOnboarding = tab === TAB_ONBOARDING;
  var ss = SpreadsheetApp.openById(id);
  var sheet = ss.getSheetByName(tab);
  if (!sheet) sheet = ss.insertSheet(tab);

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
  var when = readableTime_(body.submittedAt);
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


  notify_(body, items, tab);
  return { ok: true, tab: sheet.getName(), row: sheet.getLastRow() };
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// THE DIAL BOARD — reading a call sheet back out, and writing the result of a call into it.
//
// Everything above this line is the site WRITING a record and forgetting it. These two actions
// are the one place that reads a sheet back, and they exist for a surface that is Steven's own
// desk — his prospects, his notes, his calls. Never a client's leads. See lib/dial.ts.
// ══════════════════════════════════════════════════════════════════════════════════════════════

/** How many rows the board will ever pull at once. A scrape of a metro is a few hundred. */
var DIAL_MAX_ROWS = 2000;

/**
 * Read a call sheet: its tab names, its headers, and its rows.
 *
 * ⚠️ EVERY VALUE COMES BACK AS A STRING, formatted the way the sheet DISPLAYS it — via
 * getDisplayValues, not getValues. A phone number stored as a number arrives as 15128464044 from
 * getValues and "+1512-846-4044" from the display; the second is the one that can be dialled and
 * the one Steven is looking at. Same reason ratings keep their "4.9" instead of becoming 4.9000001.
 */
function readRows_(body) {
  var id = String(body.spreadsheetId || '').trim();
  if (!id) return { ok: false, error: 'spreadsheetId required' };

  var ss = SpreadsheetApp.openById(id);
  var tabs = ss.getSheets().map(function (s) { return s.getName(); });

  var wanted = String(body.tab || '').trim();
  var sheet = wanted ? ss.getSheetByName(wanted) : ss.getSheets()[0];
  if (!sheet) return { ok: false, error: 'no tab named "' + wanted + '" — has: ' + tabs.join(', ') };

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) {
    return { ok: true, title: ss.getName(), tab: sheet.getName(), tabs: tabs, headers: [], rows: [] };
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(function (h) {
    return String(h == null ? '' : h).trim();
  });

  var rows = [];
  if (lastRow > 1) {
    var take = Math.min(lastRow - 1, DIAL_MAX_ROWS);
    var vals = sheet.getRange(2, 1, take, lastCol).getDisplayValues();
    for (var i = 0; i < vals.length; i++) {
      // The sheet's OWN row number travels with every row. It is the only handle a write has, and
      // logCall_ re-checks the business name against it before touching anything.
      rows.push({ row: i + 2, cells: vals[i].map(function (v) { return String(v == null ? '' : v); }) });
    }
  }

  return {
    ok: true,
    title: ss.getName(),
    tab: sheet.getName(),
    tabs: tabs,
    headers: headers,
    rows: rows,
    truncated: lastRow - 1 > DIAL_MAX_ROWS,
  };
}

/**
 * Write the result of one call onto one row.
 *
 * ── ⛔ WHY THIS VERIFIES THE ROW BEFORE IT WRITES ─────────────────────────────────────────────
 * The board holds a list it read seconds or minutes ago, and identifies a business by its ROW
 * NUMBER. Row numbers are not identity: sort the sheet by rating, insert a row, delete a dud, and
 * row 34 is now a different business. The board would then stamp "not interested" onto somebody
 * Steven never called — silently, because a write to the wrong row succeeds exactly like a write
 * to the right one, and he would only find out weeks later when he skipped a good prospect.
 *
 * So the caller sends the NAME it thinks is on that row. If the name has moved, we search the
 * name column for it and write there instead. If it isn't in the sheet at all, we refuse and say
 * so — a refusal he can see beats a note filed against a stranger.
 */
function logCall_(body) {
  var id = String(body.spreadsheetId || '').trim();
  if (!id) return { ok: false, error: 'spreadsheetId required' };

  var ss = SpreadsheetApp.openById(id);
  var sheet = String(body.tab || '').trim()
    ? ss.getSheetByName(String(body.tab).trim())
    : ss.getSheets()[0];
  if (!sheet) return { ok: false, error: 'no such tab' };

  var lastCol = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: false, error: 'sheet has no rows' };

  var headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(function (h) {
    return String(h == null ? '' : h).trim();
  });

  var nameCol = indexOfHeaderLike_(headers, ['name', 'business', 'business name', 'company']);
  if (nameCol < 0) return { ok: false, error: 'no Name/Business/Company column to verify against' };

  var expect = String(body.expectName || '').trim();
  var row = parseInt(body.row, 10);
  if (!expect) return { ok: false, error: 'expectName required — a write is not allowed to guess' };

  var onRow = row >= 2 && row <= lastRow
    ? String(sheet.getRange(row, nameCol + 1).getDisplayValue() || '').trim()
    : '';

  if (onRow.toLowerCase() !== expect.toLowerCase()) {
    // The sheet moved under us. Find the business by name rather than writing where we were told.
    var col = sheet.getRange(2, nameCol + 1, lastRow - 1, 1).getDisplayValues();
    var found = -1;
    for (var i = 0; i < col.length; i++) {
      if (String(col[i][0] || '').trim().toLowerCase() === expect.toLowerCase()) { found = i + 2; break; }
    }
    if (found < 0) {
      return { ok: false, error: 'row ' + row + ' is now "' + onRow + '", and "' + expect + '" is not in this sheet — nothing written' };
    }
    row = found;
  }

  var when = readableTime_(body.at);
  var wrote = [];

  // The outcome and the time it happened, each in their own column, created if the sheet has not
  // got one. A scraped sheet never has them on day one.
  if (body.outcome) {
    setCell_(sheet, headers, row, 'Status', String(body.outcome));
    wrote.push('Status');
    setCell_(sheet, headers, row, 'Last called', when);
    wrote.push('Last called');
  }
  if (body.callbackAt) {
    setCell_(sheet, headers, row, 'Callback', String(body.callbackAt));
    wrote.push('Callback');
  }

  // ⚠️ NOTES APPEND, THEY DO NOT REPLACE. What he typed on the first call is the reason the second
  // call goes differently; overwriting it would throw away the only thing on the row worth having.
  var note = String(body.note || '').trim();
  if (note || body.outcome) {
    var noteCol = indexOfHeaderLike_(headers, ['notes', 'note']);
    var line = when + ' — ' + (body.outcome || 'note') + (note ? ': ' + note : '');
    if (noteCol < 0) {
      setCell_(sheet, headers, row, 'Notes', line);
    } else {
      var prev = String(sheet.getRange(row, noteCol + 1).getDisplayValue() || '').trim();
      sheet.getRange(row, noteCol + 1).setValue(prev ? prev + '\n' + line : line);
    }
    wrote.push('Notes');
  }

  return { ok: true, row: row, wrote: wrote, at: when };
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// CALL SESSIONS — how long he actually spent on the phone, and how many dials came out of it.
//
// ⛔ THIS WRITES TO SJC'S OWN OPERATIONS SHEET, NEVER A PROSPECT LIST. A day's calling can span two
// metro sheets, so a per-list tab would fragment the Monday-to-Saturday view this exists to give.
//
// TWO TABS, TWO DIFFERENT JOBS — the same split as Leads (append) vs Onboarding (one row):
//   Sessions  a LOG. Morning, afternoon and evening blocks are three rows sharing one date.
//   Days      a RUNNING TOTAL. One row per date that grows as sessions end. No sheet formulas,
//             because a formula in a tab a script appends to is a thing that breaks quietly.
// ══════════════════════════════════════════════════════════════════════════════════════════════

var TAB_SESSIONS = 'Sessions';
var TAB_DAYS = 'Days';

var SESSION_COLS = [
  { key: 'date', label: 'Date' },
  // ⚠️ WRITTEN FROM DAY ONE even though it only ever says "Steven" today. Per-rep logins are the
  // stated endgame ("make sure they're doing their dials"); adding this column later would leave
  // every row before it anonymous, which is exactly the history he would want.
  { key: 'who', label: 'Who' },
  { key: 'started', label: 'Started' },
  { key: 'ended', label: 'Ended' },
  { key: 'active', label: 'Active' },
  { key: 'dials', label: 'Dials' },
  { key: 'convos', label: 'Convos' },
  { key: 'callbacks', label: 'Callbacks' },
  { key: 'sold', label: 'Sold' },
  { key: 'perHour', label: 'Dials/hr' },
  { key: 'list', label: 'List' },
];

function logSession_(body) {
  var id = String(body.spreadsheetId || '').trim();
  if (!id) return { ok: false, error: 'spreadsheetId required' };

  var s = body.session || {};
  var date = String(s.date || '').trim();
  if (!date) return { ok: false, error: 'session.date required' };

  var ss = SpreadsheetApp.openById(id);
  var mins = Number(s.activeMins) || 0;
  var dials = Number(s.dials) || 0;

  // ── the log ──────────────────────────────────────────────────────────────────────────────────
  var log = ss.getSheetByName(TAB_SESSIONS) || ss.insertSheet(TAB_SESSIONS);
  var vals = {
    date: date,
    who: String(s.who || 'Steven'),
    started: String(s.started || ''),
    ended: String(s.ended || ''),
    active: hhmm_(mins),
    dials: dials,
    convos: Number(s.convos) || 0,
    callbacks: Number(s.callbacks) || 0,
    sold: Number(s.sold) || 0,
    perHour: perHour_(dials, mins),
    list: String(s.list || ''),
  };
  writeKeyed_(log, SESSION_COLS, vals, -1);

  // ── the running day ──────────────────────────────────────────────────────────────────────────
  // Read-add-write rather than overwrite: the caller only knows about ITS session, so the day's
  // total has to be accumulated here where the previous number lives.
  var days = ss.getSheetByName(TAB_DAYS) || ss.insertSheet(TAB_DAYS);
  var dayCols = [
    { key: 'date', label: 'Date' },
    { key: 'who', label: 'Who' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'active', label: 'Active' },
    { key: 'dials', label: 'Dials' },
    { key: 'convos', label: 'Convos' },
    { key: 'callbacks', label: 'Callbacks' },
    { key: 'sold', label: 'Sold' },
    { key: 'perHour', label: 'Dials/hr' },
  ];
  // A day belongs to a PERSON, so the key is date+who — two reps calling on the same Monday must
  // not add up into one row.
  var prev = findKeyed_(days, ['date', 'who'], [date, String(s.who || 'Steven')]);
  var was = prev.values || {};
  var totalMins = (Number(was.__activeMins) || minsFrom_(was.active)) + mins;
  var totalDials = (Number(was.dials) || 0) + dials;

  writeKeyed_(days, dayCols, {
    date: date,
    who: String(s.who || 'Steven'),
    sessions: (Number(was.sessions) || 0) + 1,
    active: hhmm_(totalMins),
    dials: totalDials,
    convos: (Number(was.convos) || 0) + (Number(s.convos) || 0),
    callbacks: (Number(was.callbacks) || 0) + (Number(s.callbacks) || 0),
    sold: (Number(was.sold) || 0) + (Number(s.sold) || 0),
    perHour: perHour_(totalDials, totalMins),
  }, prev.row);

  return { ok: true, sessionRow: log.getLastRow(), dayRow: prev.row > 0 ? prev.row : days.getLastRow() };
}

/** "2h 35m" — readable at a glance, which a raw minute count is not. */
function hhmm_(mins) {
  var m = Math.max(0, Math.round(Number(mins) || 0));
  var h = Math.floor(m / 60);
  return h ? h + 'h ' + (m % 60) + 'm' : m + 'm';
}

/** Parse "2h 35m" back to minutes, so a Day row can be added to without a hidden column. */
function minsFrom_(text) {
  var t = String(text || '');
  var h = /(\d+)\s*h/.exec(t);
  var m = /(\d+)\s*m/.exec(t);
  return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
}

/**
 * ⛔ THE NUMBER HE ACTUALLY MANAGES BY. Steven, on why the clock does not need policing: *"if they
 * try to log eight hours a day and only make 20 dials, the dial volume is what I'm going to bust
 * their balls about."* Time is a DENOMINATOR here — inflating it makes the row look worse, not
 * better — which is why there is no idle timeout anywhere in this feature.
 */
function perHour_(dials, mins) {
  if (!mins) return '';
  return Math.round((Number(dials) || 0) / (mins / 60) * 10) / 10;
}

/** Write a keyed row: `row` < 0 appends, otherwise overwrites that row. Columns self-create. */
function writeKeyed_(sheet, cols, values, row) {
  var lastCol = sheet.getLastColumn();
  var headerVals = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  var headerNotes = lastCol ? sheet.getRange(1, 1, 1, lastCol).getNotes()[0] : [];

  var out = [];
  cols.forEach(function (c) {
    var idx = headerNotes.indexOf(c.key);
    if (idx < 0) {
      idx = headerVals.length;
      sheet.getRange(1, idx + 1).setValue(c.label).setNote(c.key).setFontWeight('bold');
      headerVals.push(c.label);
      headerNotes.push(c.key);
    }
    while (out.length <= idx) out.push('');
    out[idx] = values[c.key] == null ? '' : values[c.key];
  });
  while (out.length < headerVals.length) out.push('');

  if (row > 1) sheet.getRange(row, 1, 1, out.length).setValues([out]);
  else sheet.appendRow(out);
  if (sheet.getFrozenRows() < 1) sheet.setFrozenRows(1);
}

/** Find a row by one or more keyed columns. Returns { row: -1 } when the sheet has no match. */
function findKeyed_(sheet, keys, wants) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return { row: -1, values: {} };

  var notes = sheet.getRange(1, 1, 1, lastCol).getNotes()[0];
  var idx = keys.map(function (k) { return notes.indexOf(k); });
  if (idx.some(function (i) { return i < 0; })) return { row: -1, values: {} };

  var grid = sheet.getRange(2, 1, lastRow - 1, lastCol).getDisplayValues();
  for (var r = 0; r < grid.length; r++) {
    var hit = true;
    for (var k = 0; k < idx.length; k++) {
      if (String(grid[r][idx[k]]).trim() !== String(wants[k]).trim()) { hit = false; break; }
    }
    if (!hit) continue;
    var values = {};
    for (var c = 0; c < notes.length; c++) if (notes[c]) values[notes[c]] = grid[r][c];
    return { row: r + 2, values: values };
  }
  return { row: -1, values: {} };
}

/** Set one cell by header name, adding the column at the end if the sheet has not got it. */
function setCell_(sheet, headers, row, header, value) {
  var idx = indexOfHeaderLike_(headers, [header.toLowerCase()]);
  if (idx < 0) {
    idx = headers.length;
    sheet.getRange(1, idx + 1).setValue(header).setFontWeight('bold');
    headers.push(header);
  }
  sheet.getRange(row, idx + 1).setValue(value);
}

/** Case-insensitive header lookup. Returns -1 when none of `names` is present. */
function indexOfHeaderLike_(headers, names) {
  for (var i = 0; i < headers.length; i++) {
    if (names.indexOf(String(headers[i] || '').trim().toLowerCase()) >= 0) return i;
  }
  return -1;
}

/**
 * Tell the owner a lead came in. A lead sitting unread in a spreadsheet is a lead lost — their
 * phone is the system, the row is the record, the email is the alert.
 * Onboarding never emails: she just filled it in, she knows what she said.
 * Payments never emails: Stripe already told Steven, and a duplicate alert is a false alarm.
 *
 * ⚠️ AN ALLOW-LIST, NOT A DENY-LIST. Written as "only Leads emails" rather than "not Onboarding"
 * so a tab added later is silent until somebody decides otherwise — the wrong default here mails
 * a customer's business owner about something that isn't a lead.
 */
function notify_(body, items, tab) {
  var to = String(body.notifyEmail || '').trim();
  if (!to || tab !== TAB_LEADS) return;

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
