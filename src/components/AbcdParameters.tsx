import React from 'react';
import { SolverResult } from '../calculations/transmissionLine';
import katex from 'katex';

function Tex({ math }: { math: string }) {
  try {
    return <span dangerouslySetInnerHTML={{
      __html: katex.renderToString(math, { throwOnError: false, displayMode: false })
    }} />;
  } catch {
    return <code>{math}</code>;
  }
}

interface Props {
  result: SolverResult;
}

export function AbcdParameters({ result }: Props) {
  const { A, B, C, D, adMinusBc } = result;

  const params = [
    { name: 'A', complex: A, unit: '(dimensionless)' },
    { name: 'B', complex: B, unit: 'Ω' },
    { name: 'C', complex: C, unit: 'S' },
    { name: 'D', complex: D, unit: '(dimensionless)' },
  ];

  return (
    <section className="card" id="abcd-section">
      <h2 className="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
        ABCD Parameters
      </h2>

      <div className="abcd-equation">
        <Tex math={String.raw`\begin{bmatrix} V_S \\ I_S \end{bmatrix} = \begin{bmatrix} A & B \\ C & D \end{bmatrix} \begin{bmatrix} V_R \\ I_R \end{bmatrix}`} />
      </div>

      <div className="abcd-grid">
        {params.map(p => (
          <div key={p.name} className="abcd-cell">
            <div className="abcd-name">{p.name}</div>
            <div className="abcd-value">{p.complex.toString(p.name === 'C' ? 6 : 4)}</div>
            <div className="abcd-polar">{p.complex.toPolarString(4)}</div>
            <div className="abcd-unit">{p.unit}</div>
          </div>
        ))}
      </div>

      <div className="abcd-check">
        <Tex math={String.raw`AD - BC = ${adMinusBc.toString(4)}`} />
        <span className="check-note">(should ≈ 1 + j0 for reciprocal network)</span>
      </div>
    </section>
  );
}
