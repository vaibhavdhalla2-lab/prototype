/**
 * FORMÉ feedback intake — Google Apps Script web app.
 *
 * Receives one JSON submission per POST from the FORMÉ frontend and appends
 * exactly one row to the bound Google Sheet. Deploy this as a web app
 * ("Execute as: Me", "Who has access: Anyone") and put the resulting /exec
 * URL into the app's VITE_FEEDBACK_ENDPOINT env var. See SETUP.md.
 *
 * This script intentionally holds no secrets — the deployment URL itself is
 * the only thing the frontend needs, and it only ever accepts a POST body.
 */

var SHEET_NAME = "Feedback";

var HEADERS = [
  "Timestamp",
  "Name",
  "Email",
  "Overall Rating",
  "Usage Intent",
  "Favourite Feature",
  "Purchase Intent",
  "Creator Intent",
  "Ease Of Use",
  "Excite More Than Clothing",
  "Exciting Outputs",
  "Liked Most",
  "Improvement",
  "Additional Feedback",
];

// Fields that must be present (non-empty) for a submission to be accepted.
var REQUIRED_FIELDS = ["rating", "usageIntent", "purchaseIntent", "creatorIntent", "easeOfUse"];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: "error", message: "Empty request body." });
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse({ status: "error", message: "Malformed JSON body." });
    }

    var missing = REQUIRED_FIELDS.filter(function (field) {
      var value = data[field];
      return value === null || value === undefined || value === "";
    });
    if (missing.length > 0) {
      return jsonResponse({ status: "error", message: "Missing required field(s): " + missing.join(", ") });
    }

    var row = [
      formatTimestamp(new Date()), // server-side timestamp — never trust the client's clock
      sanitize(data.name),
      sanitize(data.email),
      sanitize(data.rating),
      sanitize(data.usageIntent),
      sanitize(data.favouriteFeature),
      sanitize(data.purchaseIntent),
      sanitize(data.creatorIntent),
      sanitize(data.easeOfUse),
      sanitize(data.exciteMoreThanClothing),
      sanitize(data.excitingOutputs),
      sanitize(data.likedMost),
      sanitize(data.improvement),
      sanitize(data.additionalFeedback),
    ];

    appendRow(row);

    return jsonResponse({ status: "success" });
  } catch (err) {
    return jsonResponse({ status: "error", message: String(err && err.message ? err.message : err) });
  }
}

// Lets you open the deployment URL in a browser as a quick health check.
function doGet() {
  return jsonResponse({ status: "ok", message: "FORMÉ feedback endpoint is live. POST a submission to this URL." });
}

/** Appends a single row, guarded by a script lock so concurrent submissions can't race each other. */
function appendRow(row) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getOrCreateSheet();
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function formatTimestamp(date) {
  var tz = Session.getScriptTimeZone() || "Etc/UTC";
  return Utilities.formatDate(date, tz, "dd/MM/yyyy HH:mm");
}

/** Coerces to a plain string/number, trims text, and caps length so a bad actor can't paste a novel into a cell. */
function sanitize(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value;
  var str = String(value).trim();
  return str.length > 2000 ? str.slice(0, 2000) : str;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
