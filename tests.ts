import { solveTransmissionLine, LineParams } from './src/calculations/transmissionLine';
import { deriveAssignmentParams, assignmentToLineParams } from './src/calculations/transmissionLine';

function assertAlmostEqual(a: number, b: number, tol = 1e-4, msg: string) {
  if (Math.abs(a - b) > tol) {
    throw new Error(`FAIL: ${msg} | Expected ${b.toFixed(4)}, got ${a.toFixed(4)}`);
  }
}

// TEST 1: Short-line case
console.log('--- TEST 1: Short Line ---');
const shortParams: LineParams = {
  frequencyHz: 50, lengthKm: 50, rPerKm: 0.1, xPerKm: 1.0, bPerKm: 2.8e-6, gPerKm: 0,
  V_R_LL_kV: 220, P_R_MW: 45, PF_R: 0.5, pfType: 'lagging', mediumModel: 'Nominal-Pi', phaseSystem: '3-Phase'
};
const resShort = solveTransmissionLine(shortParams);
console.log(`Classification: ${resShort.classification}`);
assertAlmostEqual(resShort.A.r, 1, 1e-4, 'Short A.r');
assertAlmostEqual(resShort.A.i, 0, 1e-4, 'Short A.i');
assertAlmostEqual(resShort.B.r, 5, 1e-4, 'Short B.r');
assertAlmostEqual(resShort.B.i, 50, 1e-4, 'Short B.i');
assertAlmostEqual(resShort.C.r, 0, 1e-4, 'Short C.r');

// TEST 2: Medium-line nominal-T case
console.log('--- TEST 2: Medium Line Nominal-T ---');
const medTParams: LineParams = {
  ...shortParams, lengthKm: 150, mediumModel: 'Nominal-T'
};
const resMedT = solveTransmissionLine(medTParams);
console.log(`Classification: ${resMedT.classification}, Model: ${resMedT.modelName}`);
// A = 1 + ZY/2. Z = 15+j150. Y = j0.00042. ZY/2 = (15+j150)(j0.00042)/2 = (-0.063 + j0.0063)/2 = -0.0315 + j0.00315
// A = 0.9685 + j0.00315
assertAlmostEqual(resMedT.A.r, 0.9685, 1e-4, 'MedT A.r');
assertAlmostEqual(resMedT.A.i, 0.00315, 1e-4, 'MedT A.i');
// C = Y = 0 + j0.00042
assertAlmostEqual(resMedT.C.i, 0.00042, 1e-4, 'MedT C.i');

// TEST 3: Medium-line nominal-Pi case
console.log('--- TEST 3: Medium Line Nominal-Pi ---');
const medPiParams: LineParams = { ...medTParams, mediumModel: 'Nominal-Pi' };
const resMedPi = solveTransmissionLine(medPiParams);
console.log(`Classification: ${resMedPi.classification}, Model: ${resMedPi.modelName}`);
// A is same as Nominal-T
assertAlmostEqual(resMedPi.A.r, 0.9685, 1e-4, 'MedPi A.r');
// B = Z = 15 + j150
assertAlmostEqual(resMedPi.B.r, 15, 1e-4, 'MedPi B.r');
assertAlmostEqual(resMedPi.B.i, 150, 1e-4, 'MedPi B.i');

// TEST 4: Long-line case
console.log('--- TEST 4: Long Line ---');
const longParams: LineParams = { ...shortParams, lengthKm: 300 };
const resLong = solveTransmissionLine(longParams);
console.log(`Classification: ${resLong.classification}`);

