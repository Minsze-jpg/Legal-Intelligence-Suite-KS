import { useState, useRef } from "react";

// ── SYSTEM PROMPTS ────────────────────────────────────────────────────────────

const AP = `You are a specialized Kansas Court of Appeals appellate analysis engine. Analyze the uploaded Kansas appeal motion. Use EXACTLY these section headers. Be thorough — do not skip or abbreviate any section.

---S1_SCORECARD---
For each appellate decisional pattern (A through L) output:
PATTERN: [letter and short label]
VERDICT: [Likely Persuasive / Likely Neutral / Likely Against]
REASON: [1-3 sentences citing that pattern's reasoning style and how the motion's arguments map to it]

---S2_FIRSTIMP---
DETECTED: [YES / NO]
ISSUES: [If YES: list each issue of first impression in Kansas with one sentence per issue]
KS_STATUS: [For each issue: why no Kansas published opinion squarely resolves it]
TENTH_CIR: [Most on-point 10th Circuit PUBLISHED opinions. Full citation. If none found, state so.]
SISTER: [Most persuasive sister-state authority. Full citation. Prefer CO, UT, OK, WY, NM or states with identical statutory language.]
OTHER: [Any Restatement, ALI position, or other federal circuit authority]
RECEPTIVITY: [Which patterns (A-L) are most receptive to first impression arguments and why]
FRAMING: [Concrete framing recommendation]

---S3_RULING---
OUTCOME: [Affirm / Reverse / Remand / Dismiss / Vacate]
REASON: [Primary driver of that outcome]
WEAKEST: [Arguments most likely to fail and why]
STRONGEST: [Arguments with highest probability of success]
FI_IMPACT: [How first impression issue(s) affect the outcome probability, if applicable]

---S4_STRUCTURAL---
For each defect:
DEFECT_ID: [SE-N]
TYPE: [Missing Required Finding / Inadequate Legal Basis / Oral vs Written Conflict / Journal Entry Defect / Failure to State Reasons / Statutory Non-Compliance]
STATUTE_RULE: [K.S.A. or rule violated]
DESCRIPTION: [what the district court did or failed to do]
RECORD: [what in the motion's record shows this]
STRENGTH: [Strong / Moderate / Weak]
AUTHORITY: [most on-point Kansas or 10th Circuit authority]

---S5_CASELAW---
For each:
CITATION: [full — name, reporter, volume, page, year]
SOURCE: [10th Circuit / Kansas / Sister State / Other Federal]
HOLDING: [one sentence]
RELEVANCE: [why this strengthens the motion]
FI_USE: [YES / NO]

---S6_MOTION---
Full revised ready-to-file motion. Include: caption; jurisdiction (K.S.A. 38-2273); per-argument standard of review; record cite for every factual assertion; preservation for every argument or plain error; K.S.A. 38-2269(a) three-part checklist; Mathews v. Eldridge 424 U.S. 319 (1976) balancing where due process argued; In re B.H. 64 Kan. App. 2d 480 (2024); In re A.S. 319 Kan. 396 (2024); In re K.R. No. 128161 Kan. Jan. 16 2026; In re A.K. No. 127259 Kan. July 18 2025; first impression framing where applicable; all additional case law from S5; applicable K.A.R.; DCF policy; applicable K.S.A.; Kansas Constitution Bill of Rights; U.S. Constitution (1st, 4th, 14th Amendments); Pro Se signature block; K.S.A. 38-2273(e) verification block; Certificate of Service.

---S7_CITATIONS---
For each citation in the revised motion:
CITATION: [full]
STATUS: [Verified / Needs Verification / Flag — Possible Error]
NOTE: [issue if any]

---S8_CHECKLIST---
For each item output PASS or FAIL:
FORMAT:
[ ] Case caption complete PASS/FAIL
[ ] 1.25-inch header clearance PASS/FAIL
[ ] Every page numbered PASS/FAIL
SIGNATURE AND VERIFICATION:
[ ] Pro Se signature block complete PASS/FAIL
[ ] K.S.A. 38-2273(e) verification block present PASS/FAIL
[ ] Notarization placeholder included PASS/FAIL
SERVICE:
[ ] Certificate of Service complete PASS/FAIL
[ ] Service method specified PASS/FAIL
JURISDICTION:
[ ] K.S.A. 38-2273 addressed PASS/FAIL
[ ] Mootness (State v. Phipps) addressed PASS/FAIL
[ ] Concurrent jurisdiction addressed PASS/FAIL
PRESERVATION:
[ ] Every factual assertion has a record cite PASS/FAIL
[ ] All arguments preserved or plain error argued PASS/FAIL
CITATIONS:
[ ] Published cases include reporter/volume/page/year PASS/FAIL
[ ] Unpublished opinions labeled persuasive authority PASS/FAIL
[ ] K.S.A. citations verified PASS/FAIL
[ ] K.A.R. citations complete PASS/FAIL
FIRST IMPRESSION:
[ ] First impression issues explicitly identified PASS/FAIL
[ ] 10th Circuit or persuasive authority cited PASS/FAIL
[ ] Kansas statutory anchor for proposed rule PASS/FAIL

---END---

APPELLATE DECISIONAL PATTERNS:
A (Jurisdiction-First): Jurisdiction confirmed before merits; Mathews granularly; full record required; on first impression surveys sister-state authority systematically, favors bright-line rules.
B (Procedural Rigor): Affirmance when record dense; statutory failures must be explicit; on first impression insists the legal question was preserved below.
C (Institutionalist/Due Process): Most receptive to first impression; wants the law to be right; engages Restatements and ALI; willing to dissent.
D (Strict Preservation): Strict on preservation; on first impression will call it waived if only facts raised below.
E (Formalist): Federal clerk background; precise citation; text first then legislative history then analogous Kansas then federal.
F (Practical): Rural district court 15 years; asks what rule is administrable at trial court level; neighboring state authority persuasive.
G (Record-Follower): Follows panel leader; affirmance tendency with sufficient record.
H (Senior-Generalist): High affirmance; follows panel framework.
I (Structural Error Reversal): Reverses on legal/structural errors; will not second-guess credibility.
J (Local CINC/Procedural): Former district judge and assistant DA/solicitor general; procedural argument resonates.
K (Emerging/Due Process): Newer voice; structural due process may find traction; follows panel leader.
L (Agency-Fairness): District CINC experience; recovery court; fairness and agency structural failures land.

KEY REVERSAL PATTERNS: (1) Missing K.S.A. 38-2269(a) "unlikely to change" finding — In re K.R. mandatory reversal. (2) Proffer sole unfitness basis — In re A.K.; In re L.X.-Y. (3) Involuntary absence ≠ willful abandonment — In re D.C.N.; In re L.X.-Y. (4) Unrepresented termination after same-day withdrawal — In re B.H. (5) Parent unable to testify — In re A.S. (6) Interested party terminated without notice — J.H. v. TFI Family Svcs. (7) State failed burden — In re W.E.W. (8) UCCJEA error. (9) DCF admin error — E.F. v. Kansas DCF.`;

