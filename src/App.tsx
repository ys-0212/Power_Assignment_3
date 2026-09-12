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

export interface ManualInputState {
  frequencyHz: string;
  lengthKm: string;
  rPerKm: string;
  xPerKm: string;
  bPerKm: string;
  gPerKm: string;
  V_R_LL_kV: string;
  P_R_MW: string;
  PF_R: string;
  pfType: 'lagging' | 'leading';
  phaseSystem: '3-Phase' | '1-Phase';
}

const DEFAULT_MANUAL: ManualInputState = {
  frequencyHz: '',
  lengthKm: '',
  rPerKm: '',
  xPerKm: '',
  bPerKm: '',
  gPerKm: '',
  V_R_LL_kV: '',
  P_R_MW: '',
  PF_R: '',
  pfType: 'lagging',
  phaseSystem: '3-Phase',
};

export default function App() {
  const [mode, setMode] = useState<'assignment' | 'manual'>('assignment');
  const [memberNumber, setMemberNumber] = useState(5);
  const [groupNumber, setGroupNumber] = useState(9);
  const [assignmentPhase, setAssignmentPhase] = useState<'3-Phase' | '1-Phase'>('3-Phase');
  const [manualParams, setManualParams] = useState<ManualInputState>(DEFAULT_MANUAL);
  const [result, setResult] = useState<SolverResult | null>(null);
  const [error, setError] = useState<string | undefined>();

  const handleModeChange = (newMode: 'assignment' | 'manual') => {
    setMode(newMode);
    setResult(null);
    setError(undefined);
  };

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
        lineParams.phaseSystem = assignmentPhase;
        const res = solveTransmissionLine(lineParams, derived);
        setResult(res);
      } else {
        const p = manualParams;
        if (p.frequencyHz === '') return setError('Please enter a frequency.');
        if (p.lengthKm === '') return setError('Please enter the line length.');
        if (p.rPerKm === '') return setError('Please enter resistance (R).');
        if (p.xPerKm === '') return setError('Please enter reactance (X).');
        if (p.gPerKm === '') return setError('Please enter conductance (G).');
        if (p.bPerKm === '') return setError('Please enter susceptance (B).');
        if (p.V_R_LL_kV === '') return setError('Please enter receiving-end voltage.');
        if (p.P_R_MW === '') return setError('Please enter receiving-end power.');
        if (p.PF_R === '') return setError('Please enter a power factor.');

        const frequencyHz = Number(p.frequencyHz);
        const lengthKm = Number(p.lengthKm);
        const rPerKm = Number(p.rPerKm);
        const xPerKm = Number(p.xPerKm);
        const gPerKm = Number(p.gPerKm);
        const bPerKm = Number(p.bPerKm);
        const V_R_LL_kV = Number(p.V_R_LL_kV);
        const P_R_MW = Number(p.P_R_MW);
        const PF_R = Number(p.PF_R);

        if (frequencyHz <= 0) return setError('Frequency must be greater than 0 Hz.');
        if (lengthKm <= 0) return setError('Line length must be positive.');
        if (rPerKm < 0) return setError('Resistance cannot be negative.');
        if (xPerKm < 0) return setError('Reactance cannot be negative.');
        if (gPerKm < 0) return setError('Conductance cannot be negative.');
        if (bPerKm < 0) return setError('Susceptance cannot be negative.');
        if (V_R_LL_kV <= 0) return setError('Receiving-end voltage must be greater than 0 kV.');
        if (P_R_MW <= 0) return setError('Receiving-end power must be greater than 0 MW.');
        if (PF_R <= 0 || PF_R > 1) return setError('Power factor must be strictly greater than 0 and less than or equal to 1.');
        
        const finalParams: LineParams = {
          frequencyHz, lengthKm, rPerKm, xPerKm, gPerKm, bPerKm,
          V_R_LL_kV, P_R_MW, PF_R, pfType: p.pfType, phaseSystem: p.phaseSystem,
          mediumModel: 'Nominal-Pi'
        };

        const res = solveTransmissionLine(finalParams);
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
        onModeChange={handleModeChange}
        memberNumber={memberNumber}
        groupNumber={groupNumber}
        assignmentPhase={assignmentPhase}
        onAssignmentPhaseChange={setAssignmentPhase}
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
