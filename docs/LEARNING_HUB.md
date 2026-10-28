# Shanta Life Learning Hub — সেটআপ ও পরিচালনা নির্দেশিকা

এই ডকুমেন্টটি ট্রেইনার/অ্যাডমিনের জন্য। লার্নার শুধু লিংক খুলে ব্যবহার করবে —
কোনো ইনস্টল, লগইন বা অ্যাপ স্টোর দরকার নেই।

---

## ১. তিনটি অ্যাপ, এখন একটি

| আগে | ছিল | এখন |
| --- | --- | --- |
| ই-বুক (এই রিপো) | পড়া, PDF/Word ডাউনলোড | `/library`, `/book` — মডিউলভিত্তিক পড়া, অগ্রগতি সহ |
| Quiz Portal | কুইজ তৈরি, শেয়ার লিংক, স্কোর | `/assessment`, `/admin` — একই ফ্লো, নতুন ডিজাইন; পুরনো পোর্টালের ১৯টি প্রশ্ন ব্যাংকও যুক্ত |
| Learning Hub | শেখার অগ্রগতি ও ডেটাবেস | হোম ড্যাশবোর্ড + `Progress` ট্যাব |

তিনটির ডেটাবেসও এক হয়েছে: **কোনো আলাদা "score sheet" নেই**, সব লেখা হয়
Learning Hub স্প্রেডশিটেই (`1EYJwZDV99DPUcMWdC3LZP_7f1EyVJ2n-Yk_mb0k4Qnc`)।

---

## ২. আর্কিটেকচার

```
 ব্রাউজার (লার্নার / ট্রেইনার)
   │   React SPA — static build (Vercel)
   │   localStorage: অফলাইন ফার্স্ট স্টোর + সিঙ্ক কিউ
   ▼
 Google Apps Script Web App  (apps-script/Code.gs)
   │   GET  ?action=health|bootstrap|results|supervisors|learner
   │   POST action=submit|saveProgress|saveQuiz|activate|…
   ▼
 Learning Hub Spreadsheet
   Learners · Progress · Quizzes · Activations · Responses · Supervisors · Zones · Meta
```

**কেন অফলাইন-ফার্স্ট:** মাঠে নেটওয়ার্ক দুর্বল। প্রতিটি কাজ আগে ব্রাউজারে জমা হয়,
তারপর শিটে যায়। ব্যর্থ হলে কিউ-তে থাকে এবং পরেরবার স্বয়ংক্রিয়ভাবে পাঠানো হয়।
কোনো ডেটা হারায় না, কোনো ডুপ্লিকেটও হয় না (আইডি দিয়ে upsert)।

---

## ৩. রুট (URL)

| রুট | কী আছে |
| --- | --- |
| `/` | লার্নার ড্যাশবোর্ড — অগ্রগতি রিং, লার্নিং পাথ, পরবর্তী মডিউল, খোলা অ্যাসেসমেন্ট, সাম্প্রতিক ফলাফল |
| `/library` | ১৩টি মডিউল, পার্ট ও কীওয়ার্ড ফিল্টার, অগ্রগতি ও সেরা স্কোর |
| `/library/<id>` | একটি মডিউল (গল্প → ব্যাখ্যা → রেড অ্যালার্ট → কুইজ → গোল্ডেন রুল → প্লেবুক) + "সম্পন্ন" |
| `/book` | সম্পূর্ণ ই-বুক এক পাতায় (সূচিপত্র, প্রিন্ট, PDF/Word) |
| `/assessment` | শেয়ার করা অ্যাসেসমেন্ট, বড় সেট, অধ্যায়ভিত্তিক যাচাই |
| `/assessment/take/<quizId>` | কুইজ রানার (টাইমার, প্রশ্ন প্যালেট, রিভিউ) |
| `/assessment/result/<attemptId>` | স্কোর, ব্যাখ্যা, দুর্বল অধ্যায়ের সাজেশন |
| `/profile` | প্রোফাইল, ব্যাজ, পার্টভিত্তিক অগ্রগতি, ফলাফলের ইতিহাস |
| `/admin` | ট্রেইনার কনসোল (পিন: **2468**) |
| `/?slug=<slug>` | শেয়ার লিংক — সরাসরি নির্ধারিত কুইজ খোলে |

> পিনটি শুধু স্ক্রিন-লেভেল গার্ড। আসল নিরাপত্তা নির্ভর করে স্প্রেডশিটের শেয়ার
> সেটিংস ও Apps Script ডিপ্লয়মেন্টের "Who has access" এর উপর।