const DP = `You are a Kansas appellate forensics engine. Review the uploaded Kansas district court order, memorandum, or decision. Use EXACTLY these section headers.

---D1_SUMMARY---
Court, date, case type, judge, parties, relief granted or denied.

---D2_STRUCTURAL---
For each structural defect:
DEFECT_ID: [S-N]
CATEGORY: Structural Error
TYPE: [type]
STATUTE/RULE: [authority]
EXCERPT: [order language or absence]
ANALYSIS: [why this is a structural error]
APPELLATE STRENGTH: [Strong / Moderate / Weak]
LEADING CASE: [authority]

---D3_JURISDICTION---
DEFECT_ID: [J-N]
CATEGORY: Jurisdictional Defect
TYPE: [Subject-Matter / Personal / UCCJEA / Mootness / Non-Final / K.S.A. 38-2273 Limitation]
STATUTE/RULE: [authority]
EXCERPT: [language or absence]
ANALYSIS: [analysis]
APPELLATE STRENGTH: [Strong / Moderate / Weak]
NOTE: [void judgment note if applicable — K.S.A. 60-260(b)(4), no time limit]

---D4_DUEPROCESS---
Apply Mathews v. Eldridge 424 U.S. 319 (1976) three-factor balancing and Kansas Bill of Rights §§ 1, 2, 18.
DEFECT_ID: [D-N]
CATEGORY: Due Process Violation
TYPE: [Notice / Opportunity to Be Heard / Right to Counsel / Right to Testify / Counsel Withdrawal Without Inquiry / Ex Parte / Denial of Continuance]
CONSTITUTIONAL BASIS: [U.S. Const. amend. XIV / Kan. Const. Bill of Rights]
STATUTE/RULE: [K.S.A. if any]
EXCERPT: [language]
MATHEWS_ANALYSIS: [all three factors explicitly]
APPELLATE STRENGTH: [Strong / Moderate / Weak]
LEADING CASE: [authority]

---D5_FRAUD---
DEFECT_ID: [M-N]
CATEGORY: K.S.A. 60-260(b) Ground
SUBSECTION: [(b)(1)/(b)(2)/(b)(3)/(b)(4)/(b)(6)]
TIME_LIMIT: [One Year / No Time Limit]
FACTS_SUPPORTING: [factual basis]
ANALYSIS: [why ground is met]
APPELLATE STRENGTH: [Strong / Moderate / Weak]
Note: (b)(4) void judgment — NO TIME LIMIT. (b)(1)-(3) — ONE YEAR.

---D6_CONSTITUTIONAL---
DEFECT_ID: [C-N]
CATEGORY: Constitutional Violation
TYPE: [Federal / Kansas]
PROVISION: [exact]
VIOLATION: [what the order did]
ANALYSIS: [scrutiny level and analysis]
APPELLATE STRENGTH: [Strong / Moderate / Weak]
LEADING CASE: [authority]

---D7_CINC---
If not a CINC order: "Not a CINC order."
Otherwise check PRESENT / ABSENT / DEFICIENT:
K.S.A. 38-2269(a): Finding 1 (unfitness by clear and convincing evidence), Finding 2 (unlikely to change in foreseeable future), Finding 3 (best interests)
K.S.A. 38-2255: Reintegration plan specificity, visitation terms, placement authority
K.S.A. 38-2258: 14-day advance notice, court order for placement change
K.S.A. 38-2243: 72-hour hearing held, all parties notified

---D8_APPELLATE---
For each pattern (A-L):
PATTERN: [letter and label]
RECEPTIVE_TO: [defect IDs with 1-sentence reason]
RESISTANT_TO: [defects likely discounted]
OVERALL_PREDICTION: [Strong Reversal Likely / Reversal Possible / Affirmance Likely / Dismissal Risk]
PANEL_ANALYSIS: [most and least favorable panel combinations; overall appellate success probability]
STRONGEST_GROUNDS: [top 3-5 defects ranked by strength]
STRATEGY: [what to lead with, standard of review, what to pair, what to omit]

---D9_VACATE---
K.S.A. 60-260(b) motion skeleton: caption; grounds with subsection cites; key argument headers; recommended relief; jurisdiction statement; timing note.

---END---

PATTERNS A-L: same as appellate tool. Apply identically.`;

// ── THEORY SYSTEM PROMPT ──────────────────────────────────────────────────────

const THEORY_SYS = `You are a Kansas CINC (Child in Need of Care) legal theory evaluator operating strictly within the K.S.A. 38-2201 et seq. framework and Kansas Court of Appeals appellate decisional patterns A through L.

Your role:
1. Evaluate whether a proposed legal theory is well-grounded, weak, or outside the CINC framework.
2. If a theory strays outside the CINC framework or lacks statutory anchor, EXPLAIN clearly why it may not be the strongest argument, what framework it falls under instead, and redirect the user to the strongest arguments from their prior analysis.
3. If a user persists on the same theory a second time, dig deeper — search for unpublished Kansas Court of Appeals opinions, very recent 2024-2026 opinions, sister-state authority, and any overlooked statutory basis before delivering a final verdict. Then explain in detail why the analysis-provided statutory grounds remain stronger.
4. Always tie your response to specific K.S.A. provisions, Kansas appellate patterns, and case law.
5. Never provide generic legal advice. Stay within the CINC framework. If a theory belongs to a different legal domain (tort, criminal, federal civil rights standalone), say so explicitly.

CINC FRAMEWORK ANCHORS:
- K.S.A. 38-2201 (purpose/family preservation)
- K.S.A. 38-2242 (ex parte protective custody)
- K.S.A. 38-2243 (72-hour hearing)
- K.S.A. 38-2255 (disposition/reintegration)
- K.S.A. 38-2258 (14-day notice/placement change)
- K.S.A. 38-2269(a) (TPR findings: unfitness, unlikely to change, best interests)
- K.S.A. 38-2273 (appellate jurisdiction)
- KEY REVERSAL PATTERNS: (1) Missing 38-2269(a) "unlikely to change" finding — In re K.R. mandatory reversal. (2) Proffer sole unfitness basis — In re A.K.; In re L.X.-Y. (3) Involuntary absence ≠ willful abandonment — In re D.C.N.; In re L.X.-Y. (4) Unrepresented termination — In re B.H. (5) Parent unable to testify — In re A.S. (6) Interested party without notice — J.H. v. TFI Family Svcs. (7) State failed burden — In re W.E.W. (8) DCF admin error — E.F. v. Kansas DCF.

APPELLATE PATTERNS A-L: same as main tool. Apply when assessing receptivity.

CONTEXT: The user may have run an appellate or district court analysis above. Reference "the analysis provided" when redirecting.

RESPONSE FORMAT — use these headers exactly:
---THEORY_EVAL---
THEORY: [restate theory in one sentence]
FRAMEWORK_FIT: [Strong CINC Fit / Partial CINC Fit / Outside CINC Framework]
CINC_ANCHOR: [specific K.S.A. provision(s) that could support this theory, or NONE]
VERDICT: [Sustains / Needs Development / Weak — Redirect / Outside Framework]
STRENGTH_RATING: [Strong / Moderate / Weak / Not Applicable]
ANALYSIS: [detailed evaluation — why it sustains or why it fails; statutory basis; case law; which appellate patterns would be receptive]
REDIRECT: [if weak or outside framework: what the stronger argument is from the CINC analysis and why]
DEEPER_RESEARCH: [only on second prompt of same theory: unpublished opinions, recent 2024-2026 opinions, sister-state authority, overlooked statutory basis]
FINAL_VERDICT: [one paragraph summary of whether to lead with this theory or defer to the analysis-provided grounds]
---END_THEORY---`;

// ── HELPERS ───────────────────────────────────────────────────────────────────

function sec(raw, tag) {
  const re = new RegExp(`---${tag}---([\\s\\S]*?)(?=---[A-Z0-9_]+---|---END---|$)`);
  const m = raw.match(re);
  return m ? m[1].trim() : "";
}

function strengthClass(s) {
  const l = (s || "").toLowerCase();
  if (l.includes("strong")) return "strong";
  if (l.includes("moderate")) return "moderate";
  return "weak";
}

function downloadText(content, filename) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildDownloadText(raw, type) {
  if (!raw) return "";
  const sections = type === "app"
    ? [["APPELLATE SCORECARD", "S1_SCORECARD"], ["FIRST IMPRESSION ANALYSIS", "S2_FIRSTIMP"], ["LIKELY RULING", "S3_RULING"], ["STRUCTURAL ERRORS", "S4_STRUCTURAL"], ["CASE LAW & STATUTES", "S5_CASELAW"], ["REVISED MOTION", "S6_MOTION"], ["CITATION CHECK", "S7_CITATIONS"], ["FILING CHECKLIST", "S8_CHECKLIST"]]
    : [["ORDER SUMMARY", "D1_SUMMARY"], ["STRUCTURAL ERRORS", "D2_STRUCTURAL"], ["JURISDICTIONAL DEFECTS", "D3_JURISDICTION"], ["DUE PROCESS VIOLATIONS", "D4_DUEPROCESS"], ["60-260(b) GROUNDS", "D5_FRAUD"], ["CONSTITUTIONAL VIOLATIONS", "D6_CONSTITUTIONAL"], ["CINC CHECKLIST", "D7_CINC"], ["APPELLATE SUCCESS ANALYSIS", "D8_APPELLATE"], ["VACATE FRAMEWORK", "D9_VACATE"]];
  const hr = "═".repeat(72);
  const lines = [`${hr}`, `KANSAS LEGAL INTELLIGENCE SUITE — ${type === "app" ? "APPELLATE" : "DISTRICT COURT"} ANALYSIS`, `Generated: ${new Date().toLocaleString()}`, `${hr}`, "", "DISCLAIMER: Research and drafting assistance only. All outputs must be independently verified.", "Nothing here constitutes legal advice. Consult a qualified Kansas attorney before filing.", "", hr];
  for (const [label, tag] of sections) {
    const content = sec(raw, tag);
    if (content) { lines.push("", `── ${label} ${"─".repeat(Math.max(0, 68 - label.length))}`, "", content); }
  }
  lines.push("", hr, "END OF ANALYSIS");
  return lines.join("\n");
}

// ── STYLES ────────────────────────────────────────────────────────────────────

