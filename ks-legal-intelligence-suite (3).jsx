import { useState, useRef, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const MODEL = "claude-sonnet-4-6";
const API   = "https://api.anthropic.com/v1/messages";

const CINC_STATUTES = {
  "38-2201": "Purpose & policy — family preservation, least-restrictive intervention, child safety paramount.",
  "38-2202": "Definitions — 'child in need of care', grounds (d)(1)–(d)(11).",
  "38-2242": "Ex parte protective custody orders — probable cause required; verified application; K.S.A. 38-2243 hearing within 72 hrs.",
  "38-2243": "Temporary custody hearing — within 72 hrs of removal; rights to be present, heard, counsel.",
  "38-2249": "(b)(1) — Court may NOT rely on unadmitted reports; social file must be admitted before relied upon.",
  "38-2255": "Disposition — reintegration plan, visitation, placement; (d) placement change procedures.",
  "38-2258": "14-Day Notice — change of placement; opportunity for hearing; mandatory advance notice.",
  "38-2264": "(k) Permanency — mandatory prerequisites before custody order: (1) permanency-achieved finding; (2) completed parenting plan per K.S.A. 23-3213; (3) inquiry whether civil custody case pending. (k)(2): certified copy filed in civil case; civil court independently decides adoption after consultation. (l): court shall close case only when permanency achieved to court's satisfaction.",
  "38-2269": "Unfitness — findings required before parental rights termination or custody shift; specific grounds enumerated.",
  "38-2273": "Appeals — any party may appeal orders of temporary custody, adjudication, disposition, unfitness, or TPR. Priority docket. (e): verification required or appeal dismissed. (f): district court retains jurisdiction over non-appealed issues during appeal.",
  "38-2279": "Child support registration — does NOT confer jurisdiction for custody, residency, or parenting time in registration case.",
  "38-2321": "(c) — Registration of child support order does NOT confer jurisdiction in registration case for custody or parenting time.",
  "60-258":  "Journal entry required — judgment not effective until signed by judge AND filed with clerk. Filing date = judgment date.",
  "60-260":  "(b) Relief from judgment — (b)(4) void judgment; (b)(6) any other reason justifying relief. No time limit on void judgment.",
  "60-270":  "(d) 'Closed' defined — order terminating action filed AND all appeals terminated OR time for appeal expired.",
  "23-2210": "(d) CINC order takes precedence over parentage orders until CINC jurisdiction terminated. (e) Transfer procedure: certified copy filed in civil case; civil court consults CINC court; enters independent order.",
  "23-3201": "Best interests — primary consideration in all custody determinations.",
  "23-3203": "Best interest factors — (a)(1)-(17) enumerated; court shall consider all relevant factors.",
  "23-3213": "Parenting plan — mandatory contents; court shall complete before entering custody order under K.S.A. 38-2264(k).",
};

const CASE_LAW = [
  { cite: "In re B.H., 64 Kan. App. 2d 480 (2024)", rule: "Court must conduct meaningful judicial inquiry before allowing appointed CINC counsel to withdraw. Failure to inquire = due process violation. Court may not simply grant withdrawal and order parent to proceed pro se at critical hearing." },
  { cite: "In re A.S., 319 Kan. 396 (2024)", rule: "Structural error — denial of right to testify at CINC hearing is reversible error without harmless error analysis." },
  { cite: "Troxel v. Granville, 530 U.S. 57 (2000)", rule: "Parent's liberty interest in care, custody, and control of child is fundamental constitutional right. State must provide compelling justification to override." },
  { cite: "State v. Marks, 14 Kan. App. 2d 594 (1990)", rule: "Under K.S.A. 60-258, entry of judgment is when journal entry is filed — not when order is orally pronounced." },
  { cite: "Daniels v. Chaffee, 230 Kan. 32 (1981)", rule: "Time for postjudgment remedies runs from date parties are notified of judgment. Failure to serve affects deadlines." },
  { cite: "In re N.A.C., 299 Kan. 1100 (2014)", rule: "Termination of parental rights is last appealable CINC order under K.S.A. 38-2273; later orders not subject to appellate review." },
  { cite: "In re D.M.M., 38 Kan. App. 2d 394 (2007)", rule: "Four types of appealable CINC orders: temporary custody, adjudication, disposition, finding of unfitness or TPR." },
  { cite: "In re A.A.-F., 310 Kan. 125 (2019)", rule: "Failure to conduct permanency hearing within 30-day statutory timeframe does not automatically violate due process, but procedural failures are cumulative." },
  { cite: "Uhock v. Sleitweiler, 13 Kan. App. 2d 621 (1988)", rule: "Premature notice of appeal becomes effective when journal entry is filed." },
  { cite: "K.S.A. 60-2103(a)", rule: "30-day appeal clock runs from entry of judgment under K.S.A. 60-258 — journal entry date, not oral ruling date." },
];

const PATTERNS = {
  A: "Attorney withdrawal without required judicial inquiry (In re B.H.)",
  B: "No sworn testimony taken at critical hearing",
  C: "K.S.A. 38-2264(k) prerequisites unmet — no permanency finding, no parenting plan, no (k)(1) inquiry",
  D: "K.S.A. 60-258 violation — case closed before journal entry legally existed",
  E: "Domestic order filed in Title IV-D case — no custody jurisdiction per K.S.A. 38-2279 / 38-2321(c)",
  F: "Wrong attorney filed domestic order — CINC-only counsel, no authority in domestic case",
  G: "Wrong judge signed domestic order — CINC judge, no assignment to domestic case",
  H: "Ex parte domestic order — no notice, no motion, no hearing, no service on Mother",
  I: "Domestic order pre-dates CINC journal entry by 4 days — implements non-existent judgment",
  J: "Adjudication by Father's plea only — Mother contested; no unfitness finding against Mother",
  K: "Parenting time 'at Father's discretion' — unconstitutional delegation of judicial function to adverse party",
  L: "KVC rerouted court-ordered reintegration goal without court authorization",
};

// ─── API CALL ─────────────────────────────────────────────────────────────────

async function callClaude(messages, system) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 1000, system, messages }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.find(b => b.type === "text")?.text || "";
}