---

## ৪. স্প্রেডশিট স্কিমা (স্বয়ংক্রিয়)

`setupHubSheets` চালালে নিচের ট্যাবগুলো তৈরি/যাচাই হয়। **আগে থেকে থাকা ট্যাব
মুছে ফেলা হয় না** — হেডার পড়ে নাম মিলিয়ে লেখা হয়, নতুন কলাম দরকার হলে ডান দিকে যোগ হয়।

| ট্যাব | প্রধান কলাম |
| --- | --- |
| `Learners` | LearnerID · Name · Mobile · EmployeeID · Designation · Supervisor · Zone · FirstSeen · LastSeen |
| `Progress` | LearnerID · Name · ModuleID · ModuleTitle · Status · Minutes · UpdatedAt |
| `Quizzes` | ID · Title · Product · Set · Kind · PassMark · QuestionsJSON · Origin · CreatedAt · UpdatedAt |
| `Activations` | Slug · QuizID · QuizTitle · Purpose · Date · Message · DurationMinutes · Status · CreatedAt · ClosedAt |
| `Responses` | ID · LearnerID · Name · Mobile · EmployeeID · Supervisor · Zone · QuizID · QuizTitle · Score · Total · Percent · Passed · AnswersJSON · StartedAt · SubmittedAt · DurationSeconds · SourceSlug |
| `Supervisors` | Name |
| `Zones` | Name |
| `Meta` | Key · Value (schema version, install time) |

**হেডার নাম ভিন্ন হলেও চলে।** উদাহরণ: Learning Hub-এর পুরনো `Progress` ট্যাবে যদি
`Employee Code / Module / State` লেখা থাকে, স্ক্রিপ্ট সেই কলামেই লিখবে
(`Employee Code → LearnerID`, `Module → ModuleID`, `State → Status`)। কোনো কলাম
না মিললে সেটি ডান দিকে নতুন করে যোগ হয়, পুরনো ডেটা অটুট থাকে।

`Progress`-এ `LearnerID` কলামে লার্নারের কী থাকে (employee ID → mobile → name ক্রমে)।
সার্ভার employee ID, মোবাইল ও learner ID — তিনটিকেই এক লার্নারের alias হিসেবে ধরে,
তাই পরে প্রোফাইল সম্পূর্ণ হলেও আগের অগ্রগতি ও ফলাফল হারায় না।

---

## ৫. সেটআপ (একবার)

1. Learning Hub স্প্রেডশিট খুলুন → **Extensions → Apps Script**।
2. পুরনো কোড মুছে `apps-script/Code.gs`-এর পুরোটা পেস্ট করুন → **Save**।
3. ফাংশন ড্রপডাউন থেকে **`setupHubSheets`** → **▶ Run** → অনুমতি দিন।
   লগে `✅ setupHubSheets সম্পন্ন` দেখলেই ট্যাব প্রস্তুত।
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Deploy → `https://script.google.com/macros/s/…/exec` কপি করুন।
5. অ্যাপে **অ্যাডমিন → সেটিংস** → URL বসিয়ে **সেভ ও টেস্ট**।
   "সংযুক্ত হয়েছে" দেখলেই ডেটা শিটে যাচ্ছে।

> কোড আবার বদলালে: **Deploy → Manage deployments → Edit → New version → Deploy**।
> নাহলে পুরনো কোডই চলবে — এটি সবচেয়ে সাধারণ ভুল।

### পুরনো ডেটা আনতে চাইলে

পুরনো Score Sheet থেকে `Responses`/`Supervisors` ট্যাব কপি করে Learning Hub
স্প্রেডশিটে পেস্ট করুন — হেডার একই থাকলে স্ক্রিপ্ট সরাসরি সেগুলোই পড়বে।
কলামের নাম আলাদা হলে স্ক্রিপ্ট নতুন কলাম যোগ করবে; সেক্ষেত্রে পুরনো ডেটা
নতুন রিপোর্টে আসতে চাইলে কলামের নাম মিলিয়ে নিন।

---

## ৬. ট্রেইনার ফ্লো (৫ ধাপ)

