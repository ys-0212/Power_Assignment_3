import React from 'react';
import { SolverResult } from '../calculations/transmissionLine';

interface Props {
  result: SolverResult;
}

export function ResultCards({ result }: Props) {
  const primaryResults = [
    { label: 'Sending-End Voltage', value: `${result.V_S_LL_kV.toFixed(3)} kV`, sub: `${result.V_S_ph.toPolarString(2)} kV (phase)` },
    { label: 'Sending-End Current', value: `${result.I_S.mag.toFixed(3)} A`, sub: `∠ ${result.I_S.angleDeg.toFixed(2)}°` },
    { label: 'Sending-End Power', value: `${result.P_S_MW.toFixed(3)} MW`, sub: `${result.S_S_mag_MVA.toFixed(3)} MVA` },
    { label: 'Sending-End PF', value: `${result.PF_S.toFixed(4)}`, sub: result.pfSType },
    { label: 'Voltage Regulation', value: `${result.voltageRegulationPercent.toFixed(3)} %`, sub: '' },
    { label: 'Transmission Efficiency', value: `${result.efficiencyPercent.toFixed(3)} %`, sub: '' },
  ];

  return (
    <section className="card" id="results-section">
      <h2 className="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        Final Results
      </h2>

      <div className="result-cards-grid">
        {primaryResults.map((r, i) => (
          <div key={i} className="result-card">
            <div className="result-card-label">{r.label}</div>
            <div className="result-card-value">{r.value}</div>
            {r.sub && <div className="result-card-sub">{r.sub}</div>}
          </div>
        ))}
      </div>

      <h3 className="param-group-title" style={{ marginTop: '1.5rem' }}>Additional Quantities</h3>
      <table className="param-table">
        <tbody>
          <tr><td>Receiving-End Current</td><td className="val">{result.I_R.mag.toFixed(3)} A ∠ {result.I_R.angleDeg.toFixed(2)}°</td></tr>
          <tr><td>Receiving-End Active Power</td><td className="val">{result.params.P_R_MW.toFixed(3)} MW</td></tr>
          <tr><td>Receiving-End Reactive Power</td><td className="val">{result.Q_R_MVAR.toFixed(3)} MVAR</td></tr>
          <tr><td>Sending-End Reactive Power</td><td className="val">{result.Q_S_MVAR.toFixed(3)} MVAR</td></tr>
          <tr><td>Sending-End Apparent Power</td><td className="val">{result.S_S_mag_MVA.toFixed(3)} MVA</td></tr>
          <tr><td>Line Losses</td><td className="val">{result.lossesMW.toFixed(3)} MW</td></tr>
        </tbody>
      </table>
    </section>
  );
}