// ─── SYSTEM PROMPTS ───────────────────────────────────────────────────────────

const APPELLATE_SYSTEM = `You are a Kansas CINC appellate specialist. Analyze the provided document against the following framework and return ONLY valid JSON in the exact schema below — no prose, no markdown, no backticks.

PATTERNS TO DETECT (return true/false for each):
A: Attorney withdrawal without required In re B.H. judicial inquiry
B: No sworn testimony at critical hearing
C: K.S.A. 38-2264(k) prerequisites unmet (no permanency finding, no parenting plan, no (k)(1) inquiry)
D: K.S.A. 60-258 violation — closure before journal entry existed
E: Domestic order in Title IV-D case (K.S.A. 38-2279/38-2321(c) jurisdiction bar)
F: Wrong attorney filed domestic order (CINC-only counsel)
G: Wrong judge signed domestic order (no assignment to domestic case)
H: Ex parte domestic order — no notice/motion/hearing/service
I: Domestic order pre-dates CINC journal entry
J: Adjudication by Father's plea only — Mother contested, no unfitness finding
K: Parenting time at Father's discretion — unconstitutional delegation
L: KVC rerouted reintegration goal without court order

Required JSON schema:
{
  "patterns": {"A":bool,"B":bool,"C":bool,"D":bool,"E":bool,"F":bool,"G":bool,"H":bool,"I":bool,"J":bool,"K":bool,"L":bool},
  "firstImpression": "string — what a Court of Appeals panel will notice first",
  "structuralErrors": ["string","string",...],
  "strongestGrounds": ["string","string","string"],
  "weakestGrounds": ["string"],
  "citationsDetected": ["K.S.A. X","..."],
  "missingFindings": ["string",...],
  "appealabilityScore": number 1-10,
  "summary": "string 2-3 sentences"
}`;

const DISTRICT_SYSTEM = `You are a Kansas CINC district court specialist. Analyze the provided document and return ONLY valid JSON — no prose, no markdown, no backticks.

Required JSON schema:
{
  "procedural": {
    "noticGiven": bool,
    "hearingHeld": bool,
    "swornTestimony": bool,
    "counselPresent": bool,
    "parentingPlanCompleted": bool,
    "permanencyFindingMade": bool,
    "k1InquiryOnRecord": bool,
    "unfitnessFindingMade": bool,
    "servedOnAllParties": bool
  },
  "statutory": {
    "38-2264k_prerequisites_met": bool,
    "60-258_judgment_effective": bool,
    "jurisdiction_proper": bool,
    "38-2269_findings_present": bool
  },
  "voidGrounds": ["string",...],
  "emergencyReliefBasis": "string",
  "recommendedMotions": ["string",...],
  "filingDeadlines": {"appealDeadline":"string","paperReview":"string","notes":"string"},
  "summary": "string"
}`;