1. **কুইজ ব্যাংক → নতুন কুইজ** — বিল্ট-ইন সেট থেকে কপি করুন (প্রয়োজনে পরে সম্পাদনা)।
2. **শেয়ার লিংক → নতুন লিংক** — কুইজ, তারিখ, সময়সীমা ও বার্তা দিন।
3. **কপি** চেপে লিংকটি হোয়াটসঅ্যাপ/ইমেইলে পাঠান।
4. লার্নার লিংক খুলে নাম-মোবাইল দিয়ে সরাসরি কুইজ দেবে (লগইন লাগে না)।
5. **ফলাফল** ট্যাবে স্কোর দেখুন, দরকারে **CSV ডাউনলোড** করে রিপোর্ট বানান;
   সময় শেষ হলে **বন্ধ** চেপে লিংকটি নিষ্ক্রিয় করুন।

---

## ৭. ডেভেলপমেন্ট ও টেস্ট

```bash
npm ci
npm run dev          # http://localhost:5173
npm run typecheck    # TypeScript
npm test             # SSR স্মোক + Apps Script বেকেন্ড + সিঙ্ক ইঞ্জিন
npm run test:flow    # jsdom দিয়ে আসল ক্লিক-ফ্লো (কুইজ, প্রোগ্রেস, শেয়ার লিংক)
npm run build        # dist/ (single file)
```

`npm test`-এর তিনটি অংশ:

- `scripts/smoke.mjs` — প্রতিটি রুট রেন্ডার করে দেখে প্রত্যাশিত বাংলা কপি আছে
  এবং কোথাও `undefined` / `NaN` / `[object Object]` লিক করছে না।
- `scripts/backend-test.mjs` — `apps-script/Code.gs`-কে Sheets API-র ইন-মেমরি
  নকলের উপর চালায়: হেডার অ্যাডাপ্টেশন, ডুপ্লিকেট সাবমিশন, alias ম্যাচিং,
  অ্যাক্টিভেশন খোলা/বন্ধ, ডিলিট, ভুল পেলোড।
- `scripts/sync-test.mjs` — নেটওয়ার্ক বিচ্ছিন্ন অবস্থায় লেখা জমা থাকে কি না,
  ফ্লাশ চলাকালে নতুন লেখা হারায় না, এবং bootstrap-এ লোকাল ও শিটের ডেটা
  সঠিকভাবে মেলে কি না।

---

## ৮. সমস্যা ও সমাধান

| লক্ষণ | কারণ | সমাধান |
| --- | --- | --- |
| "লোকাল মোড" দেখাচ্ছে | Apps Script URL সেট নেই | অ্যাডমিন → সেটিংসে URL বসান |
| "সংযোগ ব্যর্থ" | URL `/exec` নয় / Access "Anyone" নয় / নতুন version deploy হয়নি | তিনটিই যাচাই করুন |
| শিটে ডেটা যাচ্ছে না | কিউ-তে রেকর্ড জমে আছে | সেটিংস → "এখনই সিঙ্ক" |
| লিংক খুললে "পাওয়া যায়নি" | লিংক শিটে সিঙ্ক হয়নি বা বন্ধ | শেয়ার লিংক ট্যাব থেকে আবার খুলুন/চালু করুন |
| ড্রপডাউনে নাম নেই | `Supervisors`/`Zones` খালি | অ্যাডমিন → তালিকা → যোগ করুন |
| পুরনো কোড চলছে | নতুন version deploy হয়নি | Deploy → Manage deployments → Edit → New version |
| স্কোর শিটে দেখা যাচ্ছে না | লার্নারের ব্রাউজারে URL সেট নেই | সাইটে URL স্থায়ীভাবে বসিয়ে redeploy করুন |

---

## ৯. গোপনীয়তা ও ব্যবহারবিধি

- Employee ID, মোবাইল ও স্কোর — সবই অভ্যন্তরীণ প্রশিক্ষণ রিপোর্টের জন্য।
- স্প্রেডশিট শুধু নির্দিষ্ট ট্রেনিং টিমের সাথে শেয়ার করুন (Editor: ২-৩ জন)।
- Apps Script "Anyone" মানে যে কেউ কুইজ **দিতে** পারবে; সে শিট **খুলতে** পারবে না।
- প্রশ্ন ও উত্তর ক্লায়েন্ট বান্ডলে/শিটে থাকে, তাই এটি **প্রক্টরড পরীক্ষা নয়** —
  কেউ চাইলে সোর্স দেখে উত্তর বের করতে পারে। মূল্যায়নকে "শেখার যাচাই" হিসেবে
  ব্যবহার করুন; চূড়ান্ত মূল্যায়নে ট্রেনার উপস্থিত থাকুন বা সময়সীমা ছোট রাখুন।
- শিটে শুধু ফলাফল ও উত্তরসমূহের সূচক জমা হয়; কোনো পাসওয়ার্ড বা বেসরকারি তথ্য নয়।