const css = `
  :root {
    --ink: #090c12; --surf: #0e1520; --raised: #141d2b;
    --bdr: #1c2b3e; --bdr2: #243548; --muted: #3a5470;
    --mid: #618aaa; --txt: #c2d4e4; --bright: #ddeaf8;
    --gold: #b88a20; --gold-bg: #140f00; --gold-bd: #3a2800;
    --grn: #48a858; --grn-bg: #061408; --grn-bd: #1a3a1a;
    --amb: #b07820; --amb-bg: #120e00; --amb-bd: #382500;
    --red: #a84848; --red-bg: #120606; --red-bd: #3a1010;
    --acc-a: #1e3a5c; --acc-d: #2a1448; --acc-t: #1a2e1a;
    --theory: #48a858; --theory-bd: #1a3a1a; --theory-bg: #061408;
    --mono: 'Courier New', monospace; --serif: Georgia, serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--ink); color: var(--txt); font-family: var(--serif); font-size: 14px; }
  .suite { display: flex; flex-direction: column; min-height: 100vh; background: var(--ink); }
  .hdr { background: linear-gradient(150deg, #0e1c30 0%, var(--ink) 100%); border-bottom: 1px solid var(--bdr); padding: 18px 28px 14px; }
  .hdr-eye { font-family: var(--mono); font-size: 9px; letter-spacing: .25em; color: var(--muted); text-transform: uppercase; margin-bottom: 4px; }
  .hdr-title { font-size: 20px; font-weight: 700; color: var(--bright); }
  .ptabs { display: flex; background: var(--ink); border-bottom: 2px solid var(--bdr); overflow-x: auto; }
  .ptab { flex: 1; min-width: 120px; padding: 14px 16px; font-family: var(--mono); font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); background: transparent; border: none; border-bottom: 3px solid transparent; cursor: pointer; margin-bottom: -2px; white-space: nowrap; }
  .ptab:hover { color: var(--mid); background: var(--surf); }
  .ptab.active-a { color: var(--bright); background: var(--surf); border-bottom-color: #4a80c0; }
  .ptab.active-d { color: var(--bright); background: var(--surf); border-bottom-color: #8050b8; }
  .ptab.active-t { color: var(--theory); background: var(--surf); border-bottom-color: var(--theory); }
  .main { flex: 1; padding: 20px 26px; max-width: 1140px; margin: 0 auto; width: 100%; }
  .disc { background: var(--gold-bg); border: 1px solid var(--gold-bd); border-left: 4px solid var(--gold); border-radius: 5px; padding: 9px 14px; font-family: var(--mono); font-size: 11px; color: var(--gold); line-height: 1.6; margin-bottom: 18px; }
  .upz { border: 2px dashed var(--bdr); border-radius: 7px; padding: 28px 22px; text-align: center; cursor: pointer; background: var(--surf); margin-bottom: 13px; transition: border-color .2s; position: relative; }
  .upz:hover, .upz.drag { border-color: var(--mid); background: var(--raised); }
  .upz input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
  .uz-ico { font-size: 32px; opacity: .5; margin-bottom: 8px; }
  .uz-lbl { font-family: var(--mono); font-size: 13px; color: var(--mid); margin-bottom: 3px; }
  .uz-hint { font-family: var(--mono); font-size: 11px; color: var(--muted); }
  .uz-fn { margin-top: 8px; font-family: var(--mono); font-size: 12px; color: #4a80b8; background: var(--ink); border: 1px solid var(--bdr); border-radius: 3px; padding: 3px 9px; display: inline-block; }
  .btn-run { width: 100%; padding: 12px; border-radius: 5px; font-family: var(--mono); font-size: 12px; letter-spacing: .1em; text-transform: uppercase; cursor: pointer; margin-bottom: 18px; border: 1px solid; }
  .btn-a { background: var(--acc-a); color: var(--bright); border-color: #2e5080; }
  .btn-a:hover:not(:disabled) { background: #264060; border-color: #4a80c0; }
  .btn-d { background: var(--acc-d); color: var(--bright); border-color: #402070; }
  .btn-d:hover:not(:disabled) { background: #38206a; border-color: #7050b8; }
  .btn-t { background: var(--acc-t); color: var(--theory); border-color: var(--theory-bd); }
  .btn-t:hover:not(:disabled) { background: #0a1e0a; border-color: var(--theory); }
  .btn-run:disabled { opacity: .35; cursor: not-allowed; }
  @keyframes pulse { 0%,100% { opacity:.5 } 50% { opacity:1 } }
  .running { animation: pulse 1.5s ease-in-out infinite; }
  .errb { background: var(--red-bg); border: 1px solid var(--red-bd); border-left: 4px solid var(--red); border-radius: 5px; padding: 9px 13px; font-family: var(--mono); font-size: 12px; color: #c06060; margin-bottom: 13px; }
  .stabs-wrap { overflow-x: auto; }
  .stabs { display: flex; gap: 1px; border-bottom: 2px solid var(--bdr); min-width: max-content; }
  .stab { padding: 8px 13px; font-family: var(--mono); font-size: 10px; letter-spacing: .07em; text-transform: uppercase; color: var(--muted); background: transparent; border: 1px solid transparent; border-bottom: none; border-radius: 4px 4px 0 0; cursor: pointer; white-space: nowrap; margin-bottom: -2px; }
  .stab:hover { color: var(--mid); background: var(--surf); }
  .stab.active { color: var(--bright); background: var(--surf); border-color: var(--bdr); border-bottom-color: var(--surf); }
  .stab.edit-tab { color: #70b070; }
  .stab.edit-tab.active { color: #90d090; }
  .spanel { background: var(--surf); border: 1px solid var(--bdr); border-top: none; border-radius: 0 0 5px 5px; padding: 20px; min-height: 260px; }
  .pre { font-family: var(--mono); font-size: 12px; line-height: 1.7; color: var(--mid); white-space: pre-wrap; word-break: break-word; }
  .empty { font-family: var(--mono); font-size: 12px; color: var(--muted); }
  /* download bar */
  .dl-bar { display: flex; justify-content: flex-end; margin-bottom: 14px; }
  .btn-dl { font-family: var(--mono); font-size: 11px; padding: 7px 16px; border-radius: 4px; cursor: pointer; border: 1px solid #1a3858; background: #081828; color: #4a80c0; display: flex; align-items: center; gap: 6px; }
  .btn-dl:hover { background: #0e2438; border-color: #5a9ad0; color: var(--bright); }
  /* scorecard */
  .tw { overflow-x: auto; }
  .sct { width: 100%; border-collapse: collapse; font-size: 13px; }
  .sct th { background: var(--ink); color: var(--muted); font-family: var(--mono); font-size: 9px; letter-spacing: .13em; text-transform: uppercase; padding: 8px 11px; text-align: left; border-bottom: 1px solid var(--bdr); }
  .sct td { padding: 8px 11px; border-bottom: 1px solid var(--raised); vertical-align: top; line-height: 1.5; }
  .sct tr:hover td { background: var(--ink); }
  .jc { font-family: var(--mono); font-size: 11px; color: var(--mid); white-space: nowrap; }
  .rc { font-size: 12px; color: #6a8898; }
  .vd { display: inline-block; padding: 2px 7px; border-radius: 3px; font-family: var(--mono); font-size: 10px; font-weight: 700; white-space: nowrap; }
  .vg { background: var(--grn-bg); color: var(--grn); border: 1px solid var(--grn-bd); }
  .vm { background: var(--amb-bg); color: var(--amb); border: 1px solid var(--amb-bd); }
  .vb { background: var(--red-bg); color: var(--red); border: 1px solid var(--red-bd); }
  /* defect cards */
  .dcl { display: flex; flex-direction: column; gap: 6px; }
  .dc { border-radius: 5px; border: 1px solid; overflow: hidden; }
  .dc.strong { border-color: #264a26; background: #040c04; }
  .dc.moderate { border-color: #4a3a0e; background: #0b0900; }
  .dc.weak { border-color: #3a1818; background: #0b0404; }
  .dc.unknown { border-color: var(--bdr); background: var(--surf); }
  .dch { display: flex; justify-content: space-between; align-items: center; padding: 9px 13px; cursor: pointer; user-select: none; }
  .dcl2 { display: flex; align-items: center; gap: 8px; }
  .dcid { font-family: var(--mono); font-size: 11px; font-weight: 700; color: var(--mid); background: var(--ink); padding: 2px 7px; border-radius: 3px; white-space: nowrap; }
  .dct { font-family: var(--mono); font-size: 12px; color: var(--bright); }
  .dcr { display: flex; align-items: center; gap: 7px; }
  .stb { font-family: var(--mono); font-size: 10px; padding: 2px 7px; border-radius: 3px; font-weight: 700; white-space: nowrap; }
  .dc.strong .stb { background: var(--grn-bg); color: var(--grn); }
  .dc.moderate .stb { background: var(--amb-bg); color: var(--amb); }
  .dc.weak .stb { background: var(--red-bg); color: var(--red); }
  .chv { color: var(--muted); font-size: 10px; transition: transform .18s; }
  .chv.open { transform: rotate(180deg); }
  .dcb { padding: 12px 14px; border-top: 1px solid rgba(60,110,160,.12); display: flex; flex-direction: column; gap: 8px; }
  .df { display: flex; flex-direction: column; gap: 2px; }
  .dfl { font-family: var(--mono); font-size: 9px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
  .dfv { font-family: var(--mono); font-size: 12px; color: #7a8c9c; line-height: 1.6; }
  .dfv.qt { font-style: italic; color: #6a8898; background: var(--ink); padding: 4px 9px; border-left: 2px solid var(--bdr2); border-radius: 2px; }
  .dfv.au { color: #7080b0; }
  .dfv.nt { color: var(--gold); }
  /* first impression */
  .fib { background: #08102a; border: 1px solid #1e2e60; border-left: 4px solid #4060c0; border-radius: 5px; padding: 10px 14px; margin-bottom: 14px; font-family: var(--mono); font-size: 12px; color: #7080c0; line-height: 1.6; }
  .fit { font-size: 9px; letter-spacing: .15em; text-transform: uppercase; color: #4060c0; margin-bottom: 4px; }
  .ibox { background: var(--ink); border: 1px solid var(--bdr); border-radius: 5px; padding: 12px 16px; margin-top: 12px; }
  .apl { font-family: var(--mono); font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; margin-top: 13px; }
  .ipre { font-family: var(--mono); font-size: 12px; line-height: 1.7; color: #607080; white-space: pre-wrap; }
  /* case law */
  .cll { display: flex; flex-direction: column; gap: 9px; }
  .clc { background: var(--ink); border: 1px solid var(--bdr); border-radius: 5px; padding: 12px 15px; }
  .clcit { font-family: var(--mono); font-size: 12px; color: #7080b0; margin-bottom: 4px; }
  .clhld { font-size: 13px; color: var(--txt); line-height: 1.6; margin-bottom: 5px; }
  .clrel { font-family: var(--mono); font-size: 11px; color: var(--muted); }
  .clsrc { display: flex; gap: 6px; margin-top: 7px; flex-wrap: wrap; }
  .src-badge { display: inline-block; font-family: var(--mono); font-size: 10px; padding: 1px 7px; border-radius: 3px; font-weight: 700; }
  .s10 { background: #081828; color: #4a80c0; border: 1px solid #1a3858; }
  .sks { background: var(--grn-bg); color: var(--grn); border: 1px solid var(--grn-bd); }
  .ssi { background: #160a28; color: #8050b0; border: 1px solid #2e1848; }
  .sot { background: var(--amb-bg); color: var(--amb); border: 1px solid var(--amb-bd); }
  .sfi { background: #080818; color: #5060a0; border: 1px solid #181828; }
  /* cinc */
  .cinl { display: flex; flex-direction: column; gap: 3px; }
  .cinh { font-family: var(--mono); font-size: 9px; letter-spacing: .13em; text-transform: uppercase; color: var(--muted); margin-top: 13px; margin-bottom: 3px; padding-bottom: 3px; border-bottom: 1px solid var(--bdr); }
  .cinr { display: flex; align-items: flex-start; gap: 8px; padding: 5px 7px; border-radius: 3px; font-family: var(--mono); font-size: 12px; color: var(--mid); }
  .cinr.ok { background: #050d05; color: var(--grn); }
  .cinr.fl { background: var(--red-bg); color: var(--red); }
  .cinr.wn { background: var(--amb-bg); color: var(--amb); }
  .cion { width: 13px; flex-shrink: 0; font-weight: 700; }
  .citx { flex: 1; }
  .cibg { margin-left: auto; font-family: var(--mono); font-size: 10px; padding: 1px 6px; border-radius: 3px; font-weight: 700; white-space: nowrap; }
  .bok { background: var(--grn-bg); color: var(--grn); }
  .bfl { background: var(--red-bg); color: var(--red); }
  .bwn { background: var(--amb-bg); color: var(--amb); }
  /* appellate */
  .apt { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 14px; }
  .apt th { background: var(--ink); color: var(--muted); font-family: var(--mono); font-size: 9px; letter-spacing: .1em; text-transform: uppercase; padding: 7px 11px; text-align: left; border-bottom: 1px solid var(--bdr); }
  .apt td { padding: 7px 11px; border-bottom: 1px solid var(--raised); vertical-align: top; line-height: 1.5; }
  .apt tr:hover td { background: var(--ink); }
  .smc { font-family: var(--mono); font-size: 11px; color: #405060; max-width: 190px; }
  .pd { display: inline-block; font-family: var(--mono); font-size: 10px; padding: 2px 6px; border-radius: 3px; font-weight: 700; white-space: nowrap; }
  .ps { background: var(--grn-bg); color: var(--grn); }
  .pp { background: #101e08; color: #80b040; }
  .pd2 { background: var(--red-bg); color: var(--red); }
  .pa2 { background: var(--amb-bg); color: var(--amb); }
  /* citations */
  .ctl { display: flex; flex-direction: column; gap: 6px; }
  .ctr { padding: 9px 12px; border-radius: 4px; border-left: 3px solid; }
  .cok { background: #081408; border-left-color: #287028; }
  .cwn { background: var(--amb-bg); border-left-color: #806000; }
  .cfg { background: var(--red-bg); border-left-color: #803030; }
  .cref { font-family: var(--mono); font-size: 12px; color: var(--bright); margin-bottom: 3px; }
  .cmt { display: flex; gap: 7px; align-items: center; flex-wrap: wrap; }
  .csbg { font-family: var(--mono); font-size: 10px; padding: 1px 6px; border-radius: 3px; font-weight: 700; }
  .cok .csbg { background: var(--grn-bg); color: var(--grn); }
  .cwn .csbg { background: var(--amb-bg); color: var(--amb); }
  .cfg .csbg { background: var(--red-bg); color: var(--red); }
  .cnt { font-family: var(--mono); font-size: 11px; color: var(--muted); }
  /* checklist */
  .cll2 { display: flex; flex-direction: column; gap: 3px; }
  .clh { font-family: var(--mono); font-size: 9px; letter-spacing: .13em; text-transform: uppercase; color: var(--muted); margin-top: 13px; margin-bottom: 3px; padding-bottom: 3px; border-bottom: 1px solid var(--bdr); }
  .clr { display: flex; align-items: flex-start; gap: 8px; padding: 4px 7px; border-radius: 3px; font-family: var(--mono); font-size: 12px; color: var(--mid); }
  .clr.cp { background: #040d04; color: var(--grn); }
  .clr.cf { background: var(--red-bg); color: var(--red); }
  .clic { width: 12px; flex-shrink: 0; font-weight: 700; }
  .clbg { margin-left: auto; font-family: var(--mono); font-size: 10px; padding: 1px 6px; border-radius: 3px; font-weight: 700; white-space: nowrap; }
  .bp { background: var(--grn-bg); color: var(--grn); }
  .bf { background: var(--red-bg); color: var(--red); }
  /* editor */
  .ed-bar { display: flex; gap: 7px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }
  .btn-sm { font-family: var(--mono); font-size: 11px; padding: 6px 13px; border-radius: 4px; cursor: pointer; border: 1px solid; }
  .b-dl { background: #0a1828; color: #4a80c0; border-color: #1a3858; }
  .b-dl:hover { background: #0e2438; border-color: #5a9ad0; }
  .meditor { width: 100%; min-height: 450px; background: var(--ink); color: var(--bright); font-family: var(--serif); font-size: 13px; line-height: 1.9; border: 1px solid var(--bdr); border-radius: 4px; padding: 18px 22px; resize: vertical; }
  .meditor:focus { outline: none; border-color: var(--bdr2); }
  /* ── THEORY TAB ── */
  .theory-wrap { display: flex; flex-direction: column; gap: 16px; }
  .theory-intro { background: var(--theory-bg); border: 1px solid var(--theory-bd); border-left: 4px solid var(--theory); border-radius: 5px; padding: 12px 16px; font-family: var(--mono); font-size: 12px; color: var(--theory); line-height: 1.7; }
  .theory-intro strong { color: #70d880; }
  .theory-input-wrap { display: flex; flex-direction: column; gap: 8px; }
  .theory-lbl { font-family: var(--mono); font-size: 10px; letter-spacing: .13em; text-transform: uppercase; color: var(--muted); }
  .theory-inp { width: 100%; min-height: 90px; background: var(--ink); color: var(--bright); font-family: var(--serif); font-size: 13px; line-height: 1.7; border: 1px solid var(--bdr); border-radius: 5px; padding: 12px 16px; resize: vertical; }
  .theory-inp:focus { outline: none; border-color: var(--bdr2); }
  .theory-inp::placeholder { color: var(--muted); font-style: italic; }
  .theory-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .theory-count { font-family: var(--mono); font-size: 10px; color: var(--muted); }
  .theory-count.second { color: var(--gold); }
  .theory-msgs { display: flex; flex-direction: column; gap: 14px; margin-top: 4px; }
  .tmsg { border-radius: 5px; overflow: hidden; border: 1px solid var(--bdr); }
  .tmsg-hdr { display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; background: var(--raised); border-bottom: 1px solid var(--bdr); }
  .tmsg-role { font-family: var(--mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
  .tmsg-role.user { color: var(--mid); }
  .tmsg-role.assistant { color: var(--theory); }
  .tmsg-body { padding: 14px 16px; font-family: var(--mono); font-size: 12px; line-height: 1.75; color: var(--mid); white-space: pre-wrap; word-break: break-word; }
  .tmsg-body.user { color: var(--txt); background: var(--surf); font-family: var(--serif); }
  /* verdict badges */
  .tv-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
  .tv-badge { display: inline-block; font-family: var(--mono); font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 4px; white-space: nowrap; }
  .tv-sustains { background: var(--grn-bg); color: var(--grn); border: 1px solid var(--grn-bd); }
  .tv-develop { background: var(--amb-bg); color: var(--amb); border: 1px solid var(--amb-bd); }
  .tv-weak { background: var(--red-bg); color: var(--red); border: 1px solid var(--red-bd); }
  .tv-outside { background: #100818; color: #8050a0; border: 1px solid #2e1848; }
  .tv-field { margin-bottom: 12px; }
  .tv-field-lbl { font-family: var(--mono); font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
  .tv-field-val { font-family: var(--mono); font-size: 12px; color: var(--mid); line-height: 1.65; white-space: pre-wrap; }
  .tv-redirect { background: #080814; border: 1px solid #1e2040; border-left: 4px solid #4050a0; border-radius: 4px; padding: 10px 14px; margin-top: 8px; }
  .tv-redirect-lbl { font-family: var(--mono); font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: #4050a0; margin-bottom: 5px; }
  .tv-deeper { background: #060e06; border: 1px solid #1a3a1a; border-left: 4px solid var(--theory); border-radius: 4px; padding: 10px 14px; margin-top: 8px; }
  .tv-deeper-lbl { font-family: var(--mono); font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: var(--theory); margin-bottom: 5px; }
  .tv-final { background: #0a100a; border: 1px solid #204020; padding: 12px 16px; border-radius: 5px; margin-top: 10px; font-family: var(--mono); font-size: 12px; color: #80c080; line-height: 1.7; }
  .tv-final-lbl { font-family: var(--mono); font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: var(--theory); margin-bottom: 5px; }
  .theory-dl-bar { display: flex; justify-content: flex-end; margin-top: 8px; }
  .footer { text-align: center; padding: 12px; font-family: var(--mono); font-size: 10px; color: var(--bdr2); border-top: 1px solid var(--bdr); }
`;

