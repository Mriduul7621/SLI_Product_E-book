/**
 * ============================================================================
 *  Shanta Life — Learning Hub · Google Apps Script backend  (v3, unified)
 * ============================================================================
 *
 *  এই একটি স্ক্রিপ্টই তিনটি অ্যাপের ডেটাবেস চালায়:
 *     • ই-বুক / লার্নিং হাব  (লার্নার প্রোফাইল, মডিউল অগ্রগতি)
 *     • কুইজ পোর্টাল        (কুইজ ব্যাংক, শেয়ার লিংক, সাবমিশন)
 *     • প্রশ্ন/ফলাফল রিপোর্ট  (সুপারভাইজার, জোন, স্কোর)
 *
 *  সব ডেটা যায় **Learning Hub** স্প্রেডশিটেই। স্ক্রিপ্ট সেটি বাইন্ডেড
 *  স্প্রেডশিট না হলেও `HUB_SHEET_ID` দিয়ে খুলে নেয়, তাই কোনো আলাদা
 *  "score sheet" আর দরকার নেই।
 *
 *  ---------------------------------------------------------------------------
 *  সেটআপ (একবারই)
 *  ---------------------------------------------------------------------------
 *   1) Learning Hub স্প্রেডশিট খুলুন → Extensions → Apps Script
 *   2) পুরনো কোড মুছে এই ফাইলের পুরোটা পেস্ট করুন → Save (Ctrl+S)
 *   3) ফাংশন ড্রপডাউন থেকে `setupHubSheets` সিলেক্ট করে ▶ Run
 *      → প্রথমবার Authorization চাইবে → Review permissions → Allow
 *      (doPost / doGet রান করবেন না — ওগুলো ওয়েব অ্যাপ থেকে আসা রিকোয়েস্টের জন্য)
 *   4) Deploy → New deployment → Web app
 *        Execute as: Me      Who has access: Anyone
 *      → পাওয়া `.../exec` URL কপি করুন
 *   5) অ্যাপ খুলে অ্যাডমিন → সেটিংস → URL বসিয়ে "সেভ ও টেস্ট"
 *
 *  ---------------------------------------------------------------------------
 *  ট্যাব (স্বয়ংক্রিয়)
 *  ---------------------------------------------------------------------------
 *   Learners · Progress · Quizzes · Activations · Responses · Supervisors ·
 *   Zones · Meta
 *
 *   গুরুত্বপূর্ণ: স্ক্রিপ্ট **কিছু মুছে ফেলে না**। কোনও ট্যাব আগে থেকে থাকলে
 *   (যেমন Learning Hub-এর নিজের Progress/Employees) সেটির হেডার পড়ে নাম মিলিয়ে
 *   লেখা হয়, নতুন কলাম দরকার হলে ডান দিকে যোগ হয়। ফলে পুরনো ডেটা অটুট থাকে।
 *
 *  কোড বদলালে: Deploy → Manage deployments → Edit → New version → Deploy
 * ============================================================================
 */

/** Learning Hub স্প্রেডশিট — একটাই ডেটাবেস। */
var HUB_SHEET_ID = '1EYJwZDV99DPUcMWdC3LZP_7f1EyVJ2n-Yk_mb0k4Qnc';

var APP_VERSION = '3.0.0';
var MAX_ROWS = 5000; // প্রতি রেসপন্সে সর্বোচ্চ কত রেকর্ড ফেরত যাবে

/* ------------------------------------------------------------------ */
/* স্কিমা                                                             */
/* ------------------------------------------------------------------ */

