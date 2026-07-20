# Kansas Legal Intelligence Suite

A browser-based AI legal analysis tool for Kansas appellate and district court documents — built for pro se litigants and attorneys navigating CINC, family law, and civil matters.

**Live app → [https://Minsze-jpg.github.io/ks-legal-suite/](https://Minsze-jpg.github.io/ks-legal-suite/)**

---

## What it does

Upload a Kansas court document (PDF or TXT) and get a structured AI analysis across two modules:

### ⚖ Appellate Analyzer
For Kansas Court of Appeals motions and briefs.

| Tab | What you get |
|---|---|
| Appellate Scorecard | Strength ratings across key appellate dimensions |
| First Impression | How the panel is likely to read the opening |
| Likely Ruling | Predicted outcome with reasoning |
| Structural Errors | Defects in argument structure, preservation, or briefing |
| Case Law & Statutes | Citation analysis and statutory mapping |
| Citation Check | Verification of case citations and K.S.A. references |
| Filing Checklist | Rule 170 / formatting compliance (page limits, headers, margins) |
| Revised Motion ✏ | Editable, downloadable draft with corrections applied |

### 🏛 District Analyzer
For Kansas district court orders, memoranda, and decisions.

| Tab | What you get |
|---|---|
| Order Summary | Plain-language summary of what the order does |
| Structural Errors | Defects in findings, conclusions, or procedural posture |
| Jurisdiction | Jurisdictional basis analysis |
| Due Process | Mathews balancing and notice/hearing defects |
| 60-260(b) Grounds | Subsection-by-subsection vacate analysis with time limits |
| Constitutional | State and federal constitutional issues |
| CINC Checklist | K.S.A. 38-2201 et seq. compliance (38-2242, 38-2255, 38-2258, 38-2243) |
| Appellate Success | Preservation status and appeal viability |
| Vacate Framework ✏ | Editable K.S.A. 60-260(b) motion skeleton, ready to file |

---

## Setup — no installation required

This is a fully static single-file app. There is no server, no backend, and no data ever leaves your browser except the API call to Anthropic.

**You need an Anthropic API key.** Get one at [console.anthropic.com](https://console.anthropic.com).

1. Open the app
2. Paste your API key into the bar at the top (`sk-ant-…`)
3. Upload your document (PDF or TXT — DOCX not supported; convert first)
4. Click **Analyze**

Your API key is held in session memory only and is never stored, logged, or transmitted anywhere except directly to `api.anthropic.com`.

---

## Deploy your own copy

### GitHub Pages (recommended)
```bash
git clone https://github.com/Minsze-jpg/ks-legal-suite.git
cd ks-legal-suite
# Drop index.html in the root
git add index.html
git commit -m "Deploy"
git push
```
Then: **Settings → Pages → Branch: main / root → Save**

### Local (no server needed)
```bash
# Just open the file directly in your browser:
open index.html
# or
python3 -m http.server 8080   # then visit localhost:8080
```

---

## File structure

```
ks-legal-suite/
├── index.html      # The entire app — HTML + CSS + JS, self-contained
└── README.md
```

No `package.json`. No build step. No dependencies. No Docker.

---

## Legal disclaimer

> This tool is for **research and drafting assistance only**. All outputs must be independently verified against current Kansas statutes, court rules, and controlling authority. Nothing produced by this tool constitutes legal advice. The CINC analysis covers statutory citation pattern matching and trigger detection — it does **not** substitute for legal reasoning by a qualified Kansas attorney. Consult a licensed Kansas attorney before filing any document in court.

The mechanical accuracy layer covers: K.S.A. 38-22xx citation detection, trigger-word flagging, date/header parsing, and structured output extraction. Legal reasoning (correct statutory application, constitutional analysis, §1983 elements, objection strategy) requires independent verification against K.S.A. 38-2201 et seq. and current DCF policy, cross-referenced to your case timeline and controlling 10th Circuit authority.

---

## Built with

- [Anthropic Claude API](https://docs.anthropic.com) — `claude-sonnet-4-6`
- Vanilla HTML/CSS/JS — zero frameworks, zero build tools
- Kansas statutes: K.S.A. 38-2201 et seq., K.S.A. 60-260(b), K.A.R. DCF regulations

---

## Contributing / Issues

Open an issue or PR. If you find a statute citation that isn't being detected, or a case law pattern that should be flagged, open an issue with the document excerpt (redact any identifying information first).