// ── RENDER HELPERS ────────────────────────────────────────────────────────────

function DefectList({ raw }) {
  const [open, setOpen] = useState({});
  if (!raw) return <p className="empty">No issues identified in this category.</p>;
  const blocks = raw.split(/\n(?=DEFECT_ID:)/).filter(Boolean);
  if (!blocks.length) return <pre className="pre">{raw}</pre>;
  const g = (b, re) => (b.match(re) || [])[1]?.trim() || "";
  return (
    <div className="dcl">
      {blocks.map((b, i) => {
        const id = g(b, /DEFECT_ID:\s*(.+)/);
        const type = g(b, /TYPE:\s*(.+)/);
        const cat = g(b, /CATEGORY:\s*(.+)/);
        const stat = g(b, /STATUTE[/\\]RULE:\s*(.+)/);
        const exc = g(b, /EXCERPT:\s*([\s\S]+?)(?=\n[A-Z_]+:|$)/);
        const ana = g(b, /ANALYSIS:\s*([\s\S]+?)(?=\n[A-Z_]+:|$)/);
        const str = g(b, /(?:APPELLATE STRENGTH|STRENGTH):\s*(.+)/);
        const lc = g(b, /(?:LEADING CASE|AUTHORITY):\s*([\s\S]+?)(?=\n[A-Z_]+:|$)/);
        const nt = g(b, /NOTE:\s*([\s\S]+?)(?=\n[A-Z_]+:|$)/);
        const bas = g(b, /CONSTITUTIONAL BASIS:\s*(.+)/);
        const mat = g(b, /MATHEWS_ANALYSIS:\s*([\s\S]+?)(?=\n[A-Z_]+:|$)/);
        const sub = g(b, /SUBSECTION:\s*(.+)/);
        const tl = g(b, /TIME_LIMIT:\s*(.+)/);
        const fct = g(b, /FACTS_SUPPORTING:\s*([\s\S]+?)(?=\n[A-Z_]+:|$)/);
        const prv = g(b, /PROVISION:\s*(.+)/);
        const vio = g(b, /VIOLATION:\s*([\s\S]+?)(?=\n[A-Z_]+:|$)/);
        const dsc = g(b, /DESCRIPTION:\s*([\s\S]+?)(?=\n[A-Z_]+:|$)/);
        const rec = g(b, /RECORD:\s*([\s\S]+?)(?=\n[A-Z_]+:|$)/);
        const cl = strengthClass(str);
        const isOpen = open[i];
        const row = (label, val, extra = "") => val ? (
          <div className="df" key={label}><span className="dfl">{label}</span><span className={`dfv ${extra}`}>{val}</span></div>
        ) : null;
        return (
          <div className={`dc ${cl}`} key={i}>
            <div className="dch" onClick={() => setOpen(o => ({ ...o, [i]: !o[i] }))}>
              <div className="dcl2"><span className="dcid">{id || "—"}</span><span className="dct">{type || cat || "—"}</span></div>
              <div className="dcr">{str && <span className="stb">{str}</span>}<span className={`chv ${isOpen ? "open" : ""}`}>▼</span></div>
            </div>
            {isOpen && (
              <div className="dcb">
                {row("Statute / Rule", stat)}{row("Constitutional Basis", bas)}{row("Provision", prv)}{row("60-260(b) Subsection", sub)}
                {tl && <div className="df"><span className="dfl">Time Limit</span><span className="dfv">{tl}</span></div>}
                {exc && <div className="df"><span className="dfl">Order Excerpt</span><span className="dfv qt">"{exc}"</span></div>}
                {row("Factual Basis", fct)}{row("Description", dsc)}{row("Record Support", rec)}{row("Analysis", ana)}{row("Violation", vio)}{row("Mathews Balancing", mat)}{row("Leading Authority", lc, "au")}{row("Note", nt, "nt")}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Scorecard({ raw }) {
  if (!raw) return <p className="empty">No scorecard data.</p>;
  const blocks = raw.split(/\n(?=PATTERN:)/).filter(Boolean);
  if (!blocks.length) return <pre className="pre">{raw}</pre>;
  const vc = v => { const l = (v || "").toLowerCase(); return l.includes("persuasive") ? "vg" : l.includes("neutral") ? "vm" : "vb"; };
  return (
    <div className="tw"><table className="sct">
      <thead><tr><th>Pattern</th><th>Verdict</th><th>Reasoning</th></tr></thead>
      <tbody>{blocks.map((b, i) => {
        const pat = (b.match(/PATTERN:\s*(.+)/) || [])[1]?.trim() || "—";
        const ver = (b.match(/VERDICT:\s*(.+)/) || [])[1]?.trim() || "—";
        const rea = (b.match(/REASON:\s*([\s\S]+?)(?=\n[A-Z]+:|$)/) || [])[1]?.trim() || "—";
        return <tr key={i}><td className="jc">{pat}</td><td><span className={`vd ${vc(ver)}`}>{ver}</span></td><td className="rc">{rea}</td></tr>;
      })}</tbody>
    </table></div>
  );
}

function FirstImp({ raw }) {
  if (!raw) return <p className="empty">No first impression analysis.</p>;
  const det = (raw.match(/DETECTED:\s*(.+)/) || [])[1]?.trim() || "";
  if (det.toUpperCase() === "NO") return <div className="fib"><div className="fit">First Impression Status</div>No issues of first impression identified. All arguments have Kansas published authority on point.</div>;
  const g = re => (raw.match(re) || [])[1]?.trim() || "";
  const bx = (label, val) => val ? <div className="ibox"><div className="apl">{label}</div><pre className="ipre">{val}</pre></div> : null;
  return <>
    <div className="fib"><div className="fit">⚖ Issue(s) of First Impression Detected</div>{g(/ISSUES:\s*([\s\S]+?)(?=\nKS_STATUS:|$)/)}</div>
    {bx("Why No Kansas Published Opinion Controls", g(/KS_STATUS:\s*([\s\S]+?)(?=\nTENTH_CIR:|$)/))}
    {bx("10th Circuit Published Authority", g(/TENTH_CIR:\s*([\s\S]+?)(?=\nSISTER:|$)/))}
    {bx("Sister-State Persuasive Authority", g(/SISTER:\s*([\s\S]+?)(?=\nOTHER:|$)/))}
    {bx("Other Persuasive Authority", g(/OTHER:\s*([\s\S]+?)(?=\nRECEPTIVITY:|$)/))}
    {bx("Which Patterns Are Most Receptive", g(/RECEPTIVITY:\s*([\s\S]+?)(?=\nFRAMING:|$)/))}
    {bx("Framing Recommendation", g(/FRAMING:\s*([\s\S]+?)$/))}
  </>;
}

function CaseLaw({ raw }) {
  if (!raw) return <p className="empty">No additional case law identified.</p>;
  const blocks = raw.split(/\n(?=CITATION:)/).filter(Boolean);
  if (!blocks.length) return <pre className="pre">{raw}</pre>;
  const sc2 = s => { const l = (s || "").toLowerCase(); return l.includes("10th") || l.includes("tenth") ? "s10" : l.includes("kansas") ? "sks" : l.includes("sister") ? "ssi" : "sot"; };
  return <div className="cll">{blocks.map((b, i) => {
    const g = re => (b.match(re) || [])[1]?.trim() || "";
    const cit = g(/CITATION:\s*(.+)/); const src = g(/SOURCE:\s*(.+)/);
    const hld = g(/HOLDING:\s*([\s\S]+?)(?=\nRELEVANCE:|$)/);
    const rel = g(/RELEVANCE:\s*([\s\S]+?)(?=\nFI_USE:|$)/);
    const fi = g(/FI_USE:\s*(.+)/);
    return <div className="clc" key={i}><div className="clcit">{cit}</div><div className="clhld">{hld}</div><div className="clrel">{rel}</div><div className="clsrc"><span className={`src-badge ${sc2(src)}`}>{src || "Other"}</span>{fi.toUpperCase() === "YES" && <span className="src-badge sfi">First Impression</span>}</div></div>;
  })}</div>;
}

function CincCheck({ raw }) {
  if (!raw) return <p className="empty">No CINC data.</p>;
  if (raw.includes("Not a CINC order")) return <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--mid)", background: "var(--surf)", border: "1px solid var(--bdr)", borderRadius: 5, padding: 13 }}>ℹ️ Not identified as a CINC/child welfare order.</div>;
  return <div className="cinl">{raw.split("\n").filter(l => l.trim()).map((l, i) => {
    const isH = /^K\.S\.A\.|^RESULT:/.test(l.trim()) || /^\w[\w\s]+:$/.test(l.trim());
    const isOk = /PRESENT/.test(l) && !/ABSENT|DEFICIENT/.test(l);
    const isFl = /ABSENT/.test(l); const isWn = /DEFICIENT/.test(l);
    if (isH) return <div className="cinh" key={i}>{l.trim()}</div>;
    const cls = isOk ? "ok" : isFl ? "fl" : isWn ? "wn" : "";
    const icon = isOk ? "✓" : isFl ? "✗" : isWn ? "⚠" : "·";
    const bg = (isOk || isFl || isWn) ? <span className={`cibg ${isOk ? "bok" : isFl ? "bfl" : "bwn"}`}>{isOk ? "PRESENT" : isFl ? "ABSENT" : "DEFICIENT"}</span> : null;
    return <div className={`cinr ${cls}`} key={i}><span className="cion">{icon}</span><span className="citx">{l.replace(/\[[ xX✓✗⚠]\]/, "").trim()}</span>{bg}</div>;
  })}</div>;
}

function AppellatePatternTable({ raw }) {
  if (!raw) return <p className="empty">No appellate analysis.</p>;
  const blocks = raw.split(/\n(?=PATTERN:)/).filter(Boolean);
  const pats = blocks.map(b => ({
    name: (b.match(/PATTERN:\s*(.+)/) || [])[1]?.trim() || "",
    rec: (b.match(/RECEPTIVE_TO:\s*([\s\S]+?)(?=\nRESISTANT_TO:|$)/) || [])[1]?.trim() || "",
    res: (b.match(/RESISTANT_TO:\s*([\s\S]+?)(?=\nOVERALL_PREDICTION:|$)/) || [])[1]?.trim() || "",
    pred: (b.match(/OVERALL_PREDICTION:\s*(.+)/) || [])[1]?.trim() || "",
  })).filter(j => j.name);
  const g = re => (raw.match(re) || [])[1]?.trim() || "";
  const bx = (label, val) => val ? <div className="ibox"><div className="apl">{label}</div><pre className="ipre">{val}</pre></div> : null;
  const pc = p => { const l = (p || "").toLowerCase(); return l.includes("strong reversal") ? "ps" : l.includes("reversal possible") ? "pp" : l.includes("dismissal") ? "pd2" : "pa2"; };
  return <>
    {pats.length > 0 && <><div className="apl">Appellate Pattern Analysis</div><div className="tw"><table className="apt">
      <thead><tr><th>Pattern</th><th>Receptive To</th><th>Resistant To</th><th>Prediction</th></tr></thead>
      <tbody>{pats.map((j, i) => <tr key={i}><td className="jc">{j.name}</td><td className="smc">{j.rec || "—"}</td><td className="smc">{j.res || "—"}</td><td><span className={`pd ${pc(j.pred)}`}>{j.pred || "—"}</span></td></tr>)}</tbody>
    </table></div></>}
    {bx("Panel Analysis", g(/PANEL_ANALYSIS:\s*([\s\S]+?)(?=\nSTRONGEST|$)/))}
    {bx("Strongest Grounds (Ranked)", g(/STRONGEST_GROUNDS:\s*([\s\S]+?)(?=\nSTRATEGY:|$)/))}
    {bx("Recommended Appellate Strategy", g(/STRATEGY:\s*([\s\S]+?)$/))}
  </>;
}

function Citations({ raw }) {
  if (!raw) return <p className="empty">No citation data.</p>;
  const blocks = raw.split(/\n(?=CITATION:)/).filter(Boolean);
  if (!blocks.length) return <pre className="pre">{raw}</pre>;
  return <div className="ctl">{blocks.map((b, i) => {
    const g = re => (b.match(re) || [])[1]?.trim() || "";
    const cit = g(/CITATION:\s*(.+)/); const st = g(/STATUS:\s*(.+)/); const nt = g(/NOTE:\s*([\s\S]+?)(?=\n[A-Z]+:|$)/);
    const cl = st.toLowerCase().includes("verified") ? "cok" : st.toLowerCase().includes("flag") ? "cfg" : "cwn";
    return <div className={`ctr ${cl}`} key={i}><div className="cref">{cit}</div><div className="cmt"><span className="csbg">{st}</span>{nt && <span className="cnt">{nt}</span>}</div></div>;
  })}</div>;
}

function Checklist({ raw }) {
  if (!raw) return <p className="empty">No checklist data.</p>;
  return <div className="cll2">{raw.split("\n").filter(l => l.trim()).map((l, i) => {
    const isH = /^[A-Z\s]+:$/.test(l.trim());
    const isP = /PASS/i.test(l); const isF = /FAIL/i.test(l);
    if (isH) return <div className="clh" key={i}>{l.trim()}</div>;
    const cls = isP ? "cp" : isF ? "cf" : "";
    const icon = isP ? "✓" : isF ? "✗" : "·";
    const bg = (isP || isF) ? <span className={`clbg ${isP ? "bp" : "bf"}`}>{isP ? "PASS" : "FAIL"}</span> : null;
    return <div className={`clr ${cls}`} key={i}><span className="clic">{icon}</span><span>{l.replace(/\[[ xX]\]/, "").replace(/PASS|FAIL/gi, "").trim()}</span>{bg}</div>;
  })}</div>;
}

function Editor({ text, dlName }) {
  const [val, setVal] = useState(text || "No content generated.");
  const dl = () => downloadText(val, dlName);
  return <>
    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", marginBottom: 7 }}>Click inside to edit. Download saves your changes.</div>
    <div className="ed-bar"><button className="btn-sm b-dl" onClick={dl}>⬇ Download</button></div>
    <textarea className="meditor" value={val} onChange={e => setVal(e.target.value)} />
  </>;
}

// ── THEORY RESPONSE RENDERER ──────────────────────────────────────────────────

function TheoryResponse({ raw, promptNum }) {
  if (!raw) return null;
  const g = re => (raw.match(re) || [])[1]?.trim() || "";
  const inner = (() => { const m = raw.match(/---THEORY_EVAL---([\s\S]+?)---END_THEORY---/); return m ? m[1].trim() : raw; })();
  const verdict = g.call(null, /VERDICT:\s*(.+)/i) || "";
  const strength = g.call(null, /STRENGTH_RATING:\s*(.+)/i) || "";
  const fit = g.call(null, /FRAMEWORK_FIT:\s*(.+)/i) || "";
  const anchor = g.call(null, /CINC_ANCHOR:\s*(.+)/i) || "";
  const analysis = (inner.match(/ANALYSIS:\s*([\s\S]+?)(?=REDIRECT:|DEEPER_RESEARCH:|FINAL_VERDICT:|$)/i) || [])[1]?.trim() || "";
  const redirect = (inner.match(/REDIRECT:\s*([\s\S]+?)(?=DEEPER_RESEARCH:|FINAL_VERDICT:|$)/i) || [])[1]?.trim() || "";
  const deeper = (inner.match(/DEEPER_RESEARCH:\s*([\s\S]+?)(?=FINAL_VERDICT:|$)/i) || [])[1]?.trim() || "";
  const final = (inner.match(/FINAL_VERDICT:\s*([\s\S]+?)$/i) || [])[1]?.trim() || "";

  const vclass = v => {
    const l = (v || "").toLowerCase();
    if (l.includes("sustains")) return "tv-sustains";
    if (l.includes("needs")) return "tv-develop";
    if (l.includes("outside")) return "tv-outside";
    return "tv-weak";
  };
  const sclass = s => {
    const l = (s || "").toLowerCase();
    if (l.includes("strong")) return "tv-sustains";
    if (l.includes("moderate")) return "tv-develop";
    return "tv-weak";
  };
  const field = (lbl, val) => val ? <div className="tv-field"><div className="tv-field-lbl">{lbl}</div><div className="tv-field-val">{val}</div></div> : null;

  return (
    <div className="tmsg">
      <div className="tmsg-hdr">
        <span className="tmsg-role assistant">⚖ Theory Evaluation {promptNum > 1 ? `— Deeper Research (Prompt ${promptNum})` : ""}</span>
      </div>
      <div className="tmsg-body" style={{ background: "var(--ink)" }}>
        <div className="tv-row">
          {verdict && <span className={`tv-badge ${vclass(verdict)}`}>{verdict}</span>}
          {strength && <span className={`tv-badge ${sclass(strength)}`}>{strength}</span>}
          {fit && <span className="tv-badge" style={{ background: "var(--raised)", color: "var(--mid)", border: "1px solid var(--bdr2)" }}>{fit}</span>}
        </div>
        {anchor && field("CINC Statutory Anchor", anchor)}
        {analysis && field("Analysis", analysis)}
        {redirect && <div className="tv-redirect"><div className="tv-redirect-lbl">↩ Redirect to Stronger Ground</div><div className="tv-field-val">{redirect}</div></div>}
        {deeper && <div className="tv-deeper"><div className="tv-deeper-lbl">🔍 Deeper Research — Unpublished & Recent Opinions</div><div className="tv-field-val">{deeper}</div></div>}
        {final && <div className="tv-final"><div className="tv-final-lbl">Final Verdict</div>{final}</div>}
        {!analysis && !redirect && !deeper && !final && <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "var(--mid)" }}>{raw}</pre>}
      </div>
    </div>
  );
}

// ── THEORY TAB ────────────────────────────────────────────────────────────────

function TheoryTab({ analysisContext }) {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState("");
  const promptCount = msgs.filter(m => m.role === "user").length;

  const submit = async () => {
    if (!input.trim() || running) return;
    const userMsg = input.trim();
    setInput("");
    setErr("");
    setRunning(true);
    const newMsgs = [...msgs, { role: "user", content: userMsg }];
    setMsgs(newMsgs);
    try {
      const contextNote = analysisContext
        ? `\n\n[CONTEXT: The user has run a prior analysis. Key findings available for reference: ${analysisContext.slice(0, 600)}...]`
        : "";
      const promptNum = newMsgs.filter(m => m.role === "user").length;
      const sysWithCtx = THEORY_SYS + contextNote + (promptNum >= 2 ? "\n\nIMPORTANT: This is the user's SECOND or subsequent prompt on this theory. You MUST include the DEEPER_RESEARCH section with unpublished Kansas opinions, recent 2024-2026 opinions, sister-state authority, and overlooked statutory basis. Then reaffirm why the analysis-provided statutory grounds are stronger." : "");
      const apiMsgs = newMsgs.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system: sysWithCtx, messages: apiMsgs })
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || "API error " + res.status); }
      const d = await res.json();
      const reply = d.content.filter(b => b.type === "text").map(b => b.text).join("\n");
      setMsgs([...newMsgs, { role: "assistant", content: reply, promptNum }]);
    } catch (e) { setErr(e.message || "Theory evaluation failed."); setMsgs(newMsgs); }
    setRunning(false);
  };

  const dlTheory = () => {
    const lines = ["KANSAS LEGAL INTELLIGENCE SUITE — THEORY EVALUATION", `Generated: ${new Date().toLocaleString()}`, "═".repeat(72), "", "DISCLAIMER: Research and drafting assistance only. Verify all citations before filing.", "", "═".repeat(72)];
    msgs.forEach(m => { lines.push("", `[${m.role.toUpperCase()}]`, m.content); });
    lines.push("", "═".repeat(72), "END OF THEORY SESSION");
    downloadText(lines.join("\n"), "theory-evaluation.txt");
  };

  return (
    <div className="theory-wrap">
      <div className="theory-intro">
        <strong>Theory Evaluator</strong> — Describe a legal theory or argument you're considering. This tool evaluates whether it sustains within the K.S.A. 38-2201 et seq. CINC framework, identifies its statutory anchor, and rates its appellate strength.<br /><br />
        If your theory strays outside the CINC framework, this tool will explain why and redirect you to the strongest grounds from your analysis. If you press the same theory a second time, it digs deeper into unpublished and recent case law before delivering a final verdict.
      </div>
      <div className="theory-input-wrap">
        <div className="theory-lbl">Describe your theory or argument</div>
        <textarea className="theory-inp" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) submit(); }} placeholder="Example: The agency violated my due process rights by failing to provide the 14-day notice required under K.S.A. 38-2258 before moving my child to a new placement..." />
        <div className="theory-meta">
          <button className={`btn-run btn-t${running ? " running" : ""}`} style={{ width: "auto", margin: 0, padding: "9px 22px" }} disabled={!input.trim() || running} onClick={submit}>
            {running ? "⟳ Evaluating…" : promptCount === 0 ? "⚖ Evaluate Theory" : promptCount === 1 ? "🔍 Press Further — Deeper Research" : "⚖ Evaluate Again"}
          </button>
          {promptCount > 0 && <span className={`theory-count ${promptCount >= 1 ? "second" : ""}`}>{promptCount === 1 ? "⚠ Next prompt triggers deeper unpublished case law research" : `Prompt ${promptCount + 1} — deep research active`}</span>}
          {msgs.length > 0 && <button className="btn-sm b-dl" onClick={dlTheory}>⬇ Download Session</button>}
        </div>
      </div>
      {err && <div className="errb">⚠ {err}</div>}
      <div className="theory-msgs">
        {msgs.map((m, i) => m.role === "user"
          ? <div className="tmsg" key={i}><div className="tmsg-hdr"><span className="tmsg-role user">Your Theory / Question</span></div><div className="tmsg-body user">{m.content}</div></div>
          : <TheoryResponse key={i} raw={m.content} promptNum={m.promptNum} />
        )}
      </div>
    </div>
  );
}