var SCHEMA = {
  Learners: {
    aliases: ['Learner', 'Learners', 'Employees', 'Users', 'Employee'],
    fields: [
      { key: 'learnerId', header: 'LearnerID', aliases: ['Learner ID', 'User ID', 'Employee Code', 'Code'] },
      { key: 'name', header: 'Name', aliases: ['Full Name', 'Employee Name', 'Learner Name'] },
      { key: 'mobile', header: 'Mobile', aliases: ['Phone', 'Mobile No', 'Contact', 'Mobile Number'] },
      { key: 'employeeId', header: 'EmployeeID', aliases: ['Employee ID', 'Emp ID', 'Staff ID'] },
      { key: 'designation', header: 'Designation', aliases: ['Role', 'Position', 'Title'] },
      { key: 'supervisor', header: 'Supervisor', aliases: ['Supervisor Name', 'Line Manager'] },
      { key: 'zone', header: 'Zone', aliases: ['Branch', 'Region', 'Territory'] },
      { key: 'firstSeen', header: 'FirstSeen', aliases: ['Created At', 'Joined At'] },
      { key: 'lastSeen', header: 'LastSeen', aliases: ['Updated At', 'Last Active'] }
    ]
  },
  Progress: {
    aliases: ['Progress', 'Learner Progress', 'Module Progress', 'Course Progress'],
    fields: [
      { key: 'learnerId', header: 'LearnerID', aliases: ['Learner ID', 'User ID', 'Employee Code'] },
      { key: 'name', header: 'Name', aliases: ['Learner Name', 'Employee Name'] },
      { key: 'moduleId', header: 'ModuleID', aliases: ['Module', 'Module ID', 'Chapter', 'Chapter ID', 'Content ID'] },
      { key: 'moduleTitle', header: 'ModuleTitle', aliases: ['Module Title', 'Title', 'Chapter Title'] },
      { key: 'status', header: 'Status', aliases: ['State', 'Progress Status'] },
      { key: 'minutes', header: 'Minutes', aliases: ['Duration', 'Time', 'Reading Minutes'] },
      { key: 'updatedAt', header: 'UpdatedAt', aliases: ['Updated At', 'Last Updated', 'Completed At', 'Date'] }
    ]
  },
  Quizzes: {
    aliases: ['Quizzes', 'Quiz Bank', 'QuizBank', 'Questions'],
    fields: [
      { key: 'id', header: 'ID', aliases: ['Quiz ID', 'QuizID', 'Code'] },
      { key: 'title', header: 'Title', aliases: ['Quiz Title', 'Name'] },
      { key: 'product', header: 'Product', aliases: ['Module', 'Subject'] },
      { key: 'set', header: 'Set', aliases: ['Set Name', 'Group'] },
      { key: 'kind', header: 'Kind', aliases: ['Type', 'Quiz Type'] },
      { key: 'passMark', header: 'PassMark', aliases: ['Pass Mark', 'Passing Score'] },
      { key: 'questionsJson', header: 'QuestionsJSON', aliases: ['Questions', 'Questions JSON', 'Items'] },
      { key: 'origin', header: 'Origin', aliases: ['Source', 'Created By'] },
      { key: 'createdAt', header: 'CreatedAt', aliases: ['Created At', 'Date'] },
      { key: 'updatedAt', header: 'UpdatedAt', aliases: ['Updated At'] }
    ]
  },
  Activations: {
    aliases: ['Activations', 'Activation', 'Links', 'Share Links'],
    fields: [
      { key: 'slug', header: 'Slug', aliases: ['Link', 'Code', 'Activation Code'] },
      { key: 'quizId', header: 'QuizID', aliases: ['Quiz ID', 'ID'] },
      { key: 'quizTitle', header: 'QuizTitle', aliases: ['Quiz Title', 'Quiz'] },
      { key: 'purpose', header: 'Purpose', aliases: ['Reason', 'Note'] },
      { key: 'date', header: 'Date', aliases: ['Schedule', 'Start Date'] },
      { key: 'message', header: 'Message', aliases: ['Instructions', 'Note'] },
      { key: 'durationMinutes', header: 'DurationMinutes', aliases: ['Duration', 'Minutes', 'Time Limit'] },
      { key: 'status', header: 'Status', aliases: ['State'] },
      { key: 'createdAt', header: 'CreatedAt', aliases: ['Created At'] },
      { key: 'closedAt', header: 'ClosedAt', aliases: ['Closed At'] }
    ]
  },
  Responses: {
    aliases: ['Responses', 'Results', 'Submissions', 'Score Sheet', 'Scores'],
    fields: [
      { key: 'id', header: 'ID', aliases: ['Response ID', 'Attempt ID', 'Submission ID'] },
      { key: 'learnerId', header: 'LearnerID', aliases: ['Learner ID'] },
      { key: 'name', header: 'Name', aliases: ['Learner Name', 'Employee Name'] },
      { key: 'mobile', header: 'Mobile', aliases: ['Phone', 'Contact', 'Mobile No'] },
      { key: 'employeeId', header: 'EmployeeID', aliases: ['Employee ID', 'Emp ID', 'Code'] },
      { key: 'supervisor', header: 'Supervisor', aliases: ['Supervisor Name'] },
      { key: 'zone', header: 'Zone', aliases: ['Region', 'Branch'] },
      { key: 'quizId', header: 'QuizID', aliases: ['Quiz ID'] },
      { key: 'quizTitle', header: 'QuizTitle', aliases: ['Quiz', 'Quiz Title'] },
      { key: 'score', header: 'Score', aliases: ['Marks', 'Correct'] },
      { key: 'total', header: 'Total', aliases: ['Out Of', 'Total Marks'] },
      { key: 'percent', header: 'Percent', aliases: ['Percentage', 'Score %'] },
      { key: 'passed', header: 'Passed', aliases: ['Pass', 'Result'] },
      { key: 'answersJson', header: 'AnswersJSON', aliases: ['Answers JSON', 'Answers'] },
      { key: 'startedAt', header: 'StartedAt', aliases: ['Started At'] },
      { key: 'submittedAt', header: 'SubmittedAt', aliases: ['Submitted At', 'Timestamp', 'Date', 'Time'] },
      { key: 'durationSeconds', header: 'DurationSeconds', aliases: ['Duration', 'Time Taken'] },
      { key: 'sourceSlug', header: 'SourceSlug', aliases: ['Activation', 'Link', 'Slug'] }
    ]
  },
  Supervisors: {
    aliases: ['Supervisors', 'Supervisor', 'Managers'],
    fields: [{ key: 'name', header: 'Name', aliases: ['Supervisor', 'Manager'] }]
  },
  Zones: {
    aliases: ['Zones', 'Zone', 'Regions'],
    fields: [{ key: 'name', header: 'Name', aliases: ['Zone', 'Region'] }]
  },
  Admins: {
    aliases: ['Admins', 'Admin', 'Trainers', 'Admins List'],
    fields: [
      { key: 'email', header: 'Email', aliases: ['E-mail', 'Mail', 'User Principal Name', 'UPN', 'Admin Email'] },
      { key: 'name', header: 'Name', aliases: ['Display Name', 'Full Name'] },
      { key: 'addedAt', header: 'AddedAt', aliases: ['Added At', 'Date'] }
    ]
  },
  Meta: {
    aliases: ['Meta', 'Settings', 'Config'],
    fields: [
      { key: 'key', header: 'Key', aliases: ['Setting', 'Name'] },
      { key: 'value', header: 'Value', aliases: ['Data', 'Setting Value'] }
    ]
  }
};

