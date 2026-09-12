import { Complex } from './complex';

// ─── Input / Output Interfaces ───────────────────────────────────────────────

export interface LineParams {
  frequencyHz: number;
  lengthKm: number;
  rPerKm: number;      // Ω/km
  xPerKm: number;      // Ω/km
  bPerKm: number;      // S/km (susceptance, imaginary part of y)
  gPerKm: number;      // S/km (conductance, real part of y)
  V_R_LL_kV: number;   // Receiving-end line-to-line voltage in kV (used directly for 1-phase)
  P_R_MW: number;      // Receiving-end active power in MW
  PF_R: number;        // Receiving-end power factor (0 < PF ≤ 1)
  pfType: 'lagging' | 'leading';
  mediumModel?: 'Nominal-Pi' | 'Nominal-T';
  phaseSystem: '3-Phase' | '1-Phase';
}

export interface AssignmentInput {
  memberNumber: number; // 1–6
  groupNumber: number;  // positive integer
}

export interface DerivedAssignmentParams {
  memberNumber: number;
  groupNumber: number;
  K: number;
  J: number;
  XX: number;
  m: number;
  L: number;
  P_R_MW: number;
  PF_R: number;
  memberName?: string;
}

export interface CalculationStep {
  number: number;
  title: string;
  latex?: string;          // KaTeX formula string
  given?: string;          // plain text for given/known values
  substitution?: string;   // plain text substitution
  resultLatex?: string;    // KaTeX result
  result: string;          // plain text result
}

export interface SolverResult {
  // Assignment-specific (only in assignment mode)
  assignment?: DerivedAssignmentParams;

  // Line parameters actually used
  params: LineParams;

  // Classification
  classification: 'Short' | 'Medium' | 'Long';
  modelName: string;
  modelReason: string;

  // Total line quantities
  Z_total: Complex;
  Y_total: Complex;

  // ABCD
  A: Complex;
  B: Complex;
  C: Complex;
  D: Complex;
  adMinusBc: Complex; // AD − BC, should ≈ 1+j0

  // Receiving end (per-phase, then totals)
  V_R_ph: Complex;     // phase voltage in kV
  I_R: Complex;        // current in A
  S_R_total: Complex;  // total 3φ complex power in MVA
  Q_R_MVAR: number;

  // Sending end
  V_S_ph: Complex;     // phase voltage in kV
  V_S_LL_kV: number;   // line-to-line magnitude in kV
  I_S: Complex;        // current in A
  S_S_total: Complex;  // total 3φ complex power in MVA
  P_S_MW: number;
  Q_S_MVAR: number;
  S_S_mag_MVA: number;
  PF_S: number;
  pfSType: 'lagging' | 'leading';

  // Performance
  voltageRegulationPercent: number;
  efficiencyPercent: number;
  lossesMW: number;

  // Steps
  steps: CalculationStep[];
}

// ─── Assignment Parameter Derivation ─────────────────────────────────────────

export function deriveAssignmentParams(input: AssignmentInput, memberName?: string): DerivedAssignmentParams {
  const K = Math.abs(4 - input.memberNumber);
  const J = input.groupNumber % 10;
  const XX = input.groupNumber;
  const m = Math.abs(10 - input.memberNumber);
  const L = K * 100 + J * 10;
  const P_R_MW = 5 * XX;
  const PF_R = m / 10;

  return { memberNumber: input.memberNumber, groupNumber: input.groupNumber, K, J, XX, m, L, P_R_MW, PF_R, memberName };
}

export function assignmentToLineParams(input: AssignmentInput): LineParams {
  const derived = deriveAssignmentParams(input);
  return {
    frequencyHz: 50,
    lengthKm: derived.L,
    rPerKm: 0.1,
    xPerKm: 1.0,
    bPerKm: 2.8e-6,
    gPerKm: 0,
    V_R_LL_kV: 220,
    P_R_MW: derived.P_R_MW,
    PF_R: derived.PF_R,
    pfType: 'lagging',
    mediumModel: 'Nominal-Pi',
    phaseSystem: '3-Phase',
  };
}

// ─── Main Solver ─────────────────────────────────────────────────────────────

