# NABL Calibration Reference

**Reference document for Calibration Laboratory Management System (CLMS) engineers**
Scope: NABL (National Accreditation Board for Testing and Calibration Laboratories, India) accredited calibration.
Last reviewed: 2026-06-24

> This is an internal engineering reference. The controlled, legally binding requirements are the published documents themselves. Always consult the current revision on the NABL portal (https://nabl-india.org) and the relevant ILAC / ISO / EURAMET publication. Document numbers and clause references below are given so engineers can locate the source.

---

## 0. Governing documents (the authority stack)

| Document | Title / Scope |
|---|---|
| **ISO/IEC 17025:2017** | General requirements for the competence of testing and calibration laboratories. The base accreditation standard. |
| **NABL 100** | General Information Brochure (overview of NABL accreditation). |
| **NABL 126** | Specific Criteria for Accreditation of Calibration Laboratories performing **calibration of Medical Devices** (read with ISO 13485, IEC 60601, IEC 62353, GHTF guidance). |
| **NABL 129** | Specific Criteria for Accreditation of Calibration Laboratories (Mechanical, Fluid Flow, Radiological, Electro-Technical & Thermal). |
| **NABL 120** | Classification of disciplines / groups for defining the scope of accreditation. |
| **NABL 141** | Guidelines for Estimation and Expression of Uncertainty in Measurement (Indian implementation of GUM / EA-4/02). |
| **NABL 133 / NABL 142** | Policy on calibration intervals / use of accredited services and traceability of measurement. |
| **JCGM 100:2008 (GUM)** | Guide to the Expression of Uncertainty in Measurement. The foundational uncertainty document. |
| **EA-4/02 M:2022** | Evaluation of the Uncertainty of Measurement in Calibration (European Accreditation worked-examples companion to GUM). |
| **ILAC-P14** | ILAC Policy for Measurement Uncertainty in Calibration (defines CMC, BMC). |
| **ILAC-G8:09/2019** | Guidelines on Decision Rules and Statements of Conformity. |
| **ILAC-P10** | ILAC Policy on the Traceability of Measurement Results. |
| **EURAMET cg-series** | Discipline-specific calibration guides (cg-18 thermometers, cg-19 thermocouples, cg-3 force, cg-17 pressure, cg-15 micrometers, cg-20 weights, etc.). |
| **DKD-R series** | German (PTB/DKD) calibration directives, widely used as method references. |

---

## 1. NABL Calibration Disciplines & Sub-disciplines

NABL grants calibration accreditation in the following **disciplines** (parameter groups). The scope of a lab is defined per parameter, not per discipline as a whole.

| # | Discipline | Sub-disciplines / Parameters |
|---|---|---|
| 1 | **Mechanical** | Dimension; Mass & Weights; Volume & Density; Force; Torque; Pressure & Vacuum; Hardness; Speed (RPM/linear); Acceleration & Vibration; Angle; Flatness/Surface; Coordinate measurement |
| 2 | **Electro-Technical** | DC Voltage & Current; AC Voltage & Current; Resistance; Capacitance & Inductance; Time & Frequency; Power & Energy; Phase; High Voltage; Transducer/Signal; RF & Microwave |
| 3 | **Thermal** | Temperature (contact – thermocouples, RTDs, liquid-in-glass, digital thermometers); Temperature (non-contact – IR/radiation thermometers, blackbody); Temperature source/enclosure (furnaces, baths, ovens, chambers); Humidity; Thermal conductivity |
| 4 | **Fluid Flow** | Liquid flow; Gas flow; Air velocity (anemometry); Volume/totaliser flow |
| 5 | **Optical** | Photometry (lux, luminous intensity, luminance); Radiometry; Colorimetry; Spectrophotometry (absorbance/transmittance/wavelength); Optical power (fibre); Refractive index |
| 6 | **Radiological** | Diagnostic radiology (kVp, mAs, dose, HVL); Radiation protection (dose rate, survey meters); Radiotherapy/nuclear dosimetry |
| 7 | **Acoustics & Ultrasonics** | Sound pressure level (sound level meters, calibrators); Acoustic frequency; Ultrasonic power; Audiometers |
| 8 | **Medical Devices** (NABL 126) | Patient monitors, defibrillators, infusion/syringe pumps, ventilators, ECG simulators, electrosurgical units, blood pressure (NIBP), SpO₂; calibrated against IEC 60601 / IEC 62353 derived parameters |
| 9 | **Chemical / Reference materials** | (where applicable) pH, conductivity, gas mixtures — often handled under proficiency / RM programmes |

> Note on terminology: NABL frequently merges **Optical & Radiological** in scope listings. **Acoustics/Ultrasonics** and **Medical** are increasingly recognised as distinct calibration scopes; Medical has its own specific criteria (NABL 126).

---

## 2. Per-Discipline Details

For each parameter: typical instruments, parameters & units, typical ranges, reference standards, governing guide.

### 2.1 Mechanical

| Parameter | Typical instruments | Units | Typical range | Reference standards | Guide |
|---|---|---|---|---|---|
| Dimension | Vernier caliper, micrometer, height gauge, dial gauge, gauge blocks, CMM, profile projector, bore gauge | mm, µm | 0–1000 mm (instrument dependent) | Gauge block sets (grade 0/00), slip gauges, laser interferometer, step gauges | EURAMET cg-15 (micrometers), cg-10/cg-26 (dimensional), VDI/VDE 2617 (CMM) |
| Mass / Weights | Electronic balance, weighing scale, weight box (E1–M3) | g, mg, kg | 1 mg – 50 kg+ | Reference weights (OIML E1/E2/F1), mass comparator | OIML R111-1; EURAMET cg-18/cg-20 |
| Volume / Density | Pipette, burette, volumetric flask, density bottle, hydrometer | mL, L, g/cm³ | 1 µL – 20 L | Gravimetric standards, reference glassware, density columns | ISO 8655; OIML |
| Force | Load cell, force gauge, UTM, proving ring | N, kN | 1 N – 1 MN | Dead-weight force machine, reference force transducer | EURAMET cg-4; ISO 376; ASTM E74 |
| Torque | Torque wrench, torque screwdriver, torque transducer | N·m | 0.1 – 5000 N·m | Reference torque transducer, torque calibration machine | EURAMET cg-14; ISO 6789; DKD-R 3-7/3-8 |
| Pressure / Vacuum | Pressure gauge, transmitter, manometer, barometer, vacuum gauge | Pa, kPa, bar, psi, mmHg | −1 bar to 7000 bar | Dead-weight tester (pressure balance), digital pressure controller | EURAMET cg-17; DKD-R 6-1 |
| Hardness | Rockwell, Brinell, Vickers testers, hardness blocks | HRC, HB, HV | scale dependent | Reference hardness blocks (traceable) | ISO 6506/6507/6508; ASTM E18 |
| Speed / RPM | Tachometer, stroboscope | rpm, m/min | 1 – 100,000 rpm | Reference frequency/tacho standard | — |
| Acceleration / Vibration | Accelerometer, vibration meter | m/s², g | per device | Reference accelerometer, shaker (back-to-back calibration) | ISO 16063 |

### 2.2 Electro-Technical

| Parameter | Typical instruments | Units | Typical range | Reference standards | Guide |
|---|---|---|---|---|---|
| DC Voltage | DMM, calibrator, voltage source | V (nV–kV) | 1 nV – 1100 V | Multifunction calibrator (e.g. Fluke 5xxx), Zener/Josephson reference | EA-4/02; manufacturer specs |
| DC Current | DMM, current source, shunts | A | 1 pA – 1000 A+ | Calibrator + transconductance amplifier, reference shunts | — |
| AC Voltage/Current | DMM, calibrator, power source | V, A (with frequency) | mV–1000 V, Hz–MHz | AC calibrator, thermal transfer standard | — |
| Resistance | DMM, decade box, standard resistors | Ω (µΩ–TΩ) | 1 mΩ – 1 GΩ | Reference resistors, Hamon network | — |
| Capacitance / Inductance | LCR meter, decade box | F, H | pF–F, µH–H | Reference C/L standards | — |
| Time / Frequency | Counter, oscillator, oscilloscope | Hz, s | mHz – GHz | Rubidium/GPS-disciplined oscillator | — |
| Power / Energy | Power analyzer, energy meter, wattmeter | W, var, kWh | per device | Reference power/energy standard | — |
| RF / Microwave | Power sensor, signal generator, attenuator | dBm, dB | DC – GHz | RF power reference, calibration factor standards | — |

### 2.3 Thermal

| Parameter | Typical instruments | Units | Typical range | Reference standards | Guide |
|---|---|---|---|---|---|
| Temperature (contact) | Thermocouple, RTD/PRT, LiG thermometer, digital thermometer, data logger | °C, K | −196 to 1600 °C | SPRT, reference PRT, fixed-point cells (TPW, Ga, In, Sn, Zn, Al), reference thermocouple (Type S/R), stirred baths, dry blocks | EURAMET cg-8/cg-11/cg-13/cg-18; DKD-R 5-x |
| Temperature (non-contact) | IR thermometer, thermal imager | °C | −50 to 1500 °C | Blackbody radiation source | EURAMET cg-12 |
| Temperature source | Furnace, oven, bath, environmental chamber, autoclave, incubator | °C | per device | Reference thermometer + multipoint mapping | EURAMET cg-13 (spatial uniformity) |
| Humidity | Hygrometer, humidity chamber, psychrometer | %RH, dew point | 5–95 %RH | Chilled-mirror dew-point hygrometer, two-pressure/two-temperature generator, saturated salt solutions | EURAMET cg-? / OIML R121 |

### 2.4 Fluid Flow

| Parameter | Typical instruments | Units | Typical range | Reference standards | Guide |
|---|---|---|---|---|---|
| Liquid flow | Flowmeter, rotameter, water meter | L/min, m³/h | per rig | Gravimetric/volumetric flow rig, master meter | ISO 4185; EURAMET cg-? |
| Gas flow | Mass flow controller, gas meter | L/min, sccm | per rig | Bell prover, sonic nozzle, piston prover | ISO 9300 |
| Air velocity | Anemometer (vane/hot-wire), pitot | m/s | 0.1 – 40 m/s | Wind tunnel + LDA reference | — |

### 2.5 Optical

| Parameter | Typical instruments | Units | Typical range | Reference standards | Guide |
|---|---|---|---|---|---|
| Photometry | Lux meter, luminance meter, photometer | lx, cd, cd/m² | per device | Standard lamp, photometric bench, reference detector | CIE publications |
| Spectrophotometry | UV-Vis spectrophotometer | Absorbance (A), %T, nm | 190–1100 nm | Certified reference filters (NIST 930/2034), holmium oxide (wavelength) | — |
| Colorimetry | Colorimeter, spectrocolorimeter | L\*a\*b\*, CIE xy | — | Reference colour tiles | CIE |
| Optical fibre power | Optical power meter | dBm, W | per device | Reference optical power standard | — |

### 2.6 Radiological

| Parameter | Typical instruments | Units | Typical range | Reference standards | Guide |
|---|---|---|---|---|---|
| Diagnostic radiology | kVp meter, dose meter, mAs meter | kV, mGy, mAs | per device | Reference ionisation chamber + electrometer, calibrated X-ray beam | IAEA TRS-457; AERB |
| Radiation protection | Survey meter, dosimeter | µSv/h, Sv | — | Reference source (Cs-137/Co-60), secondary standard chamber | IAEA |

### 2.7 Acoustics & Ultrasonics

| Parameter | Typical instruments | Units | Typical range | Reference standards | Guide |
|---|---|---|---|---|---|
| Sound pressure | Sound level meter, acoustic calibrator, microphone | dB(SPL), Pa | 20 – 140 dB | Pistonphone, reference microphone (coupler), multifunction acoustic calibrator | IEC 61672; IEC 60942 |
| Audiometry | Audiometer | dB HL | — | Acoustic coupler / artificial ear | IEC 60645 |

### 2.8 Medical Devices (NABL 126)

| Parameter | Instruments calibrated | Reference / analyser |
|---|---|---|
| Patient safety (leakage current, earth bond) | Any electromedical device | Electrical safety analyser (IEC 62353) |
| Vital signs | NIBP, SpO₂, ECG, temperature modules | Patient simulator / multi-parameter simulator |
| Therapy | Defibrillator, electrosurgical unit (ESU), infusion pump, ventilator | Defibrillator analyser, ESU analyser, infusion device analyser, gas flow analyser |

---

## 3. Measurement Uncertainty (GUM / EA-4/02 / NABL 141)

### 3.1 The model
A measurand `Y` is expressed through a model:
`Y = f(X₁, X₂, …, Xₙ)`
Each input `Xᵢ` carries a **standard uncertainty** `u(xᵢ)`.

### 3.2 Type A vs Type B evaluation

| | **Type A** | **Type B** |
|---|---|---|
| Method | Statistical analysis of repeated observations | Other means: certificates, specs, handbooks, experience |
| Typical source | Repeatability/scatter of readings | Reference std uncertainty, resolution, drift, environmental, hysteresis |
| Standard uncertainty | `u = s/√n` (std dev of mean), `s` = sample std dev, `n` = readings | Derived from assumed distribution and its divisor |
| Degrees of freedom | `ν = n − 1` | Often assumed `ν = ∞` (or estimated from relative reliability) |

### 3.3 Probability distributions and their divisors

Convert a half-width / limit `a` into a standard uncertainty by dividing by the divisor:

| Distribution | When used | Divisor | `u = a / divisor` |
|---|---|---|---|
| **Normal (Gaussian)** | Value from a calibration certificate quoted at `k` (usually k=2, 95%) | `k` (= 2) | `u = U / k` |
| **Rectangular (uniform)** | Resolution, quantisation, limits with no other info (drift, spec limits) | `√3` ≈ 1.732 | `u = a / √3` |
| **Triangular** | Value more likely near centre (e.g. some interpolations, additive limits) | `√6` ≈ 2.449 | `u = a / √6` |
| **U-shaped (arcsine)** | Sinusoidal effects — RF mismatch, some temperature cycling | `√2` ≈ 1.414 | `u = a / √2` |

Resolution note: a digital resolution `d` gives a half-width `a = d/2`, so `u = (d/2)/√3 = d/(2√3)`.

### 3.4 Sensitivity coefficients
`cᵢ = ∂f/∂Xᵢ`. The contribution of each input to the output is `uᵢ(y) = cᵢ · u(xᵢ)`.

### 3.5 Combined standard uncertainty (uncorrelated inputs)
`u_c(y) = √( Σ [cᵢ · u(xᵢ)]² )`
If inputs are correlated, add the covariance cross-terms `2·Σ cᵢcⱼ·u(xᵢ,xⱼ)`.

### 3.6 Effective degrees of freedom — Welch–Satterthwaite

```
                 u_c(y)⁴
ν_eff = ─────────────────────────────
          Σ  [ uᵢ(y)⁴ / νᵢ ]
```

Used when some contributors have low degrees of freedom (few repeat readings), to choose the correct `k` from the Student-t table.

### 3.7 Coverage factor `k` and expanded uncertainty
`U = k · u_c(y)`

- Default for ≈95.45 % confidence with sufficient `ν_eff`: **k = 2**.
- For low `ν_eff`, take `k = t₉₅(ν_eff)` from the t-distribution. Examples: ν=1 → 13.97; ν=2 → 4.53; ν=5 → 2.57; ν=10 → 2.28; ν=20 → 2.13; ν=∞ → 2.00.
- The certificate **must state** the value of `k` and the approximate confidence level.

### 3.8 Reporting
Report `result ± U` with the same unit and matching significant figures (round `U` to 2 significant figures), state `k` and the confidence level, e.g.:
> (10.001 ± 0.012) mm, where the reported expanded uncertainty is stated at k = 2, providing a coverage probability of approximately 95 %.

### 3.9 CMC — Calibration and Measurement Capability (ILAC-P14)
- CMC = the **smallest uncertainty** a lab can achieve when calibrating a (near-)ideal device under normal conditions. It is the uncertainty published in the scope of accreditation.
- Expressed as an expanded uncertainty at **k = 2 (≈95 %)**.
- The reported uncertainty `U` on a real certificate is **always ≥ CMC**, because it must include the contribution of the actual UUT (resolution, repeatability, noise).
- A laboratory must never report an uncertainty below its accredited CMC for that parameter and range.

---

## 4. Decision Rules — Statements of Conformity (ILAC-G8:09/2019, ISO/IEC 17025 cl. 7.8.6)

A **decision rule** describes how measurement uncertainty is accounted for when stating PASS / FAIL against a specification. It must be agreed with the customer and recorded **before** issuing a conformity statement.

Definitions:
- **TL** = tolerance / specification limit. **AL** = acceptance limit. **U** = expanded uncertainty (k=2). **w** = guard band, `w = r · U`.

### 4.1 Simple acceptance (shared risk, w = 0)
- Accept if the measured value is within the tolerance limits: AL = TL.
- The uncertainty is **not** used to shrink the acceptance zone → global risk can approach 50 % at the limit. Acceptable only when explicitly agreed (often when TUR ≥ 4:1).

### 4.2 Guard banded acceptance (binary, w-rule)
Acceptance limit is pulled **inside** the tolerance by the guard band:
- **Guarded acceptance (reduce false accept):** `AL = TL − U` (i.e. `w = U`, r = 1). Pass only if result ≤ TL − U. This is the common conservative "stringent" rule that gives ~2.5 % consumer risk.
- **Guarded rejection (reduce false reject, favour the customer):** `AL = TL + U`. Used when you want to avoid wrongly failing good items.
- General form: `AL = TL ∓ w`, with `w = r·U`. `r` is chosen from the target risk (e.g. r = 1 → ~2.5 % PFA; r = 1.65 → ~smaller risk).

### 4.3 Conformity zones (ILAC-G8 model)
For a value `y` with uncertainty `U` against limits `TL_lower`, `TL_upper`:

| Result band | Statement |
|---|---|
| `y + U < TL_upper` **and** `y − U > TL_lower` | **PASS** — conforms, uncertainty fully inside tolerance |
| Interval `y ± U` straddles a tolerance limit | **Conditional / non-conclusive** — report measured value + U, state that conformity cannot be determined at the agreed level |
| `y − U > TL_upper` **or** `y + U < TL_lower` | **FAIL** — does not conform |

### 4.4 TUR / TAR
- **TUR (Test Uncertainty Ratio)** = `Tolerance span / (2U)` (uses expanded uncertainty). Industry rule of thumb: TUR ≥ 4:1 supports simple acceptance.
- **TAR (Test Accuracy Ratio)** = ratio of UUT tolerance to standard's tolerance (older, less rigorous; prefer TUR).

The certificate must state the decision rule applied and, where relevant, the level of risk (e.g. PFA — probability of false accept).

---

## 5. Calibration Certificate — Mandatory Content (ISO/IEC 17025:2017, clause 7.8)

Per clause 7.8.2 (common) and 7.8.4 (calibration-specific):

1. A title (e.g. "Calibration Certificate").
2. Name and address of the laboratory; location where calibration was performed if different.
3. Unique identification of the certificate (on every page) and clear end-of-document identification (e.g. page x of y).
4. Customer name and address (the entity for which calibration was performed).
5. Identification of the method used.
6. Description, condition, and unambiguous identification of the item(s) calibrated (model, serial no., range).
7. Date of receipt of item (where critical), date(s) of performance of the calibration.
8. Date of issue of the certificate.
9. Reference to the sampling plan / procedure where relevant.
10. **Measurement results with units of measurement.**
11. **Measurement uncertainty** of the result, in the same unit as the measurand or relative term. (cl. 7.8.4.1 — mandatory for calibration certificates.)
12. The **coverage factor k** and the confidence level / coverage probability.
13. Evidence/statement of **metrological traceability** (cl. 7.8.4.3) — reference standards used and their traceability to SI / national standard.
14. Conditions (e.g. environmental: temperature, humidity) under which the calibration was made that have an influence on the results.
15. Where applicable, a **statement of conformity** with the **decision rule** applied (cl. 7.8.6).
16. Where relevant, **before- and/or after-adjustment** (as-found / as-left) results.
17. Identification/authorisation of person(s) approving the certificate (signature/equivalent) and date.
18. A statement that results relate only to the items calibrated.
19. A statement that the certificate shall not be reproduced except in full without written approval.
20. Opinions and interpretations, when given, clearly identified as such (cl. 7.8.7).
21. For NABL: the **NABL symbol / accreditation number** and the accredited scope (only for parameters within scope); out-of-scope parameters clearly distinguished.

> Calibration certificates must **not** contain a recommendation on the calibration interval unless agreed with the customer or required by regulation (cl. 7.8.4.3 note).

---

## 6. Recommended Calibration Intervals

There is no universal mandatory interval. ISO/IEC 17025 (cl. 6.4.7) and NABL 133 require the lab to **establish intervals on a risk/usage basis** and review them. The table below gives common starting points; adjust from history, drift, criticality and usage. ILAC-G24 / OIML D10 give methods to optimise intervals.

| Instrument / type | Typical interval |
|---|---|
| Working reference standards (gauge blocks, std weights E/F, std resistors) | 1–3 years (some 5 yr for stable artefacts) |
| Digital multimeters, calibrators, oscilloscopes | 12 months |
| Pressure gauges / transmitters (industrial) | 6–12 months |
| Dead-weight testers | 1–5 years |
| Torque wrenches | 12 months **or** ~5,000–25,000 operations (whichever first) |
| Thermocouples (base metal) | 6–12 months (drift-prone; type K shorter) |
| RTD / PRT reference | 1–2 years |
| Temperature baths / dry blocks / chambers | 12 months |
| Weighing balances (analytical) | 12 months (with daily/weekly user checks) |
| Dimensional hand tools (caliper, micrometer) | 6–12 months |
| Hardness testing machines | 12 months (with daily block verification) |
| Flow meters | 12 months |
| Sound level meters / acoustic calibrators | 12–24 months (statutory: often 2 yr) |
| Medical devices (NABL 126) | 12 months typical (regulatory may require shorter) |
| Glassware (volumetric) | Often one-time / on damage |

Factors that justify **shortening**: tendency to drift, harsh/heavy use, critical measurements, history of out-of-tolerance at calibration, manufacturer recommendation. Factors that justify **lengthening**: stable history over multiple cycles, light use, redundancy/cross-checks.

---

## 7. Traceability Chain (ISO/IEC 17025 cl. 6.5; ILAC-P10; NABL 142)

**Requirement:** every measurement result must be traceable to the **SI**, through an **unbroken, documented chain of calibrations**, each with a stated measurement uncertainty, ending at a recognised realisation of the unit.

```
SI definition / fundamental constants
        │
National Metrology Institute (India: NPL-India / CSIR-NPL)  ← primary standards
        │   (certificate, U, traceability statement)
Accredited reference / secondary calibration laboratory      ← reference standards
        │
Working / in-house calibration laboratory (your CLMS lab)    ← working standards
        │
Unit Under Test (customer instrument)                        ← end use
```

**Acceptable sources of traceability (ILAC-P10):**
1. NMI services (CIPM MRA signatory) — e.g. CSIR-NPL India, NIST, PTB, NPL-UK.
2. Calibration laboratories **accredited** by an ILAC-MRA signatory accreditation body (NABL, UKAS, NABL-recognised, etc.), **within their accredited scope**.
3. For SI units not realised by an NMI, traceability to a suitable reference (e.g. certified reference material).

**Each link must provide:**
- A calibration certificate identifying the reference standard used.
- The measurement uncertainty at each step (which propagates upward into the budget).
- An unbroken sequence with no gaps.
- Calibrations performed within validity (interval) at each level.

**Practical CLMS implications:**
- Store, for every reference/working standard: certificate, NABL/ILAC accreditation number of the issuing lab, traceability statement, U, calibration date, due date.
- Reject traceability via labs **outside their accredited scope** for the parameter/range used.
- Maintain reverse-traceability: be able to identify, for any issued certificate, exactly which reference standards (and their certificates) were used — essential for recall if a standard is later found out of tolerance.

---

## Appendix A — Quick uncertainty budget template

| Source `Xᵢ` | Estimate | Limit/half-width `a` or `U` | Distribution | Divisor | `u(xᵢ)` | `cᵢ` | `uᵢ(y)=cᵢu(xᵢ)` | `νᵢ` |
|---|---|---|---|---|---|---|---|---|
| Reference std (from cert) | — | U, k=2 | Normal | 2 | | | | ∞ |
| Repeatability (Type A) | mean | s | Normal | √n | | | | n−1 |
| UUT resolution | — | d/2 | Rectangular | √3 | | | | ∞ |
| Drift / stability | — | a | Rectangular | √3 | | | | ∞ |
| Environmental (temp etc.) | — | a | Rectangular | √3 | | | | ∞ |
| **Combined `u_c(y)`** | | | | | `√Σuᵢ²` | | | `ν_eff` (W-S) |
| **Expanded `U = k·u_c`** | | | | k = t₉₅(ν_eff) | | | | |

## Appendix B — Common t₉₅ coverage factors

| ν_eff | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 15 | 20 | 50 | ∞ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| k = t₉₅ | 13.97 | 4.53 | 3.31 | 2.87 | 2.57 | 2.45 | 2.31 | 2.28 | 2.18 | 2.13 | 2.05 | 2.00 |

---

### Sources / further reading
- NABL India portal: https://nabl-india.org (NABL 100, 120, 126, 129, 133, 141, 142)
- ISO/IEC 17025:2017 — General requirements for testing and calibration laboratories
- JCGM 100:2008 (GUM); EA-4/02 M:2022 — Evaluation of Uncertainty of Measurement in Calibration
- ILAC-P10 (traceability); ILAC-P14 (uncertainty/CMC); ILAC-G8:09/2019 (decision rules)
- EURAMET cg-series calibration guides; DKD-R directives; OIML R111, R76, R121