const THEORY_SYSTEM_1 = `You are a Kansas CINC statutory specialist. A user is proposing a legal theory for their case. Evaluate it against the Kansas Code for Care of Children (K.S.A. 38-2201 et seq.), the Kansas appellate framework (K.S.A. 38-2273), and controlling case law including In re B.H. (2024), In re A.S. (2024), and Troxel v. Granville (2000).

Respond in this structure:
1. FRAMEWORK FIT (Strong/Moderate/Weak/Off-Frame): Does this theory map to an appealable CINC order or a cognizable district court motion?
2. STATUTORY ANCHOR: Which statute or statutes provide the hook?
3. APPELLATE STRENGTH: How has the Kansas Court of Appeals treated this type of argument?
4. REDIRECT (if off-frame): What stronger theory does the facts suggest instead?
5. BOTTOM LINE: One sentence verdict on viability.

If the theory is completely off-frame from CINC law, explain why respectfully and redirect to stronger grounds from the analysis context provided.`;

const THEORY_SYSTEM_2 = `You are a Kansas CINC appellate research specialist conducting a second-layer deep dive. The user has persisted with a theory. Your job now is to:

1. Search your knowledge for UNPUBLISHED Kansas Court of Appeals opinions (2020-2026) that may support or distinguish this theory
2. Identify any RECENT opinions (2024-2026) from Kansas appellate courts that shifted the framework
3. Look for SISTER-STATE authority from courts applying similar CINC/dependency statutory frameworks
4. Identify any OVERLOOKED statutory bases beyond the obvious ones
5. After this deeper research, provide a FINAL ASSESSMENT: does the original analysis-provided statutory basis remain stronger, or has the deep dive surfaced a viable alternative route?

Be honest. If the theory remains weak even after deep research, say so and explain why the analysis grounds are more solid.`;

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Badge({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "3px 10px",
        borderRadius: 4,
        border: `1px solid ${active ? "#8b0000" : "#ccc"}`,
        background: active ? "#8b0000" : "#f5f5f5",
        color: active ? "white" : "#333",
        fontSize: 12,
        cursor: "pointer",
        fontFamily: "Georgia, serif",
        margin: "2px",
      }}
    >
      {label}
    </button>
  );
}

function Card({ title, children, accent }) {
  return (
    <div style={{
      border: `1px solid ${accent ? "#8b0000" : "#ddd"}`,
      borderLeft: `4px solid ${accent ? "#8b0000" : "#ccc"}`,
      borderRadius: 4,
      padding: "12px 16px",
      marginBottom: 12,
      background: "white",
    }}>
      {title && <div style={{ fontWeight: "bold", fontSize: 13, marginBottom: 6, color: "#1a1a1a", fontFamily: "Georgia, serif" }}>{title}</div>}
      <div style={{ fontSize: 13, lineHeight: 1.6, color: "#333" }}>{children}</div>
    </div>
  );
}

