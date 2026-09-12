import React from 'react';
import { SolverResult } from '../calculations/transmissionLine';

interface Props {
  result: SolverResult;
}

export function LineClassification({ result }: Props) {
  const badgeClass = result.classification === 'Short' ? 'badge-short'
    : result.classification === 'Medium' ? 'badge-medium'
    : 'badge-long';

  return (
    <section className="card" id="classification-section">
      <h2 className="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        Transmission Line Model
      </h2>

      <div className="classification-content">
        <div className="classification-length">{result.params.lengthKm} km</div>
        <div className={`classification-badge ${badgeClass}`}>
          {result.classification.toUpperCase()} TRANSMISSION LINE
        </div>
        <div className="classification-model">{result.modelName}</div>
        <p className="classification-reason">{result.modelReason}</p>
      </div>
    </section>
  );
}
