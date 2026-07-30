/**
 * apply-webhook.gs — the Google Apps Script behind APPLY_WEBHOOK_URL.
 *
 * REPLACES the previous script wholesale. Paste over everything, save, then
 * Deploy > Manage deployments > (pencil) > Version: New version > Deploy.
 * ⚠️ Use "Manage deployments", NOT "New deployment" — a new deployment gets a
 * NEW URL and APPLY_WEBHOOK_URL in Vercel would still point at the old one.
 *
 * ── WHAT WENT WRONG WITH THE OLD ONE ────────────────────────────────────────
 * It appended a fresh column for every question label it hadn't seen in that
 * exact combination, instead of reusing the column already there. So one tab
 * ended up 22 columns wide with "Your name" in three of them, and every form
 * wrote into its own little island off to the right. Opening the sheet showed
 * columns A–M empty and looked like nothing had arrived — while the leads were
 * sitting in columns N through V the whole time.
 *
 * ── WHAT THIS ONE DOES ──────────────────────────────────────────────────────
 *  • ONE TAB PER SOURCE. Website-offer leads, discovery applications and
 *    podcast guests stop sharing a grid. A tab is created the first time that
 *    source appears.
 *  • COLUMNS MATCHED BY LABEL, case- and space-insensitive. A question that
 *    already has a column reuses it. A genuinely new question adds one column,
 *    once, at the end.
 *  • Nothing is ever overwritten and no existing tab is touched, so the old
 *    "New-Client" tab keeps its history exactly as it is.
 *  • Emails on every lead, and says loudly in the reply when something failed
 *    instead of returning a cheerful 200 over a lost enquiry.
 */

const EMAIL_TO = 'steven@stevenbarchetti.com';
const FALLBACK_TAB = 'Leads';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const answers = (data.answers || []).filter(function (a) {
      return a && String(a.label || '').trim();
    });
    if (!answers.length) return reply('error: no answers in payload');

    const received = data.submittedAt ? new Date(data.submittedAt) : new Date();
    const tab = tabNameFor(data, answers);

    appendLead(tab, received, answers, data);
    notify(tab, received, answers);

    return reply('ok');
  } catch (err) {
    // Surfaced in the reply on purpose. The caller checks the BODY, so a failure
    // here shows up as a failure instead of being swallowed behind a 200.
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

/** "/websites — $795 website offer" -> "Websites". Keeps each form in its own tab. */
function tabNameFor(data, answers) {
  var source = '';
  for (var i = 0; i < answers.length; i++) {
    if (String(answers[i].key || answers[i].label).toLowerCase() === 'source') {
      source = String(answers[i].value || '');
      break;
    }
  }
  var raw = source || data.site || '';
  raw = raw.split('—')[0].split('|')[0].replace(/^\//, '').trim();
  if (!raw) return FALLBACK_TAB;

  var name = raw
    .replace(/[\[\]:*?\/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 90);
  return name
    ? name.charAt(0).toUpperCase() + name.slice(1)
    : FALLBACK_TAB;
}

/** Labels differing only by case, spacing or a trailing colon are the SAME column. */
function norm(label) {
  return String(label || '')
    .toLowerCase()
    .replace(/[:?]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function appendLead(tabName, received, answers, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('script is not attached to a spreadsheet');

  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    sheet.appendRow(['Received', 'Website']);
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // label -> column index, so an existing question is never duplicated.
  var colOf = {};
  for (var c = 0; c < header.length; c++) {
    var key = norm(header[c]);
    if (key && colOf[key] === undefined) colOf[key] = c + 1;
  }
  if (colOf['received'] === undefined) colOf['received'] = 1;

  // Any genuinely new question gets ONE new column, appended once.
  var added = [];
  for (var i = 0; i < answers.length; i++) {
    var k = norm(answers[i].label);
    if (k && colOf[k] === undefined) {
      lastCol += 1;
      colOf[k] = lastCol;
      added.push({ col: lastCol, label: String(answers[i].label).trim() });
    }
  }
  for (var a = 0; a < added.length; a++) {
    sheet.getRange(1, added[a].col, 1, 1).setValue(added[a].label).setFontWeight('bold');
  }

  var row = new Array(lastCol).fill('');
  row[colOf['received'] - 1] = received;
  if (colOf['website'] !== undefined) row[colOf['website'] - 1] = data.site || '';
  for (var j = 0; j < answers.length; j++) {
    var col = colOf[norm(answers[j].label)];
    if (col) row[col - 1] = String(answers[j].value == null ? '' : answers[j].value);
  }

  sheet.appendRow(row);
}

function notify(tabName, received, answers) {
  var lines = [];
  for (var i = 0; i < answers.length; i++) {
    if (String(answers[i].value || '').trim()) {
      lines.push(answers[i].label + ': ' + answers[i].value);
    }
  }
  MailApp.sendEmail({
    to: EMAIL_TO,
    subject: 'New lead — ' + tabName,
    body: lines.join('\n') + '\n\nReceived: ' + received + '\nTab: ' + tabName,
  });
}
