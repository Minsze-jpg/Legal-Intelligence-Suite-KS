# Kansas Legal Intelligence Suite

A browser-based AI legal analysis tool for Kansas appellate and district court documents — built for pro se litigants and attorneys navigating CINC, family law, and civil matters.

**Live app → [https://Minsze-jpg.github.io/Legal-Intelligence-Suite-KS/](https://Minsze-jpg.github.io/Legal-Intelligence-Suite-KS/)**

---

## What it does

Upload a Kansas court document (PDF, DOCX, or TXT) and get a structured AI analysis across two modules:

### ⚖ Appellate Analyzer

| Tab | What you get |
|---|---|
| Appellate Scorecard | Strength ratings across key appellate dimensions |
| First Impression | How the panel is likely to read the opening |
| Likely Ruling | Predicted outcome with reasoning |
| Structural Errors | Defects in argument structure, preservation, or briefing |
| Case Law & Statutes | Citation analysis and statutory mapping |
| Citation Check | Verification of case citations and K.S.A. references |
| Filing Checklist | Rule 170 / formatting compliance |
| Revised Motion ✏ | Editable, downloadable draft with corrections applied |

### 🏛 District Analyzer

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

## Setup

**You need an Anthropic API key.** Get one at [console.anthropic.com](https://console.anthropic.com).

1. Open the app
2. Paste your API key into the bar at the top (`sk-ant-…`)
3. Upload your document (PDF, DOCX, or TXT)
4. Click **Analyze**

Your API key is held in session memory only and is never stored or transmitted anywhere except directly to `api.anthropic.com`.

---

## Legal disclaimer

> This tool is for **research and drafting assistance only**. All outputs must be independently verified against current Kansas statutes, court rules, and controlling authority. Nothing produced by this tool constitutes legal advice. Consult a licensed Kansas attorney before filing any document in court.

---

## Built with

- [Anthropic Claude API](https://docs.anthropic.com) — `claude-sonnet-4-6`
- Vanilla HTML/CSS/JS — zero frameworks, zero build tools
- Kansas statutes: K.S.A. 38-2201 et seq., K.S.A. 60-260(b), K.A.R. DCF regulations