export function solveTransmissionLine(
  params: LineParams,
  assignment?: DerivedAssignmentParams
): SolverResult {
  const steps: CalculationStep[] = [];
  let stepNum = 0;

  const nextStep = (): number => ++stepNum;

  // ── Step 1: Assignment Parameters (if applicable) ──
  if (assignment) {
    steps.push({
      number: nextStep(),
      title: 'Determine Assignment Parameters',
      latex: String.raw`K = |4 - M|, \quad J = \text{last digit}(G), \quad XX = G, \quad m = |10 - M|`,
      substitution: `K = |4 − ${assignment.memberNumber}| = ${assignment.K}, J = last digit(${assignment.groupNumber}) = ${assignment.J}, XX = ${assignment.XX}, m = |10 − ${assignment.memberNumber}| = ${assignment.m}`,
      resultLatex: String.raw`L = ${assignment.L} \text{ km}, \quad P_R = ${assignment.P_R_MW} \text{ MW}, \quad \cos\phi_R = ${assignment.PF_R} \text{ lagging}`,
      result: `L = ${assignment.L} km, P_R = ${assignment.P_R_MW} MW, PF_R = ${assignment.PF_R} lagging`,
    });
  }

  // ── Total Z and Y ──
  const z_per_km = new Complex(params.rPerKm, params.xPerKm);
  const y_per_km = new Complex(params.gPerKm, params.bPerKm);
  const Z = z_per_km.mul(params.lengthKm);
  const Y = y_per_km.mul(params.lengthKm);

  // ── Step 2: Classify Line ──
  let classification: 'Short' | 'Medium' | 'Long';
  let modelName: string;
  let modelReason: string;

  if (params.lengthKm <= 80) {
    classification = 'Short';
    modelName = 'Short Line Model';
    modelReason = `Line length = ${params.lengthKm} km (≤ 80 km). Shunt capacitance is negligible and ignored.`;
  } else if (params.lengthKm <= 250) {
    classification = 'Medium';
    // The portal strictly uses Nominal-Pi for Medium lines per assignment specifications.
    // We override any leftover model parameters to enforce this.
    params.mediumModel = 'Nominal-Pi'; 
    modelName = 'Nominal-π Model';
    modelReason = `Line length = ${params.lengthKm} km (80 < L ≤ 250 km). Charging capacitance is modelled as lumped parameters.`;
  } else {
    classification = 'Long';
    modelName = 'Exact Long Line (Distributed Parameters)';
    modelReason = `Line length = ${params.lengthKm} km (> 250 km). Parameters are distributed along the line.`;
  }

  steps.push({
    number: nextStep(),
    title: 'Classify Transmission Line',
    given: `L = ${params.lengthKm} km`,
    result: `${classification} Transmission Line → ${modelName}`,
  });

  // ── Step 3: ABCD Parameters ──
  let A: Complex, B: Complex, C: Complex, D: Complex;

  if (classification === 'Short') {
    A = new Complex(1, 0);
    B = Z;
    C = new Complex(0, 0);
    D = new Complex(1, 0);

    steps.push({
      number: nextStep(),
      title: 'ABCD Parameters (Short Line)',
      latex: String.raw`A = D = 1, \quad B = Z, \quad C = 0`,
      substitution: `Z = ${Z.toString(4)} Ω`,
      result: `A = 1, B = ${Z.toString(4)} Ω, C = 0, D = 1`,
    });
  } else if (classification === 'Medium') {
    const ZY = Z.mul(Y);
    A = new Complex(1, 0).add(ZY.div(2));
    D = A;
    if (params.mediumModel === 'Nominal-T') {
      B = Z.mul(new Complex(1, 0).add(ZY.div(4)));
      C = Y;
      steps.push({
        number: nextStep(),
        title: 'ABCD Parameters (Nominal-T)',
        latex: String.raw`A = D = 1 + \frac{ZY}{2}, \quad B = Z\!\left(1 + \frac{ZY}{4}\right), \quad C = Y`,
        substitution: `Z = ${Z.toString(4)} Ω, Y = ${Y.toString(6)} S`,
        resultLatex: String.raw`A = ${A.toString(4)}, \; B = ${B.toString(4)} \;\Omega, \; C = ${C.toString(6)} \;\text{S}`,
        result: `A = ${A.toString(4)}, B = ${B.toString(4)} Ω, C = ${C.toString(6)} S, D = ${D.toString(4)}`,
      });
    } else {
      B = Z;
      C = Y.mul(new Complex(1, 0).add(ZY.div(4)));
      steps.push({
        number: nextStep(),
        title: 'ABCD Parameters (Nominal-π)',
        latex: String.raw`A = D = 1 + \frac{ZY}{2}, \quad B = Z, \quad C = Y\!\left(1 + \frac{ZY}{4}\right)`,
        substitution: `Z = ${Z.toString(4)} Ω, Y = ${Y.toString(6)} S`,
        resultLatex: String.raw`A = ${A.toString(4)}, \; B = ${B.toString(4)} \;\Omega, \; C = ${C.toString(6)} \;\text{S}`,
        result: `A = ${A.toString(4)}, B = ${B.toString(4)} Ω, C = ${C.toString(6)} S, D = ${D.toString(4)}`,
      });
    }
  } else {
    // Long line: distributed parameters
    const gamma = z_per_km.mul(y_per_km).sqrt();
    const Zc = z_per_km.div(y_per_km).sqrt();
    const gammaL = gamma.mul(params.lengthKm);

    A = gammaL.cosh();
    D = A;
    B = Zc.mul(gammaL.sinh());
    C = gammaL.sinh().div(Zc);

    steps.push({
      number: nextStep(),
      title: 'ABCD Parameters (Exact Long Line)',
      latex: String.raw`\gamma = \sqrt{zy}, \; Z_c = \sqrt{\frac{z}{y}}, \; A = D = \cosh(\gamma l), \; B = Z_c \sinh(\gamma l), \; C = \frac{\sinh(\gamma l)}{Z_c}`,
      substitution: `γ = ${gamma.toString(6)}, Zc = ${Zc.toString(4)}, γl = ${gammaL.toString(4)}`,
      result: `A = ${A.toString(4)}, B = ${B.toString(4)} Ω, C = ${C.toString(6)} S, D = ${D.toString(4)}`,
    });
  }

  // AD − BC reciprocity check
  const adMinusBc = A.mul(D).sub(B.mul(C));

  // ── Step 4: Receiving-End Current ──
  const is3Phase = params.phaseSystem === '3-Phase';
  
  const V_R_ph_kV = is3Phase ? params.V_R_LL_kV / Math.sqrt(3) : params.V_R_LL_kV;
  const V_R = new Complex(V_R_ph_kV, 0); // reference phasor, kV

  const thetaR = Math.acos(params.PF_R);
  const Q_R_MVAR = params.P_R_MW * Math.tan(thetaR) * (params.pfType === 'lagging' ? 1 : -1);
  const S_R_total = new Complex(params.P_R_MW, Q_R_MVAR); // MVA total
  const S_R_ph = is3Phase ? S_R_total.div(3) : S_R_total; // MVA per phase

  // I_R = (S_R_ph / V_R_ph)* → (MVA / kV) = kA → ×1000 = A
  const I_R = S_R_ph.div(V_R).conjugate().mul(1000);

  steps.push({
    number: nextStep(),
    title: 'Receiving-End Quantities',
    latex: is3Phase 
      ? String.raw`V_{R(ph)} = \frac{V_{R(LL)}}{\sqrt{3}}, \quad Q_R = P_R \tan(\cos^{-1}\text{pf}_R), \quad I_R = \left(\frac{S_{R(ph)}}{V_{R(ph)}}\right)^*`
      : String.raw`V_{R(ph)} = V_R, \quad Q_R = P_R \tan(\cos^{-1}\text{pf}_R), \quad I_R = \left(\frac{S_R}{V_R}\right)^*`,
    substitution: `V_R(ph) = ${V_R_ph_kV.toFixed(3)} kV, S_R_total = ${S_R_total.toString(3)} MVA, S_R(ph) = ${S_R_ph.toString(3)} MVA`,
    resultLatex: String.raw`I_R = ${I_R.mag.toFixed(2)} \angle ${I_R.angleDeg.toFixed(2)}° \text{ A}`,
    result: `I_R = ${I_R.toPolarString(2)} A`,
  });

  // ── Step 5: Sending-End Voltage ──
  // Work in V and A for ABCD: V_R in volts, I_R in amps, B in Ω, C in S
  const V_R_V = V_R.mul(1000); // V
  const V_S_V = A.mul(V_R_V).add(B.mul(I_R));
  const V_S_ph = V_S_V.div(1000); // back to kV
  const V_S_LL_kV = is3Phase ? V_S_ph.mag * Math.sqrt(3) : V_S_ph.mag;

  steps.push({
    number: nextStep(),
    title: 'Sending-End Voltage',
    latex: String.raw`V_S = A \cdot V_R + B \cdot I_R`,
    substitution: `A·V_R = ${A.mul(V_R_V).toString(2)} V, B·I_R = ${B.mul(I_R).toString(2)} V`,
    resultLatex: is3Phase 
      ? String.raw`V_{S(ph)} = ${V_S_ph.toPolarString(2)} \text{ kV}, \quad V_{S(LL)} = ${V_S_LL_kV.toFixed(3)} \text{ kV}`
      : String.raw`V_S = ${V_S_ph.toPolarString(2)} \text{ kV}`,
    result: is3Phase 
      ? `V_S(ph) = ${V_S_ph.toPolarString(2)} kV, V_S(LL) = ${V_S_LL_kV.toFixed(3)} kV`
      : `V_S = ${V_S_ph.toPolarString(2)} kV`,
  });

  // ── Step 6: Sending-End Current ──
  const I_S = C.mul(V_R_V).add(D.mul(I_R));

  steps.push({
    number: nextStep(),
    title: 'Sending-End Current',
    latex: String.raw`I_S = C \cdot V_R + D \cdot I_R`,
    substitution: `C·V_R = ${C.mul(V_R_V).toString(2)} A, D·I_R = ${D.mul(I_R).toString(2)} A`,
    resultLatex: String.raw`I_S = ${I_S.mag.toFixed(2)} \angle ${I_S.angleDeg.toFixed(2)}° \text{ A}`,
    result: `I_S = ${I_S.toPolarString(2)} A`,
  });

  // ── Step 7: Sending-End Power ──
  // S_S_ph = V_S(kV) × I_S*(A) = kVA per phase → ÷1000 = MVA
  const S_S_ph_kVA = V_S_ph.mul(I_S.conjugate()); // kVA
  const S_S_total = is3Phase ? S_S_ph_kVA.mul(3).div(1000) : S_S_ph_kVA.div(1000); // MVA total
  const P_S_MW = S_S_total.r;
  const Q_S_MVAR = S_S_total.i;
  const S_S_mag = S_S_total.mag;

  steps.push({
    number: nextStep(),
    title: 'Sending-End Power',
    latex: String.raw`S_S = 3 \cdot V_{S(ph)} \cdot I_S^* \quad \Rightarrow \quad P_S + jQ_S`,
    result: `S_S = ${S_S_total.toString(3)} MVA (P_S = ${P_S_MW.toFixed(3)} MW, Q_S = ${Q_S_MVAR.toFixed(3)} MVAR)`,
  });

  // ── Step 8: Sending-End Power Factor ──
  const PF_S = P_S_MW / S_S_mag;
  const pfSType: 'lagging' | 'leading' = Q_S_MVAR > 0 ? 'lagging' : 'leading';

  steps.push({
    number: nextStep(),
    title: 'Sending-End Power Factor',
    latex: String.raw`\text{pf}_S = \frac{P_S}{|S_S|} = \frac{${P_S_MW.toFixed(3)}}{${S_S_mag.toFixed(3)}}`,
    result: `PF_S = ${PF_S.toFixed(4)} ${pfSType}`,
  });

  // ── Step 9: Voltage Regulation ──
  const V_R_noLoad_mag = V_S_ph.mag / A.mag; // kV phase
  const VR_percent = ((V_R_noLoad_mag - V_R_ph_kV) / V_R_ph_kV) * 100;

  steps.push({
    number: nextStep(),
    title: 'Voltage Regulation',
    latex: String.raw`\%VR = \frac{|V_S|/|A| - |V_R|}{|V_R|} \times 100`,
    substitution: `|V_S|/|A| = ${V_S_ph.mag.toFixed(3)}/${A.mag.toFixed(4)} = ${V_R_noLoad_mag.toFixed(3)} kV, |V_R| = ${V_R_ph_kV.toFixed(3)} kV`,
    resultLatex: String.raw`\%VR = ${VR_percent.toFixed(3)}\%`,
    result: `VR = ${VR_percent.toFixed(3)} %`,
  });

  // ── Step 10: Efficiency ──
  const eta = (params.P_R_MW / P_S_MW) * 100;
  const lossesMW = P_S_MW - params.P_R_MW;

  steps.push({
    number: nextStep(),
    title: 'Transmission Efficiency',
    latex: String.raw`\eta = \frac{P_R}{P_S} \times 100 = \frac{${params.P_R_MW.toFixed(3)}}{${P_S_MW.toFixed(3)}} \times 100`,
    resultLatex: String.raw`\eta = ${eta.toFixed(3)}\%, \quad P_{\text{loss}} = ${lossesMW.toFixed(3)} \text{ MW}`,
    result: `η = ${eta.toFixed(3)} %, P_loss = ${lossesMW.toFixed(3)} MW`,
  });

  return {
    assignment,
    params,
    classification,
    modelName,
    modelReason,
    Z_total: Z,
    Y_total: Y,
    A, B, C, D,
    adMinusBc,
    V_R_ph: V_R,
    I_R,
    S_R_total,
    Q_R_MVAR,
    V_S_ph,
    V_S_LL_kV,
    I_S,
    S_S_total,
    P_S_MW,
    Q_S_MVAR,
    S_S_mag_MVA: S_S_mag,
    PF_S,
    pfSType,
    voltageRegulationPercent: VR_percent,
    efficiencyPercent: eta,
    lossesMW,
    steps,
  };
}
