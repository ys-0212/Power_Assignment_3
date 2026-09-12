import React from 'react';
import { SolverResult } from '../calculations/transmissionLine';

interface Props {
  result: SolverResult;
}

export function ParameterSummary({ result }: Props) {
  const { params, assignment } = result;

  return (
    <section className="card" id="parameters-section">
      <h2 className="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Assigned Parameters
      </h2>

      {assignment && (
        <>
          <div className="param-group">
            <h3 className="param-group-title">Student Information</h3>
            <table className="param-table">
              <tbody>
                <tr><td>Member Number</td><td className="val">{assignment.memberNumber}</td></tr>
                {assignment.memberName && <tr><td>Student Name</td><td className="val">{assignment.memberName}</td></tr>}
                <tr><td>Group Number</td><td className="val">{assignment.groupNumber}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="param-group">
            <h3 className="param-group-title">Derived Assignment Values</h3>
            <div className="derived-grid">
              <div className="derived-cell"><span className="derived-key">K</span><span className="derived-value">{assignment.K}</span></div>
              <div className="derived-cell"><span className="derived-key">J</span><span className="derived-value">{assignment.J}</span></div>
              <div className="derived-cell"><span className="derived-key">XX</span><span className="derived-value">{assignment.XX}</span></div>
              <div className="derived-cell"><span className="derived-key">m</span><span className="derived-value">{assignment.m}</span></div>
            </div>
          </div>
        </>
      )}

      <div className="param-group">
        <h3 className="param-group-title">Electrical Parameters</h3>
        <table className="param-table">
          <tbody>
            <tr><td>Line Length</td><td className="val">{params.lengthKm} km</td></tr>
            <tr><td>Receiving-End Power</td><td className="val">{params.P_R_MW} MW</td></tr>
            <tr><td>Receiving-End Voltage</td><td className="val">{params.V_R_LL_kV} kV (L-L)</td></tr>
            <tr><td>Receiving-End Power Factor</td><td className="val">{params.PF_R} {params.pfType}</td></tr>
            <tr><td>Receiving-End Reactive Power</td><td className="val">{result.Q_R_MVAR.toFixed(3)} MVAR</td></tr>
          </tbody>
        </table>
      </div>

      <div className="param-group">
        <h3 className="param-group-title">Problem Constants</h3>
        <div className="constants-row">
          <span className="const-chip">{params.frequencyHz} Hz</span>
          <span className="const-chip">Z = {params.rPerKm} + j{params.xPerKm} Ω/km</span>
          <span className="const-chip">Y = j{params.bPerKm.toExponential(1)} S/km</span>
        </div>
      </div>
    </section>
  );
}