// ── FILE READER ───────────────────────────────────────────────────────────────

async function readFile(file) {
  if (file.type === "application/pdf") {
    return { type: "pdf", data: await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = () => rej(new Error("Read failed")); r.readAsDataURL(file); }) };
  }
  return { type: "text", data: await file.text() };
}

async function callClaude(system, fileData) {
  let messages;
  if (fileData.type === "pdf") {
    messages = [{ role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: fileData.data } }, { type: "text", text: "Analyze the uploaded document as instructed. Be thorough — do not skip or abbreviate any section." }] }];
  } else {
    messages = [{ role: "user", content: "Analyze the following document as instructed. Be thorough — do not skip or abbreviate any section.\n\n---DOCUMENT---\n" + fileData.data }];
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 8000, system, messages })
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || "API error " + res.status); }
  const d = await res.json();
  return d.content.filter(b => b.type === "text").map(b => b.text).join("\n");
}

function UploadZone({ icon, label, hint, onFile, fileName }) {
  const [drag, setDrag] = useState(false);
  const accept = f => {
    if (!f) return;
    const ok = f.type === "application/pdf" || f.type === "text/plain" || f.name.endsWith(".txt") || f.name.endsWith(".docx") || f.name.endsWith(".doc");
    if (ok) onFile(f);
  };
  return (
    <div className={`upz${drag ? " drag" : ""}`} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); accept(e.dataTransfer.files[0]); }}>
      <input type="file" accept=".pdf,.txt,.docx,.doc" onChange={e => accept(e.target.files[0])} />
      <div className="uz-ico">{icon}</div>
      <div className="uz-lbl">{label}</div>
      <div className="uz-hint">{hint}</div>
      {fileName && <div className="uz-fn">📎 {fileName}</div>}
    </div>
  );
}