function PatternGrid({ patterns }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {Object.entries(PATTERNS).map(([k, desc]) => (
        <div key={k} style={{
          display: "flex", alignItems: "flex-start", gap: 8,
          padding: "8px 10px",
          borderRadius: 4,
          background: patterns[k] ? "rgba(139,0,0,0.06)" : "#f9f9f9",
          border: `1px solid ${patterns[k] ? "#8b0000" : "#e0e0e0"}`,
        }}>
          <span style={{
            minWidth: 20, height: 20, borderRadius: "50%",
            background: patterns[k] ? "#8b0000" : "#ccc",
            color: "white", fontSize: 10, display: "flex",
            alignItems: "center", justifyContent: "center", fontWeight: "bold",
          }}>{k}</span>
          <span style={{ fontSize: 12, lineHeight: 1.4, color: patterns[k] ? "#1a1a1a" : "#888" }}>{desc}</span>
        </div>
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 0", color: "#8b0000" }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%",
        border: "2px solid #8b0000", borderTopColor: "transparent",
        animation: "spin 0.8s linear infinite",
      }} />
      <span style={{ fontSize: 13, fontStyle: "italic" }}>Analyzing…</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── DOWNLOAD HELPER ─────────────────────────────────────────────────────────

function downloadTxt(filename, content) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function buildAppellateTxt(result, docName) {
  const p = result.patterns;
  const detected = Object.entries(p).filter(([,v])=>v).map(([k])=>`  [${k}] ${PATTERNS[k]}`).join("\n");
  return `DOCKET WATCH — APPELLATE ANALYSIS
Document: ${docName}
Generated: ${new Date().toLocaleString()}
${"=".repeat(60)}

APPEALABILITY SCORE: ${result.appealabilityScore}/10

PATTERNS DETECTED:
${detected || "  None detected"}

FIRST IMPRESSION:
  ${result.firstImpression}

STRUCTURAL ERRORS:
${result.structuralErrors.map(e=>`  • ${e}`).join("\n")}

STRONGEST GROUNDS:
${result.strongestGrounds.map(g=>`  • ${g}`).join("\n")}

WEAKEST GROUNDS:
${result.weakestGrounds.map(g=>`  • ${g}`).join("\n")}

MISSING FINDINGS:
${result.missingFindings.map(f=>`  • ${f}`).join("\n")}

CITATIONS DETECTED:
${result.citationsDetected.map(c=>`  • ${c}`).join("\n")}

SUMMARY:
  ${result.summary}

${"=".repeat(60)}
CASE LAW REFERENCE
${CASE_LAW.map(c=>`${c.cite}\n  ${c.rule}`).join("\n\n")}
`;
}

function buildDistrictTxt(result, docName) {
  return `DOCKET WATCH — DISTRICT COURT ANALYSIS
Document: ${docName}
Generated: ${new Date().toLocaleString()}
${"=".repeat(60)}

PROCEDURAL CHECKLIST:
${Object.entries(result.procedural).map(([k,v])=>`  ${v?"✓":"✗"} ${k}`).join("\n")}

STATUTORY COMPLIANCE:
${Object.entries(result.statutory).map(([k,v])=>`  ${v?"✓":"✗"} ${k}`).join("\n")}

VOID GROUNDS:
${result.voidGrounds.map(g=>`  • ${g}`).join("\n")}

EMERGENCY RELIEF BASIS:
  ${result.emergencyReliefBasis}

RECOMMENDED MOTIONS:
${result.recommendedMotions.map(m=>`  • ${m}`).join("\n")}

FILING DEADLINES:
  Appeal Deadline: ${result.filingDeadlines.appealDeadline}
  Paper Review:    ${result.filingDeadlines.paperReview}
  Notes:           ${result.filingDeadlines.notes}

SUMMARY:
  ${result.summary}
`;
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

function AppellateTab({ sessionContext, setSessionContext }) {
  const [file, setFile]       = useState(null);
  const [text, setText]       = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [activeTab, setTab]   = useState("patterns");
  const fileRef               = useRef();

  const analyze = useCallback(async () => {
    if (!text.trim()) { setError("Paste document text or upload a file first."); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const raw = await callClaude(
        [{ role: "user", content: `Analyze this Kansas CINC document:\n\n${text.slice(0, 8000)}` }],
        APPELLATE_SYSTEM
      );
      const json = JSON.parse(raw);
      setResult(json);
      setSessionContext(`APPELLATE ANALYSIS SUMMARY:\nScore: ${json.appealabilityScore}/10\nStrongest: ${json.strongestGrounds.join("; ")}\nPatterns: ${Object.entries(json.patterns).filter(([,v])=>v).map(([k])=>k).join(",")}\nSummary: ${json.summary}`);
    } catch(e) { setError(e.message); }
    setLoading(false);
  }, [text, setSessionContext]);

  const tabs = ["patterns","errors","grounds","citations","checklist"];

  return (
    <div>
      <Card title="Upload or Paste Document">
        <textarea
          rows={6}
          placeholder="Paste CINC document text here (journal entry, order, minute entry, case summary, etc.)…"
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ width: "100%", fontFamily: "Georgia, serif", fontSize: 12, padding: 8, border: "1px solid #ccc", borderRadius: 3, resize: "vertical" }}
        />
        <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => fileRef.current.click()} style={btnStyle("#555")}>Upload File</button>
          <button onClick={analyze} style={btnStyle("#8b0000")} disabled={loading}>Run Appellate Analysis</button>
          {result && <button onClick={() => downloadTxt(`appellate-${file||"analysis"}.txt`, buildAppellateTxt(result, file||"document"))} style={btnStyle("#2a5a2a")}>↓ Download Analysis</button>}
          <input ref={fileRef} type="file" accept=".txt,.pdf,.doc,.docx" style={{ display:"none" }} onChange={e => {
            const f = e.target.files[0]; if (!f) return;
            setFile(f.name);
            const r = new FileReader();
            r.onload = ev => setText(ev.target.result);
            r.readAsText(f);
          }} />
        </div>
        {file && <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>File: {file}</div>}
      </Card>

      {error && <div style={{ color: "#8b0000", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "rgba(139,0,0,0.06)", border: "1px solid #8b0000", borderRadius: 3 }}>{error}</div>}
      {loading && <Spinner />}

      {result && (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {tabs.map(t => <Badge key={t} label={t.toUpperCase()} active={activeTab===t} onClick={()=>setTab(t)} />)}
          </div>

          {activeTab === "patterns" && (
            <>
              <div style={{ marginBottom: 10, padding: "8px 14px", background: "#faf0f0", border: "1px solid #8b0000", borderRadius: 4, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontWeight:"bold", color:"#8b0000", fontFamily:"Georgia, serif" }}>Appealability Score</span>
                <span style={{ fontSize: 22, fontWeight:"bold", color:"#8b0000" }}>{result.appealabilityScore}<span style={{fontSize:14}}>/10</span></span>
              </div>
              <PatternGrid patterns={result.patterns} />
            </>
          )}

          {activeTab === "errors" && (
            <div>
              <Card title="First Impression" accent>{result.firstImpression}</Card>
              {result.structuralErrors.map((e,i) => <Card key={i} title={`Structural Error ${i+1}`} accent>{e}</Card>)}
            </div>
          )}

          {activeTab === "grounds" && (
            <div>
              <Card title="Strongest Grounds" accent>
                {result.strongestGrounds.map((g,i) => <div key={i} style={{marginBottom:4}}>• {g}</div>)}
              </Card>
              <Card title="Weakest / Watch Points">
                {result.weakestGrounds.map((g,i) => <div key={i} style={{marginBottom:4}}>• {g}</div>)}
              </Card>
              <Card title="Missing Findings">
                {result.missingFindings.map((f,i) => <div key={i} style={{marginBottom:4}}>• {f}</div>)}
              </Card>
              <Card title="Summary" accent>{result.summary}</Card>
            </div>
          )}

          {activeTab === "citations" && (
            <div>
              <Card title="Citations Detected in Document">
                {result.citationsDetected.length ? result.citationsDetected.map((c,i)=><div key={i} style={{marginBottom:4}}>• {c}</div>) : <span style={{color:"#888"}}>None detected</span>}
              </Card>
              <Card title="Controlling Case Law">
                {CASE_LAW.map((c,i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight:"bold", fontSize:12, color:"#8b0000" }}>{c.cite}</div>
                    <div style={{ fontSize: 12, color:"#444" }}>{c.rule}</div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {activeTab === "checklist" && (
            <div>
              <Card title="K.S.A. 38-2264(k) Prerequisites Checklist" accent>
                {[
                  "Judicial finding that permanency with one parent has been achieved",
                  "Parenting plan completed pursuant to K.S.A. 23-3213",
                  "On-record inquiry whether civil custody case pending — K.S.A. 38-2264(k)(1)",
                  "If civil case exists: certified copy filed in civil case — K.S.A. 38-2264(k)(2)",
                  "Civil court independently consulted and entered adoption order",
                  "K.S.A. 38-2264(l) closure order entered after permanency achieved",
                ].map((item,i) => (
                  <div key={i} style={{ display:"flex", gap:8, marginBottom:6, fontSize:12 }}>
                    <span style={{ color:"#8b0000", fontWeight:"bold" }}>□</span>
                    <span>{item}</span>
                  </div>
                ))}
              </Card>
              <Card title="K.S.A. 60-258 / 60-270 Timeline Checklist">
                {[
                  "Journal entry signed by judge",
                  "Journal entry filed with clerk — this is the judgment effective date",
                  "All parties served within 3 days (judgment form) — K.S.A. 60-258",
                  "30-day appeal clock starts from journal entry filing date — K.S.A. 60-2103",
                  "Case 'closed' only after appeals terminated or appeal time expired — K.S.A. 60-270(d)",
                ].map((item,i) => (
                  <div key={i} style={{ display:"flex", gap:8, marginBottom:6, fontSize:12 }}>
                    <span style={{ color:"#8b0000", fontWeight:"bold" }}>□</span>
                    <span>{item}</span>
                  </div>
                ))}
              </Card>
              <Card title="Domestic Order Transfer Checklist (K.S.A. 38-2264(k)(2))">
                {[
                  "Attorney filing in domestic case is counsel of record IN THAT CASE",
                  "Judge signing domestic order is assigned to domestic case",
                  "Motion filed in domestic case with notice to all parties",
                  "Hearing held in domestic case — not ex parte",
                  "CINC journal entry already legally exists (K.S.A. 60-258)",
                  "CINC court and domestic court consulted per K.S.A. 38-2264(k)(2)",
                  "Domestic court entered independent best-interest order",
                  "Domestic case is NOT a Title IV-D child support case — K.S.A. 38-2279",
                ].map((item,i) => (
                  <div key={i} style={{ display:"flex", gap:8, marginBottom:6, fontSize:12 }}>
                    <span style={{ color:"#8b0000", fontWeight:"bold" }}>□</span>
                    <span>{item}</span>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DistrictTab({ sessionContext }) {
  const [text, setText]       = useState("");
  const [file, setFile]       = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [activeTab, setTab]   = useState("procedural");
  const fileRef               = useRef();

  const analyze = useCallback(async () => {
    if (!text.trim()) { setError("Paste document text first."); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const raw = await callClaude(
        [{ role: "user", content: `Analyze this Kansas CINC district court document:\n\n${text.slice(0, 8000)}` }],
        DISTRICT_SYSTEM
      );
      setResult(JSON.parse(raw));
    } catch(e) { setError(e.message); }
    setLoading(false);
  }, [text]);

  const tabs = ["procedural","void","motions","deadlines"];

  return (
    <div>
      <Card title="Upload or Paste Document">
        <textarea
          rows={6}
          placeholder="Paste CINC district court document (journal entry, order, minute entry, case summary)…"
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ width:"100%", fontFamily:"Georgia, serif", fontSize:12, padding:8, border:"1px solid #ccc", borderRadius:3, resize:"vertical" }}
        />
        <div style={{ marginTop:8, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <button onClick={() => fileRef.current.click()} style={btnStyle("#555")}>Upload File</button>
          <button onClick={analyze} style={btnStyle("#8b0000")} disabled={loading}>Run District Analysis</button>
          {result && <button onClick={() => downloadTxt(`district-${file||"analysis"}.txt`, buildDistrictTxt(result, file||"document"))} style={btnStyle("#2a5a2a")}>↓ Download Analysis</button>}
          <input ref={fileRef} type="file" accept=".txt,.pdf,.doc,.docx" style={{display:"none"}} onChange={e=>{
            const f=e.target.files[0]; if(!f) return;
            setFile(f.name);
            const r=new FileReader(); r.onload=ev=>setText(ev.target.result); r.readAsText(f);
          }} />
        </div>
      </Card>

      {error && <div style={{ color:"#8b0000", fontSize:13, marginBottom:12, padding:"8px 12px", background:"rgba(139,0,0,0.06)", border:"1px solid #8b0000", borderRadius:3 }}>{error}</div>}
      {loading && <Spinner />}

      {result && (
        <>
          <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
            {tabs.map(t => <Badge key={t} label={t.toUpperCase()} active={activeTab===t} onClick={()=>setTab(t)} />)}
          </div>

          {activeTab === "procedural" && (
            <div>
              <Card title="Procedural Checklist" accent>
                {Object.entries(result.procedural).map(([k,v])=>(
                  <div key={k} style={{display:"flex",gap:8,marginBottom:5,fontSize:12}}>
                    <span style={{color: v?"#2a5a2a":"#8b0000",fontWeight:"bold"}}>{v?"✓":"✗"}</span>
                    <span style={{color: v?"#333":"#8b0000"}}>{k.replace(/([A-Z])/g," $1").replace(/_/g," ")}</span>
                  </div>
                ))}
              </Card>
              <Card title="Statutory Compliance">
                {Object.entries(result.statutory).map(([k,v])=>(
                  <div key={k} style={{display:"flex",gap:8,marginBottom:5,fontSize:12}}>
                    <span style={{color: v?"#2a5a2a":"#8b0000",fontWeight:"bold"}}>{v?"✓":"✗"}</span>
                    <span style={{color: v?"#333":"#8b0000"}}>{k.replace(/_/g," ")}</span>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {activeTab === "void" && (
            <div>
              <Card title="Void Judgment Grounds (K.S.A. 60-260(b))" accent>
                {result.voidGrounds.length
                  ? result.voidGrounds.map((g,i)=><div key={i} style={{marginBottom:6,fontSize:12}}>• {g}</div>)
                  : <span style={{color:"#888"}}>No void grounds identified</span>}
              </Card>
              <Card title="Emergency Relief Basis">{result.emergencyReliefBasis}</Card>
              <Card title="Summary" accent>{result.summary}</Card>
            </div>
          )}

          {activeTab === "motions" && (
            <Card title="Recommended Motions" accent>
              {result.recommendedMotions.map((m,i)=><div key={i} style={{marginBottom:6,fontSize:12}}>• {m}</div>)}
            </Card>
          )}

          {activeTab === "deadlines" && (
            <div>
              <Card title="Filing Deadlines" accent>
                <div style={{fontSize:12,marginBottom:6}}><strong>Appeal Deadline:</strong> {result.filingDeadlines.appealDeadline}</div>
                <div style={{fontSize:12,marginBottom:6}}><strong>Paper Review:</strong> {result.filingDeadlines.paperReview}</div>
                <div style={{fontSize:12}}><strong>Notes:</strong> {result.filingDeadlines.notes}</div>
              </Card>
              <Card title="Critical Deadline: K.S.A. 38-2273(e) Verification" accent>
                Every Notice of Appeal in a CINC case MUST be verified by the appellant if personally served at any time during proceedings. Failure to include verification results in DISMISSAL of the appeal. This is a jurisdictional requirement.
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TheoryTab({ sessionContext }) {
  const [theory, setTheory]   = useState("");
  const [msgs, setMsgs]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const turnRef               = useRef(0);

  const submit = useCallback(async () => {
    if (!theory.trim()) return;
    setError(""); setLoading(true);
    const turn = ++turnRef.current;
    const isSecond = msgs.length >= 2;
    const userMsg = theory.trim();
    const newMsgs = [...msgs, { role:"user", content: userMsg }];
    setMsgs(newMsgs); setTheory("");

    try {
      const system = isSecond ? THEORY_SYSTEM_2 : THEORY_SYSTEM_1;
      const apiMsgs = sessionContext
        ? [{ role:"user", content:`PRIOR ANALYSIS CONTEXT:\n${sessionContext}\n\nUSER THEORY:\n${userMsg}` }, ...newMsgs.slice(1)]
        : newMsgs;
      const reply = await callClaude(apiMsgs.slice(-6), system);
      setMsgs(m => [...m, { role:"assistant", content: reply }]);
    } catch(e) { setError(e.message); }
    setLoading(false);
  }, [theory, msgs, sessionContext]);

  return (
    <div>
      <Card title="Theory Lab" accent>
        Propose a legal theory for your CINC case. The first response evaluates framework fit, statutory anchor, and appellate strength. If you persist or push deeper, the second response conducts a deeper dive into unpublished case law and recent 2024–2026 opinions before providing a final assessment.
        {sessionContext && <div style={{fontSize:11,color:"#666",marginTop:8,fontStyle:"italic"}}>✓ Prior analysis context loaded — theories will be cross-referenced.</div>}
      </Card>

      <div style={{ minHeight: 120, marginBottom: 12 }}>
        {msgs.map((m,i) => (
          <div key={i} style={{
            marginBottom: 10,
            padding: "10px 14px",
            borderRadius: 4,
            background: m.role==="user" ? "rgba(139,0,0,0.05)" : "#f9f9f9",
            border: `1px solid ${m.role==="user" ? "#8b0000" : "#ddd"}`,
          }}>
            <div style={{fontSize:10,fontWeight:"bold",color:"#888",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em"}}>
              {m.role==="user" ? "Your Theory" : "Analysis"}
            </div>
            <div style={{fontSize:12,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{m.content}</div>
          </div>
        ))}
        {loading && <Spinner />}
      </div>

      {error && <div style={{color:"#8b0000",fontSize:13,marginBottom:8}}>{error}</div>}

      <textarea
        rows={4}
        placeholder="Propose a theory (e.g., 'The adjudication is void because Father's plea was submitted without court acceptance on the record…')"
        value={theory}
        onChange={e => setTheory(e.target.value)}
        style={{ width:"100%", fontFamily:"Georgia, serif", fontSize:12, padding:8, border:"1px solid #ccc", borderRadius:3, resize:"vertical", marginBottom:8 }}
        onKeyDown={e => { if(e.key==="Enter" && e.metaKey) submit(); }}
      />
      <div style={{display:"flex",gap:8}}>
        <button onClick={submit} disabled={loading||!theory.trim()} style={btnStyle("#8b0000")}>
          {msgs.length >= 2 ? "Deep Dive →" : "Evaluate Theory →"}
        </button>
        {msgs.length > 0 && <button onClick={()=>{setMsgs([]);turnRef.current=0;}} style={btnStyle("#555")}>Clear</button>}
        {msgs.length > 0 && <button onClick={()=>downloadTxt("theory-lab.txt", msgs.map(m=>`[${m.role.toUpperCase()}]\n${m.content}`).join("\n\n"))} style={btnStyle("#2a5a2a")}>↓ Download</button>}
      </div>
    </div>
  );
}

function ReferenceTab() {
  const [search, setSearch] = useState("");
  const filtered = Object.entries(CINC_STATUTES).filter(([k,v]) =>
    k.includes(search) || v.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      <input
        placeholder="Search statutes…"
        value={search}
        onChange={e=>setSearch(e.target.value)}
        style={{width:"100%",padding:"7px 10px",border:"1px solid #ccc",borderRadius:3,fontFamily:"Georgia, serif",fontSize:12,marginBottom:12}}
      />
      {filtered.map(([k,v])=>(
        <div key={k} style={{marginBottom:10,padding:"8px 12px",borderRadius:4,background:"white",border:"1px solid #ddd",borderLeft:"4px solid #8b0000"}}>
          <div style={{fontWeight:"bold",fontSize:12,color:"#8b0000",fontFamily:"Georgia, serif",marginBottom:3}}>K.S.A. {k}</div>
          <div style={{fontSize:12,color:"#444",lineHeight:1.5}}>{v}</div>
        </div>
      ))}
    </div>
  );
}

// ─── BUTTON STYLE ─────────────────────────────────────────────────────────────

function btnStyle(bg) {
  return {
    background: bg, color:"white", border:"none", padding:"7px 14px",
    borderRadius:3, fontSize:12, cursor:"pointer", fontFamily:"Georgia, serif",
    letterSpacing:"0.02em",
  };
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab]             = useState("appellate");
  const [sessionContext, setCtx]  = useState("");

  const TABS = [
    { id:"appellate", label:"Appellate Analyzer" },
    { id:"district",  label:"District Analyzer" },
    { id:"theory",    label:"Theory Lab" },
    { id:"reference", label:"Statute Reference" },
  ];

  return (
    <div style={{ fontFamily:"Georgia, serif", background:"#f0ede6", minHeight:"100vh", padding:"0 0 40px" }}>

      {/* Header */}
      <div style={{ background:"#8b0000", padding:"18px 24px", marginBottom:0 }}>
        <div style={{ maxWidth:860, margin:"0 auto" }}>
          <div style={{ fontSize:20, fontWeight:"bold", color:"white", letterSpacing:"0.02em" }}>
            DOCKET WATCH
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.75)", letterSpacing:"0.08em", textTransform:"uppercase", marginTop:2 }}>
            Kansas CINC Legal Intelligence Suite · K.S.A. 38-2201 et seq.
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background:"#6b0000", padding:"0 24px" }}>
        <div style={{ maxWidth:860, margin:"0 auto", display:"flex", gap:0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              background: tab===t.id ? "white" : "transparent",
              color: tab===t.id ? "#8b0000" : "rgba(255,255,255,0.8)",
              border:"none", padding:"10px 18px", fontSize:12,
              cursor:"pointer", fontFamily:"Georgia, serif",
              fontWeight: tab===t.id ? "bold" : "normal",
              letterSpacing:"0.03em",
              borderRadius: tab===t.id ? "3px 3px 0 0" : 0,
              marginTop: 4,
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:860, margin:"0 auto", padding:"20px 24px" }}>

        {tab === "appellate" && (
          <div>
            <div style={{ fontSize:11, color:"#888", marginBottom:14, fontStyle:"italic" }}>
              Upload or paste a CINC document to detect appellate patterns, structural errors, and void judgment grounds against the K.S.A. 38-2264(k) framework.
            </div>
            <AppellateTab sessionContext={sessionContext} setSessionContext={setCtx} />
          </div>
        )}

        {tab === "district" && (
          <div>
            <div style={{ fontSize:11, color:"#888", marginBottom:14, fontStyle:"italic" }}>
              District court analysis — procedural checklist, void grounds, recommended motions, and filing deadlines.
            </div>
            <DistrictTab sessionContext={sessionContext} />
          </div>
        )}

        {tab === "theory" && (
          <div>
            <div style={{ fontSize:11, color:"#888", marginBottom:14, fontStyle:"italic" }}>
              Propose a legal theory. Get a two-layer evaluation including deep research into unpublished Kansas appellate opinions.
            </div>
            <TheoryTab sessionContext={sessionContext} />
          </div>
        )}

        {tab === "reference" && (
          <div>
            <div style={{ fontSize:11, color:"#888", marginBottom:14, fontStyle:"italic" }}>
              Kansas CINC statute reference — updated to include K.S.A. 38-2264(k) prerequisite framework and domestic order transfer rules.
            </div>
            <ReferenceTab />
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ maxWidth:860, margin:"0 auto", padding:"0 24px" }}>
        <div style={{ borderTop:"1px solid #ccc", paddingTop:10, fontSize:10, color:"#999", lineHeight:1.5 }}>
          Docket Watch · Kansas CINC Compliance · For informational use only — not legal advice · Always verify statutes and case law against current K.S.A. and Kansas appellate opinions
        </div>
      </div>
    </div>
  );
}