/* ------------------------------------------------------------------ */
/* স্প্রেডশিট ও ট্যাব হেল্পার                                         */
/* ------------------------------------------------------------------ */

function hub_() {
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active && !HUB_SHEET_ID) return active;
  try {
    var byId = SpreadsheetApp.openById(HUB_SHEET_ID);
    if (byId) return byId;
  } catch (err) {
    // অনুমতি না থাকলে বাউন্ডেড শিটে ফলব্যাক
  }
  if (active) return active;
  throw new Error('Learning Hub স্প্রেডশিট খোলা যায়নি — HUB_SHEET_ID যাচাই করুন।');
}

function norm_(value) {
  return String(value == null ? '' : value)
    .toLowerCase()
    .replace(/[\s_\-\.\/()]+/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

/**
 * নাম মিলিয়ে ট্যাব খোঁজে; না পেলে তৈরি করে।
 * হেডার না থাকলে লিখে দেয়, থাকলে সেটাই ব্যবহার করে (নতুন কলাম শুধু দরকার হলে যোগ হয়)।
 */
function table_(name) {
  var spec = SCHEMA[name];
  var ss = hub_();
  var wanted = [name].concat(spec.aliases || []).map(norm_);

  var sheet = null;
  var existing = ss.getSheets();
  for (var i = 0; i < existing.length && !sheet; i++) {
    if (wanted.indexOf(norm_(existing[i].getName())) !== -1) sheet = existing[i];
  }
  if (!sheet) sheet = ss.insertSheet(name);

  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headerRow = sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  var existingNorm = headerRow.map(norm_);

  if (!headerRow.filter(String).length) {
    sheet.getRange(1, 1, 1, spec.fields.length).setValues([spec.fields.map(function (f) { return f.header; })]);
    sheet.setFrozenRows(1);
    headerRow = spec.fields.map(function (f) { return f.header; });
    existingNorm = headerRow.map(norm_);
  }

  // প্রতিটি ফিল্ডের কলাম খুঁজি (নাম বা alias মিলিয়ে), না পেলে ডানে যোগ করি
  var map = {};
  var nextCol = Math.max(headerRow.length, 1);
  spec.fields.forEach(function (field) {
    var candidates = [field.header].concat(field.aliases || []).map(norm_);
    var found = -1;
    for (var c = 0; c < existingNorm.length; c++) {
      if (existingNorm[c] && candidates.indexOf(existingNorm[c]) !== -1) {
        found = c;
        break;
      }
    }
    if (found === -1) {
      nextCol += 1;
      sheet.getRange(1, nextCol).setValue(field.header);
      sheet.getRange(1, nextCol).setFontWeight('bold');
      if (nextCol === 1) sheet.setFrozenRows(1);
      existingNorm[nextCol - 1] = norm_(field.header);
      found = nextCol - 1;
    }
    map[field.key] = found + 1; // 1-indexed
  });

  return { sheet: sheet, fields: spec.fields, map: map };
}

function readAll_(name) {
  var t = table_(name);
  var lastRow = t.sheet.getLastRow();
  if (lastRow < 2) return [];
  var width = t.sheet.getLastColumn();
  var values = t.sheet.getRange(2, 1, lastRow - 1, width).getValues();
  return values
    .map(function (row) {
      var obj = {};
      t.fields.forEach(function (f) {
        obj[f.key] = row[t.map[f.key] - 1];
      });
      return obj;
    })
    .filter(function (obj) {
      return Object.keys(obj).some(function (k) {
        return String(obj[k] || '').trim() !== '';
      });
    });
}

function appendObject_(name, obj) {
  var t = table_(name);
  var width = Math.max(t.sheet.getLastColumn(), 1);
  var row = new Array(width).fill('');
  t.fields.forEach(function (f) {
    var col = t.map[f.key];
    if (col) row[col - 1] = obj[f.key] == null ? '' : obj[f.key];
  });
  t.sheet.appendRow(row);
}

function updateObject_(name, rowNumber, obj) {
  var t = table_(name);
  var width = Math.max(t.sheet.getLastColumn(), 1);
  var current = t.sheet.getRange(rowNumber, 1, 1, width).getValues()[0];
  t.fields.forEach(function (f) {
    var col = t.map[f.key];
    if (col && obj[f.key] !== undefined) current[col - 1] = obj[f.key];
  });
  t.sheet.getRange(rowNumber, 1, 1, width).setValues([current]);
}

/** key ফিল্ডের মান মিলিয়ে আপডেট, না পেলে নতুন রো। রিটার্ন: rowNumber। */
function upsert_(name, keyField, keyValue, obj) {
  var t = table_(name);
  var lastRow = t.sheet.getLastRow();
  var col = t.map[keyField];
  if (lastRow >= 2 && col) {
    var keys = t.sheet.getRange(2, col, lastRow - 1, 1).getValues();
    for (var i = 0; i < keys.length; i++) {
      if (String(keys[i][0]).trim() === String(keyValue).trim()) {
        updateObject_(name, i + 2, obj);
        return i + 2;
      }
    }
  }
  appendObject_(name, obj);
  return t.sheet.getLastRow();
}

/** দুটি কলাম মিলিয়ে আপডেট/ইনসার্ট — যেমন LearnerID + ModuleID। */
function upsertComposite_(name, keyFields, keyValues, obj) {
  var t = table_(name);
  var cols = keyFields.map(function (k) { return t.map[k]; });
  if (cols.some(function (c) { return !c; })) return upsert_(name, keyFields[0], keyValues[0], obj);

  var lastRow = t.sheet.getLastRow();
  if (lastRow >= 2) {
    var width = Math.max.apply(null, cols);
    var data = t.sheet.getRange(2, 1, lastRow - 1, Math.max(width, t.sheet.getLastColumn())).getValues();
    for (var i = 0; i < data.length; i++) {
      var match = cols.every(function (col, idx) {
        return String(data[i][col - 1]).trim() === String(keyValues[idx]).trim();
      });
      if (match) {
        updateObject_(name, i + 2, obj);
        return i + 2;
      }
    }
  }
  appendObject_(name, obj);
  return t.sheet.getLastRow();
}

function listOf_(name) {
  return readAll_(name)
    .map(function (r) { return String(r.name || '').trim(); })
    .filter(String);
}

function setList_(name, values) {
  var t = table_(name);
  var lastRow = t.sheet.getLastRow();
  if (lastRow > 1) t.sheet.getRange(2, 1, lastRow - 1, Math.max(t.sheet.getLastColumn(), 1)).clearContent();
  (values || []).forEach(function (value) {
    var clean = String(value || '').trim();
    if (clean) appendObject_(name, { name: clean });
  });
}

/* ------------------------------------------------------------------ */
/* ছোট ইউটিলিটি                                                       */
/* ------------------------------------------------------------------ */

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function nowIso_() {
  return new Date().toISOString();
}

function today_() {
  return Utilities.formatDate(new Date(), 'Asia/Dhaka', 'yyyy-MM-dd');
}

function toBool_(value) {
  return value === true || String(value).toLowerCase() === 'true' || String(value) === '1';
}

function safeJson_(text, fallback) {
  try {
    var parsed = JSON.parse(text || '');
    return parsed == null ? fallback : parsed;
  } catch (err) {
    return fallback;
  }
}

/* ------------------------------------------------------------------ */
/* সেটআপ                                                              */
/* ------------------------------------------------------------------ */

/** ▶ এডিটর থেকে এটিই রান করুন — সব ট্যাব ও হেডার তৈরি/যাচাই হয়। */
function setupHubSheets() {
  var ss = hub_();
  Object.keys(SCHEMA).forEach(function (name) {
    table_(name);
  });

  if (readAll_('Supervisors').length === 0) {
    setList_('Supervisors', ['উদাহরণ: Md. Ariful Islam', 'উদাহরণ: Fatema Begum']);
  }
  if (readAll_('Zones').length === 0) {
    setList_('Zones', ['ঢাকা উত্তর', 'ঢাকা দক্ষিণ', 'চট্টগ্রাম', 'সিলেট', 'রাজশাহী']);
  }
  upsert_('Meta', 'key', 'schemaVersion', { key: 'schemaVersion', value: APP_VERSION });
  upsert_('Meta', 'key', 'installedAt', { key: 'installedAt', value: nowIso_() });

  // স্ক্রিপ্ট চালানো ব্যক্তিকে প্রথম অ্যাডমিন হিসেবে যোগ করা হয়, নাহলে
  // অ্যাডমিন লগইন চালু করার পরেও কেউ ঢুকতে পারবে না।
  if (readAll_('Admins').length === 0) {
    var owner = '';
    try {
      owner = String(Session.getEffectiveUser().getEmail() || '');
    } catch (ignore) {}
    if (owner) {
      upsert_('Admins', 'email', owner.toLowerCase(), {
        email: owner.toLowerCase(),
        name: owner.split('@')[0],
        addedAt: nowIso_()
      });
    }
  }

  var tabs = ss.getSheets().map(function (s) { return s.getName(); });
  Logger.log('✅ setupHubSheets সম্পন্ন। ট্যাব: ' + tabs.join(', '));
  return 'OK — ' + tabs.length + ' টি ট্যাব প্রস্তুত';
}

/**
 * ▶ এডিটর থেকে একবার রান করুন — Microsoft (Entra ID) সাইন-ইন কনফিগার করতে।
 *
 *   setAuthConfig('আপনার-Tenant-ID', 'আপনার-Client-ID', 'shantalife.com')
 *
 * Tenant ID / Client ID পাবেন: Entra admin center → App registrations →
 * আপনার অ্যাপ → Overview। Client ID আর Tenant ID গোপন তথ্য নয় — ব্রাউজার
 * এগুলো পড়ে, তাই শিটে রাখা নিরাপদ।
 */
function setAuthConfig(tenantId, clientId, adminDomain) {
  if (!tenantId || !clientId) throw new Error('tenantId এবং clientId দুটোই দিতে হবে');
  upsert_('Meta', 'key', 'authTenantId', { key: 'authTenantId', value: String(tenantId).trim() });
  upsert_('Meta', 'key', 'authClientId', { key: 'authClientId', value: String(clientId).trim() });
  upsert_('Meta', 'key', 'adminDomain', { key: 'adminDomain', value: String(adminDomain || '').trim().toLowerCase() });
  Logger.log('✅ Microsoft sign-in কনফিগার হয়েছে।');
  return 'OK';
}

/** এডিটর থেকে সাবমিশন ফ্লো টেস্ট (ঐচ্ছিক)। */
function testSubmit() {
  var res = doPost({
    postData: {
      contents: JSON.stringify({
        action: 'submit',
        attempt: {
          id: 'test-' + Date.now(),
          learnerName: 'Test User',
          mobile: '01700000000',
          employeeId: 'TEST-1',
          supervisor: 'Test Supervisor',
          zone: 'ঢাকা উত্তর',
          quizId: 'check-endowment',
          quizTitle: 'Demo Quiz',
          score: 1,
          total: 1,
          percent: 100,
          passed: true,
          answers: {},
          startedAt: nowIso_(),
          submittedAt: nowIso_(),
          durationSeconds: 42
        }
      })
    }
  });
  Logger.log(res.getContent());
}

/**
 * একই লার্নারের একাধিক পরিচয় (learnerId / mobile / employeeId) থেকে ম্যাচিং কী-এর তালিকা।
 * এতে প্রোফাইল পরে সম্পূর্ণ হলেও আগের অগ্রগতি ও ফলাফল খুঁজে পাওয়া যায়।
 */
function learnerAliases_(learnerId) {
  var key = String(learnerId || '').trim().toLowerCase();
  var aliases = {};
  if (key) aliases[key] = true;

  readAll_('Learners').forEach(function (l) {
    var ids = [l.learnerId, l.mobile, l.employeeId]
      .map(function (v) { return String(v || '').trim().toLowerCase(); })
      .filter(String);
    if (key && ids.indexOf(key) === -1) return;
    ids.forEach(function (id) { aliases[id] = true; });
  });
  return Object.keys(aliases);
}

function belongsTo_(rowLearnerId, aliases) {
  return aliases.indexOf(String(rowLearnerId || '').trim().toLowerCase()) !== -1;
}

/** লার্নার রেকর্ড তৈরি/হালনাগাদ (একাধিক এন্ট্রি-পয়েন্ট থেকে ব্যবহৃত)। */
function registerLearner_(learner, explicitId) {
  learner = learner || {};
  var id = String(explicitId || learner.learnerId || learner.employeeId || learner.mobile || learner.name || '')
    .trim()
    .toLowerCase();
  if (!id) return '';

  var existing = readAll_('Learners').filter(function (l) {
    return String(l.learnerId || '').trim().toLowerCase() === id;
  })[0];

  upsert_('Learners', 'learnerId', id, {
    learnerId: id,
    name: learner.name || (existing && existing.name) || '',
    mobile: learner.mobile || (existing && existing.mobile) || '',
    employeeId: learner.employeeId || (existing && existing.employeeId) || '',
    designation: learner.designation || (existing && existing.designation) || '',
    supervisor: learner.supervisor || (existing && existing.supervisor) || '',
    zone: learner.zone || (existing && existing.zone) || '',
    firstSeen: (existing && existing.firstSeen) || nowIso_(),
    lastSeen: nowIso_()
  });
  return id;
}

/* ------------------------------------------------------------------ */
/* অ্যাডমিন প্রমাণীকরণ (Microsoft Entra ID)                          */
/* ------------------------------------------------------------------ */

var SESSION_HOURS = 8;
var SESSION_PREFIX = 'sess_';

function metaValue_(key) {
  var row = readAll_('Meta').filter(function (m) {
    return String(m.key || '').trim() === key;
  })[0];
  return row ? String(row.value || '').trim() : '';
}

function authConfig_() {
  return {
    tenantId: metaValue_('authTenantId'),
    clientId: metaValue_('authClientId'),
    domain: metaValue_('adminDomain').toLowerCase()
  };
}

function adminEmails_() {
  return readAll_('Admins')
    .map(function (a) { return String(a.email || '').trim().toLowerCase(); })
    .filter(String);
}

/** Microsoft Graph দিয়ে টোকেন বৈধ কিনা যাচাই করে ইমেইল ফেরত দেয়। */
function verifyMicrosoftToken_(accessToken) {
  if (!accessToken) throw new Error('অ্যাক্সেস টোকেন নেই');
  var res = UrlFetchApp.fetch(
    'https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName,displayName',
    {
      method: 'get',
      headers: { Authorization: 'Bearer ' + accessToken },
      muteHttpExceptions: true
    }
  );
  var code = res.getResponseCode();
  if (code !== 200) throw new Error('Microsoft টোকেন যাচাই ব্যর্থ (HTTP ' + code + ')');
  var data = safeJson_(res.getContentText(), {});
  var email = String(data.mail || data.userPrincipalName || '').trim().toLowerCase();
  if (!email) throw new Error('অ্যাকাউন্টের ইমেইল পাওয়া যায়নি');
  return { email: email, name: String(data.displayName || '') };
}

function createSession_(email, name) {
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
  var expiresAt = new Date(Date.now() + SESSION_HOURS * 3600 * 1000).toISOString();
  PropertiesService.getScriptProperties().setProperty(
    SESSION_PREFIX + token,
    JSON.stringify({ email: email, name: name, expiresAt: expiresAt })
  );
  return { token: token, expiresAt: expiresAt };
}

/** সেশন টোকেন যাচাই — অবৈধ হলে null। */
function readSession_(token) {
  if (!token) return null;
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty(SESSION_PREFIX + String(token));
  if (!raw) return null;
  var session = safeJson_(raw, null);
  if (!session) return null;
  if (Date.parse(session.expiresAt) < Date.now()) {
    props.deleteProperty(SESSION_PREFIX + String(token));
    return null;
  }
  return session;
}

/**
 * অ্যাডমিন action-গুলোর জন্য বাধ্যতামূলক গেট।
 * Admins তালিকা খালি থাকলে (সেটআপের আগে) কিছুই আটকায় না — তাতে প্রথম
 * ইনস্টলেশন আটকে না যায়; একবার Admins ভরে গেলে সব কড়া হয়ে যায়।
 */
function requireAdmin_(body) {
  if (adminEmails_().length === 0) return { open: true };
  var session = readSession_(body && body.sessionToken);
  if (!session) {
    var err = new Error('অ্যাডমিন সেশন নেই বা মেয়াদ শেষ — আবার সাইন-ইন করুন');
    err.status = 401;
    throw err;
  }
  return { open: false, session: session };
}

/* ------------------------------------------------------------------ */
/* GET API                                                            */
/* ------------------------------------------------------------------ */

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var action = (params.action || 'bootstrap').toLowerCase();

    if (action === 'health') {
      var ss = hub_();
      return json_({
        ok: true,
        app: 'Shanta Life Learning Hub',
        version: APP_VERSION,
        sheets: ss.getSheets().map(function (s) { return s.getName(); }),
        learners: readAll_('Learners').length,
        quizzes: readAll_('Quizzes').length,
        responses: readAll_('Responses').length,
        time: nowIso_()
      });
    }

    if (action === 'bootstrap' || action === 'catalog') {
      var learnerId = String(params.learnerId || '').trim().toLowerCase();
      var aliases = learnerAliases_(learnerId);
      var quizzes = readAll_('Quizzes').map(parseQuiz_);
      var activations = readAll_('Activations').map(parseActivation_);
      var progress = learnerId
        ? readAll_('Progress').filter(function (p) { return belongsTo_(p.learnerId, aliases); })
        : [];
      var results = learnerId
        ? readAll_('Responses')
            .filter(function (r) { return belongsTo_(r.learnerId, aliases); })
            .map(parseResponse_)
        : [];
      return json_({
        ok: true,
        version: APP_VERSION,
        auth: authConfig_(),
        adminRequired: adminEmails_().length > 0,
        quizzes: quizzes,
        activations: activations,
        supervisors: listOf_('Supervisors'),
        zones: listOf_('Zones'),
        progress: progress.map(function (p) {
          return {
            moduleId: String(p.moduleId || '').trim(),
            status: String(p.status || 'not_started').trim() || 'not_started',
            minutes: Number(p.minutes) || 0,
            updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt || ''),
            synced: true
          };
        }),
        results: results
      });
    }

    if (action === 'results') {
      var limit = Math.min(Number(params.limit) || MAX_ROWS, MAX_ROWS);
      var rows = readAll_('Responses').map(parseResponse_);
      rows.sort(function (a, b) { return String(b.submittedAt).localeCompare(String(a.submittedAt)); });
      return json_({ ok: true, results: rows.slice(0, limit) });
    }

    if (action === 'supervisors') {
      return json_({ ok: true, supervisors: listOf_('Supervisors'), zones: listOf_('Zones') });
    }

    if (action === 'learner') {
      var key = String(params.learnerId || '').trim().toLowerCase();
      var aliases2 = learnerAliases_(key);
      var found = readAll_('Learners').filter(function (l) {
        return (
          aliases2.indexOf(String(l.learnerId || '').trim().toLowerCase()) !== -1 ||
          aliases2.indexOf(String(l.mobile || '').trim().toLowerCase()) !== -1 ||
          aliases2.indexOf(String(l.employeeId || '').trim().toLowerCase()) !== -1
        );
      })[0];
      return json_({ ok: true, learner: found || null });
    }

    return json_({ ok: false, error: 'অজানা action: ' + action });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

/* ------------------------------------------------------------------ */
/* POST API                                                           */
/* ------------------------------------------------------------------ */

function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return json_({ ok: false, error: 'doPost সরাসরি রান করার জন্য নয়। setupHubSheets রান করুন।' });
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
    var body = safeJson_(e.postData.contents, {});
    var action = String(body.action || 'submit');

    if (action === 'adminLogin') {
      var cfg = authConfig_();
      var identity = verifyMicrosoftToken_(body.accessToken);
      if (cfg.domain && identity.email.split('@')[1] !== cfg.domain) {
        return json_({ ok: false, code: 403, error: 'এই অ্যাকাউন্ট (' + identity.email + ') অনুমোদিত ডোমেইনের নয়' });
      }
      var allowed = adminEmails_();
      if (allowed.length && allowed.indexOf(identity.email) === -1) {
        return json_({ ok: false, code: 403, error: identity.email + ' অ্যাডমিন তালিকায় নেই' });
      }
      // First sign-in on a fresh sheet becomes the first admin (documented).
      if (!allowed.length) {
        upsert_('Admins', 'email', identity.email, {
          email: identity.email,
          name: identity.name,
          addedAt: nowIso_()
        });
      }
      var session = createSession_(identity.email, identity.name);
      return json_({
        ok: true,
        token: session.token,
        expiresAt: session.expiresAt,
        admin: { email: identity.email, name: identity.name }
      });
    }

    if (action === 'adminSession') {
      var current = readSession_(body.sessionToken);
      return current
        ? json_({ ok: true, admin: { email: current.email, name: current.name, expiresAt: current.expiresAt } })
        : json_({ ok: false, code: 401, error: 'সেশন নেই বা মেয়াদ শেষ' });
    }

    if (action === 'adminLogout') {
      if (body.sessionToken) {
        PropertiesService.getScriptProperties().deleteProperty(SESSION_PREFIX + String(body.sessionToken));
      }
      return json_({ ok: true });
    }

    if (action === 'registerLearner') {
      var learner = body.learner || {};
      var id = registerLearner_(learner, body.learnerId);
      if (!id) return json_({ ok: false, error: 'learnerId প্রয়োজন' });
      return json_({ ok: true, learnerId: id });
    }

    if (action === 'saveProgress') {
      var entries = body.entries || [];
      var learnerId = String(body.learnerId || '').trim().toLowerCase();
      var who = body.learner || {};
      var saved = 0;
      entries.forEach(function (entry) {
        if (!entry || !entry.moduleId || !learnerId) return;
        upsertComposite_('Progress', ['learnerId', 'moduleId'], [learnerId, entry.moduleId], {
          learnerId: learnerId,
          name: who.name || '',
          moduleId: entry.moduleId,
          moduleTitle: entry.moduleTitle || '',
          status: entry.status || 'in_progress',
          minutes: Number(entry.minutes) || 0,
          updatedAt: entry.updatedAt || nowIso_()
        });
        saved += 1;
      });
      return json_({ ok: true, saved: saved });
    }

    if (action === 'submit') {
      var attempt = body.attempt || body;
      if (!attempt || !attempt.quizId) return json_({ ok: false, error: 'attempt.quizId প্রয়োজন' });
      var attemptId = attempt.id || ('att-' + Date.now());
      upsert_('Responses', 'id', attemptId, {
        id: attemptId,
        learnerId: String(attempt.learnerId || attempt.employeeId || attempt.mobile || attempt.learnerName || '')
          .trim()
          .toLowerCase(),
        name: attempt.learnerName || attempt.name || '',
        mobile: attempt.mobile || '',
        employeeId: attempt.employeeId || '',
        supervisor: attempt.supervisor || '',
        zone: attempt.zone || '',
        quizId: attempt.quizId,
        quizTitle: attempt.quizTitle || '',
        score: Number(attempt.score) || 0,
        total: Number(attempt.total) || 0,
        percent: Number(attempt.percent) || 0,
        passed: toBool_(attempt.passed),
        answersJson: JSON.stringify(attempt.answers || {}),
        startedAt: attempt.startedAt || '',
        submittedAt: attempt.submittedAt || nowIso_(),
        durationSeconds: Number(attempt.durationSeconds) || 0,
        sourceSlug: attempt.sourceSlug || ''
      });

      // নাম-মোবাইল থাকলে লার্নার তালিকাও হালনাগাদ করি
      if (attempt.learnerName) {
        registerLearner_({
          name: attempt.learnerName,
          mobile: attempt.mobile,
          employeeId: attempt.employeeId,
          supervisor: attempt.supervisor,
          zone: attempt.zone
        });
      }
      return json_({ ok: true, submitted: attemptId });
    }

    if (action === 'saveQuiz' && body.quiz) {
      requireAdmin_(body);
      var quiz = body.quiz;
      if (!quiz.id) return json_({ ok: false, error: 'quiz.id প্রয়োজন' });
      upsert_('Quizzes', 'id', quiz.id, {
        id: quiz.id,
        title: quiz.title || '',
        product: quiz.product || '',
        set: quiz.set || '',
        kind: quiz.kind || 'quiz',
        passMark: Number(quiz.passMark) || 60,
        questionsJson: JSON.stringify(normalizeQuestions_(quiz.questions || [])),
        origin: quiz.origin || 'custom',
        createdAt: quiz.createdAt || nowIso_(),
        updatedAt: nowIso_()
      });
      return json_({ ok: true, saved: quiz.id });
    }

    if (action === 'deleteQuiz' && body.id) {
      requireAdmin_(body);
      var sheet = table_('Quizzes');
      var idCol = sheet.map.id;
      var lastRow = sheet.sheet.getLastRow();
      for (var r = lastRow; r >= 2; r--) {
        if (String(sheet.sheet.getRange(r, idCol).getValue()).trim() === String(body.id).trim()) {
          sheet.sheet.deleteRow(r);
        }
      }
      return json_({ ok: true, deleted: body.id });
    }

    if (action === 'activate' && body.activation) {
      requireAdmin_(body);
      var act = body.activation;
      if (!act.slug) return json_({ ok: false, error: 'activation.slug প্রয়োজন' });
      upsert_('Activations', 'slug', act.slug, {
        slug: act.slug,
        quizId: act.quizId || '',
        quizTitle: act.quizTitle || '',
        purpose: act.purpose || '',
        date: act.date || today_(),
        message: act.message || '',
        durationMinutes: Number(act.durationMinutes) || 0,
        status: act.status || 'active',
        createdAt: act.createdAt || nowIso_(),
        closedAt: act.closedAt || ''
      });
      return json_({ ok: true, slug: act.slug });
    }

    if (action === 'closeActivation' || action === 'reopenActivation') {
      requireAdmin_(body);
      var closing = action === 'closeActivation';
      var t = table_('Activations');
      var last = t.sheet.getLastRow();
      for (var row = 2; row <= last; row++) {
        if (String(t.sheet.getRange(row, t.map.slug).getValue()).trim() === String(body.slug).trim()) {
          t.sheet.getRange(row, t.map.status).setValue(closing ? 'closed' : 'active');
          t.sheet.getRange(row, t.map.closedAt).setValue(closing ? nowIso_() : '');
          return json_({ ok: true, slug: body.slug, status: closing ? 'closed' : 'active' });
        }
      }
      return json_({ ok: false, error: 'activation পাওয়া যায়নি' });
    }

    if (action === 'saveLists') {
      requireAdmin_(body);
      if (body.supervisors) setList_('Supervisors', body.supervisors);
      if (body.zones) setList_('Zones', body.zones);
      return json_({ ok: true, supervisors: listOf_('Supervisors'), zones: listOf_('Zones') });
    }

    if (action === 'saveLearnerAdmin') {
      requireAdmin_(body);
      var l = body.learner || {};
      var lid = String(l.learnerId || l.employeeId || l.mobile || '').trim().toLowerCase();
      if (!lid) return json_({ ok: false, error: 'learnerId প্রয়োজন' });
      upsert_('Learners', 'learnerId', lid, {
        learnerId: lid,
        name: l.name || '',
        mobile: l.mobile || '',
        employeeId: l.employeeId || '',
        designation: l.designation || '',
        supervisor: l.supervisor || '',
        zone: l.zone || '',
        firstSeen: nowIso_(),
        lastSeen: nowIso_()
      });
      return json_({ ok: true, learnerId: lid });
    }

    return json_({ ok: false, error: 'অজানা action: ' + action });
  } catch (err) {
    return json_({
      ok: false,
      code: err && err.status ? err.status : 500,
      error: String(err && err.message ? err.message : err)
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (ignore) {}
  }
}

/* ------------------------------------------------------------------ */
/* পার্সার                                                             */
/* ------------------------------------------------------------------ */

function parseQuiz_(row) {
  var questions = safeJson_(row.questionsJson, []);
  return {
    id: String(row.id || ''),
    title: String(row.title || ''),
    product: String(row.product || ''),
    set: String(row.set || ''),
    kind: String(row.kind || 'quiz'),
    passMark: Number(row.passMark) || 60,
    questions: normalizeQuestions_(questions),
    origin: String(row.origin || 'custom') === 'builtin' ? 'builtin' : 'custom',
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt || '')
  };
}