// ── RESULT TAB PANELS ─────────────────────────────────────────────────────────

function AppellateResultPanel({ raw, fileName }) {
  const tabs = [
    { id: "scorecard", label: "Appellate Scorecard" },
    { id: "firstimp", label: "First Impression" },
    { id: "ruling", label: "Likely Ruling" },
    { id: "structural", label: "Structural Errors" },
    { id: "caselaw", label: "Case Law & Statutes" },
    { id: "citations", label: "Citation Check" },
    { id: "checklist", label: "Filing Checklist" },
    { id: "editor", label: "Revised Motion ✏", edit: true },
  ];
  const [active, setActive] = useState("scorecard");
  const render = () => {
    switch (active) {
      case "scorecard": return <Scorecard raw={sec(raw, "S1_SCORECARD")} />;
      case "firstimp": return <FirstImp raw={sec(raw, "S2_FIRSTIMP")} />;
      case "ruling": return <pre className="pre">{sec(raw, "S3_RULING") || "No ruling analysis."}</pre>;
      case "structural": return <DefectList raw={sec(raw, "S4_STRUCTURAL")} />;
      case "caselaw": return <CaseLaw raw={sec(raw, "S5_CASELAW")} />;
      case "citations": return <Citations raw={sec(raw, "S7_CITATIONS")} />;
      case "checklist": return <Checklist raw={sec(raw, "S8_CHECKLIST")} />;
      case "editor": return <Editor text={sec(raw, "S6_MOTION")} dlName={`revised-motion-${(fileName || "doc").replace(/\.[^.]+$/, "")}.txt`} />;
      default: return null;
    }
  };
  return <>
    <div className="dl-bar">
      <button className="btn-dl" onClick={() => downloadText(buildDownloadText(raw, "app"), `appellate-analysis-${(fileName || "doc").replace(/\.[^.]+$/, "")}.txt`)}>⬇ Download Full Analysis</button>
    </div>
    <div className="stabs-wrap"><div className="stabs">{tabs.map(t => <button key={t.id} className={`stab${t.edit ? " edit-tab" : ""}${active === t.id ? " active" : ""}`} onClick={() => setActive(t.id)}>{t.label}</button>)}</div></div>
    <div className="spanel">{render()}</div>
  </>;
}