// TEST 5 & 6: Lagging vs Leading
console.log('--- TEST 5 & 6: Lagging vs Leading PF ---');
const lagParams: LineParams = { ...shortParams, PF_R: 0.8, pfType: 'lagging' };
const leadParams: LineParams = { ...shortParams, PF_R: 0.8, pfType: 'leading' };
const resLag = solveTransmissionLine(lagParams);
const resLead = solveTransmissionLine(leadParams);
console.log(`Lagging IR Angle: ${resLag.I_R.angleDeg.toFixed(2)}`);
console.log(`Leading IR Angle: ${resLead.I_R.angleDeg.toFixed(2)}`);
assertAlmostEqual(resLag.I_R.angleDeg, -36.87, 1e-2, 'Lagging Angle');
assertAlmostEqual(resLead.I_R.angleDeg, 36.87, 1e-2, 'Leading Angle');

// TEST 7: Assignment Mode vs Manual Mode Identicality
console.log('--- TEST 7: Assignment vs Manual ---');
const derived = deriveAssignmentParams({ memberNumber: 5, groupNumber: 9 });
const assignmentParams = assignmentToLineParams({ memberNumber: 5, groupNumber: 9 });
const resAssign = solveTransmissionLine(assignmentParams, derived);

const manualIdentical: LineParams = {
  frequencyHz: 50,
  lengthKm: 190,
  rPerKm: 0.1,
  xPerKm: 1.0,
  bPerKm: 2.8e-6,
  gPerKm: 0,
  V_R_LL_kV: 220,
  P_R_MW: 45,
  PF_R: 0.5,
  pfType: 'lagging',
  mediumModel: 'Nominal-Pi',
  phaseSystem: '3-Phase'
};
const resManual = solveTransmissionLine(manualIdentical);

console.log('Comparing Assignment Result vs Manual Result...');
assertAlmostEqual(resAssign.V_S_LL_kV, resManual.V_S_LL_kV, 1e-6, 'VS Mismatch');
assertAlmostEqual(resAssign.efficiencyPercent, resManual.efficiencyPercent, 1e-6, 'Efficiency Mismatch');
assertAlmostEqual(resAssign.A.r, resManual.A.r, 1e-6, 'A Mismatch');
console.log('Test 7 PASSED. Identical outputs.');

// Edge cases
console.log('--- EDGE CASES ---');
const edge80 = solveTransmissionLine({ ...shortParams, lengthKm: 80 }).classification;
const edge80_001 = solveTransmissionLine({ ...shortParams, lengthKm: 80.001 }).classification;
const edge250 = solveTransmissionLine({ ...shortParams, lengthKm: 250 }).classification;
const edge250_001 = solveTransmissionLine({ ...shortParams, lengthKm: 250.001 }).classification;
console.log(`80 km -> ${edge80}`);
console.log(`80.001 km -> ${edge80_001}`);
console.log(`250 km -> ${edge250}`);
console.log(`250.001 km -> ${edge250_001}`);
if (edge80 !== 'Short' || edge80_001 !== 'Medium' || edge250 !== 'Medium' || edge250_001 !== 'Long') {
  throw new Error("Edge case boundaries failed!");
}

// 1-Phase vs 3-Phase verification
console.log('--- 1-Phase vs 3-Phase Verification ---');
const phase3Params: LineParams = { ...shortParams, phaseSystem: '3-Phase' };
const phase1Params: LineParams = { ...shortParams, phaseSystem: '1-Phase' };
const res3 = solveTransmissionLine(phase3Params);
const res1 = solveTransmissionLine(phase1Params);

// For 3-Phase: V_R_ph = V_R_LL / sqrt(3) => 220 / sqrt(3) ~ 127
// For 1-Phase: V_R_ph = V_R_LL => 220
assertAlmostEqual(res3.V_R_ph.mag, 220 / Math.sqrt(3), 1e-4, '3-Phase VR ph');
assertAlmostEqual(res1.V_R_ph.mag, 220, 1e-4, '1-Phase VR ph');

// For 3-Phase: I_R = S / (sqrt(3)*V*PF)
// For 1-Phase: I_R = S / (V*PF) 
assertAlmostEqual(res3.I_R.mag * Math.sqrt(3), res1.I_R.mag, 1e-4, 'IR relationship between 1ph and 3ph');

console.log('ALL TESTS PASSED SUCCESSFULLY!');