function parseActivation_(row) {
  return {
    slug: String(row.slug || ''),
    quizId: String(row.quizId || ''),
    quizTitle: String(row.quizTitle || ''),
    purpose: String(row.purpose || ''),
    date: row.date instanceof Date ? Utilities.formatDate(row.date, 'Asia/Dhaka', 'yyyy-MM-dd') : String(row.date || ''),
    message: String(row.message || ''),
    durationMinutes: Number(row.durationMinutes) || 0,
    status: String(row.status || 'active') === 'closed' ? 'closed' : 'active',
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt || '')
  };
}

function parseResponse_(row) {
  return {
    id: String(row.id || ''),
    quizId: String(row.quizId || ''),
    quizTitle: String(row.quizTitle || ''),
    learnerName: String(row.name || ''),
    mobile: String(row.mobile || ''),
    employeeId: String(row.employeeId || ''),
    supervisor: String(row.supervisor || ''),
    zone: String(row.zone || ''),
    score: Number(row.score) || 0,
    total: Number(row.total) || 0,
    percent: Number(row.percent) || 0,
    passed: toBool_(row.passed),
    answers: safeJson_(row.answersJson, {}),
    startedAt: row.startedAt instanceof Date ? row.startedAt.toISOString() : String(row.startedAt || ''),
    submittedAt: row.submittedAt instanceof Date ? row.submittedAt.toISOString() : String(row.submittedAt || ''),
    durationSeconds: Number(row.durationSeconds) || 0,
    synced: true
  };
}

/** একই সেটে একই প্রশ্ন দুবার ঢুকলে বাদ দেয়। */
function normalizeQuestions_(questions) {
  var seen = {};
  var out = [];
  (questions || []).forEach(function (q, index) {
    if (!q || !q.prompt) return;
    var key = String(q.prompt)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (seen[key]) return;
    seen[key] = true;
    out.push({
      id: q.id || 'q' + (index + 1),
      prompt: String(q.prompt),
      options: (q.options || []).map(String),
      correct: Number(q.correct) || 0,
      explanation: q.explanation ? String(q.explanation) : '',
      type: q.type || 'MCQ'
    });
  });
  return out;
}