function DistrictResultPanel({ raw, fileName }) {
  const tabs = [
    { id: "summary", label: "Order Summary" },
    { id: "structural", label: "Structural Errors" },
    { id: "jurisdiction", label: "Jurisdiction" },
    { id: "dueprocess", label: "Due Process" },
    { id: "fraud", label: "60-260(b) Grounds" },
    { id: "constitutional", label: "Constitutional" },
    { id: "cinc", label: "CINC Checklist" },
    { id: "appellate", label: "Appellate Success" },
    { id: "vacate", label: "Vacate Framework ✏", edit: true },
  ];
  const [active, setActive] = useState("summary");
  const render = () => {
    switch (active) {
      case "summary": return <pre className="pre">{sec(raw, "D1_SUMMARY") || "No summary extracted."}</pre>;
      case "structural": return <DefectList raw={sec(raw, "D2_STRUCTURAL")} />;
      case "jurisdiction": return <DefectList raw={sec(raw, "D3_JURISDICTION")} />;
      case "dueprocess": return <DefectList raw={sec(raw, "D4_DUEPROCESS")} />;
      case "fraud": return <DefectList raw={sec(raw, "D5_FRAUD")} />;
      case "constitutional": return <DefectList raw={sec(raw, "D6_CONSTITUTIONAL")} />;
      case "cinc": return <CincCheck raw={sec(raw, "D7_CINC")} />;
      case "appellate": return <AppellatePatternTable raw={sec(raw, "D8_APPELLATE")} />;
      case "vacate": return <Editor text={sec(raw, "D9_VACATE")} dlName={`vacate-framework-${(fileName || "doc").replace(/\.[^.]+$/, "")}.txt`} />;
      default: return null;
    }
  };
  return <>
    <div className="dl-bar">
      <button className="btn-dl" onClick={() => downloadText(buildDownloadText(raw, "dst"), `district-analysis-${(fileName || "doc").replace(/\.[^.]+$/, "")}.txt`)}>⬇ Download Full Analysis</button>
    </div>
    <div className="stabs-wrap"><div className="stabs">{tabs.map(t => <button key={t.id} className={`stab${t.edit ? " edit-tab" : ""}${active === t.id ? " active" : ""}`} onClick={() => setActive(t.id)}>{t.label}</button>)}</div></div>
    <div className="spanel">{render()}</div>
  </>;
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("app");
  const [aFile, setAFile] = useState(null);
  const [dFile, setDFile] = useState(null);
  const [aRunning, setARunning] = useState(false);
  const [dRunning, setDRunning] = useState(false);
  const [aErr, setAErr] = useState("");
  const [dErr, setDErr] = useState("");
  const [aRaw, setARaw] = useState(null);
  const [dRaw, setDRaw] = useState(null);

  const runApp = async () => {
    if (!aFile) return;
    setAErr(""); setARunning(true); setARaw(null);
    try { const fd = await readFile(aFile); setARaw(await callClaude(AP, fd)); }
    catch (e) { setAErr(e.message || "Analysis failed."); }
    setARunning(false);
  };

  const runDst = async () => {
    if (!dFile) return;
    setDErr(""); setDRunning(true); setDRaw(null);
    try { const fd = await readFile(dFile); setDRaw(await callClaude(DP, fd)); }
    catch (e) { setDErr(e.message || "Analysis failed."); }
    setDRunning(false);
  };

  // Pass a brief context snippet to the theory tab so it can reference prior analysis
  const analysisContext = aRaw
    ? `[APPELLATE ANALYSIS] ${sec(aRaw, "S3_RULING")} | Strongest: ${sec(aRaw, "S4_STRUCTURAL").slice(0, 300)}`
    : dRaw
    ? `[DISTRICT ANALYSIS] ${sec(dRaw, "D1_SUMMARY")} | Key defects: ${sec(dRaw, "D2_STRUCTURAL").slice(0, 300)}`
    : null;

  return (
    <div className="suite">
      <style>{css}</style>
      <div className="hdr">
        <div className="hdr-eye">Kansas Legal Intelligence Suite</div>
        <div className="hdr-title">Kansas Appellate Analysis Tool</div>
      </div>
      <div className="ptabs">
        <button className={`ptab${tab === "app" ? " active-a" : ""}`} onClick={() => setTab("app")}>📄 Appellate Analyzer</button>
        <button className={`ptab${tab === "dst" ? " active-d" : ""}`} onClick={() => setTab("dst")}>⚖ District Analyzer</button>
        <button className={`ptab${tab === "theory" ? " active-t" : ""}`} onClick={() => setTab("theory")}>🧪 Theory Lab</button>
      </div>
      <div className="main">
        <div className="disc">⚠️ Research and drafting assistance only. All outputs must be independently verified. Nothing here constitutes legal advice. Consult a qualified Kansas attorney before filing.</div>
        {tab === "app" && <>
          <UploadZone icon="📄" label="Drop your appeal motion here, or click to select" hint="PDF · TXT · DOCX" onFile={setAFile} fileName={aFile?.name} />
          {aErr && <div className="errb">⚠ {aErr}</div>}
          <button className={`btn-run btn-a${aRunning ? " running" : ""}`} disabled={!aFile || aRunning} onClick={runApp}>
            {aRunning ? "⟳ Analyzing — please wait…" : "▶ Analyze Appeal Motion"}
          </button>
          {aRaw && <AppellateResultPanel raw={aRaw} fileName={aFile?.name} />}
        </>}
        {tab === "dst" && <>
          <UploadZone icon="⚖️" label="Drop the district court order or memorandum here" hint="PDF · TXT · DOCX — orders, memoranda, journal entries, decisions" onFile={setDFile} fileName={dFile?.name} />
          {dErr && <div className="errb">⚠ {dErr}</div>}
          <button className={`btn-run btn-d${dRunning ? " running" : ""}`} disabled={!dFile || dRunning} onClick={runDst}>
            {dRunning ? "⟳ Analyzing — please wait…" : "⚖ Analyze Order / Memorandum"}
          </button>
          {dRaw && <DistrictResultPanel raw={dRaw} fileName={dFile?.name} />}
        </>}
        {tab === "theory" && <TheoryTab analysisContext={analysisContext} />}
      </div>
      <div className="footer">Kansas Legal Intelligence Suite · All outputs for research purposes only · Verify all citations before filing</div>
    </div>
  );
}
