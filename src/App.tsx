import React, { useState } from 'react';
import {
  LineParams,
  SolverResult,
  deriveAssignmentParams,
  assignmentToLineParams,
  solveTransmissionLine,
} from './calculations/transmissionLine';
import { getMemberName } from './data/members';
import { InputSection } from './components/InputSection';
import { ParameterSummary } from './components/ParameterSummary';
import { LineClassification } from './components/LineClassification';
import { TransmissionDiagram } from './components/TransmissionDiagram';
import { ResultCards } from './components/ResultCards';
import { AbcdParameters } from './components/AbcdParameters';
import { CalculationSteps } from './components/CalculationSteps';

const DEFAULT_MANUAL: LineParams = {
  frequencyHz: 50,
  lengthKm: 150,
  rPerKm: 0.1,
  xPerKm: 0.5,
  bPerKm: 3e-6,
  gPerKm: 0,
  V_R_LL_kV: 110,
  P_R_MW: 50,
  PF_R: 0.8,
  pfType: 'lagging',
  mediumModel: 'Nominal-Pi',
  phaseSystem: '3-Phase',
};

export default function App() {
  const [mode, setMode] = useState<'assignment' | 'manual'>('assignment');
  const [memberNumber, setMemberNumber] = useState(5);
  const [groupNumber, setGroupNumber] = useState(9);
  const [manualParams, setManualParams] = useState<LineParams>(DEFAULT_MANUAL);
  const [result, setResult] = useState<SolverResult | null>(null);
  const [error, setError] = useState<string | undefined>();

  const handleCalculate = () => {
    setError(undefined);
    try {
      if (mode === 'assignment') {
        if (memberNumber < 1 || memberNumber > 6) {
          setError('Member Number must be between 1 and 6.');
          return;
        }
        if (groupNumber < 1 || !Number.isInteger(groupNumber)) {
          setError('Group Number must be a positive integer.');
          return;
        }
        const derived = deriveAssignmentParams(
          { memberNumber, groupNumber },
          getMemberName(memberNumber, groupNumber)
        );
        if (derived.L <= 0) {
          setError(`Derived line length is ${derived.L} km. Check Member/Group values.`);
          return;
        }
        if (derived.PF_R <= 0 || derived.PF_R > 1) {
          setError(`Derived power factor ${derived.PF_R} is invalid.`);
          return;
        }
        const lineParams = assignmentToLineParams({ memberNumber, groupNumber });
        const res = solveTransmissionLine(lineParams, derived);
        setResult(res);
      } else {
        if (manualParams.frequencyHz <= 0) {
          setError('Frequency must be greater than 0 Hz.');
          return;
        }
        if (manualParams.lengthKm <= 0) {
          setError('Line length must be positive.');
          return;
        }
        if (manualParams.rPerKm < 0) {
          setError('Resistance cannot be negative.');
          return;
        }
        if (manualParams.xPerKm < 0) {
          setError('Reactance cannot be negative.');
          return;
        }
        if (manualParams.gPerKm < 0) {
          setError('Conductance cannot be negative.');
          return;
        }
        if (manualParams.bPerKm < 0) {
          setError('Susceptance cannot be negative.');
          return;
        }
        if (manualParams.V_R_LL_kV <= 0) {
          setError('Receiving-end voltage must be greater than 0 kV.');
          return;
        }
        if (manualParams.P_R_MW <= 0) {
          setError('Receiving-end power must be greater than 0 MW.');
          return;
        }
        if (manualParams.PF_R <= 0 || manualParams.PF_R > 1) {
          setError('Power factor must be strictly greater than 0 and less than or equal to 1.');
          return;
        }
        
        const res = solveTransmissionLine(manualParams);
        setResult(res);
      }
    } catch (e: any) {
      setError('Calculation error: ' + e.message);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Power Transmission Line Analysis</h1>
        <p className="app-subtitle">Assignment 3 · Transmission Line Performance Calculator</p>
      </header>

      <InputSection
        mode={mode}
        onModeChange={setMode}
        memberNumber={memberNumber}
        groupNumber={groupNumber}
        manualParams={manualParams}
        onMemberChange={setMemberNumber}
        onGroupChange={setGroupNumber}
        onManualChange={(partial) => setManualParams(prev => ({ ...prev, ...partial }))}
        onCalculate={handleCalculate}
        error={error}
      />

      {result && (
        <>
          <ParameterSummary result={result} />
          <LineClassification result={result} />
          <TransmissionDiagram />
          <ResultCards result={result} />
          <AbcdParameters result={result} />
          <CalculationSteps steps={result.steps} />
        </>
      )}

      <footer className="app-footer">
        <p>Assignment 3 — Transmission Line Performance Portal</p>
      </footer>
    </div>
  );
}
