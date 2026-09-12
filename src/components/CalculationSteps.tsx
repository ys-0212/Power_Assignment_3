import React from 'react';
import { CalculationStep } from '../calculations/transmissionLine';
import katex from 'katex';

function Tex({ math, display = false }: { math: string; display?: boolean }) {
  try {
    return <span dangerouslySetInnerHTML={{
      __html: katex.renderToString(math, { throwOnError: false, displayMode: display })
    }} />;
  } catch {
    return <code>{math}</code>;
  }
}

interface Props {
  steps: CalculationStep[];
}

export function CalculationSteps({ steps }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <section className="card" id="calculation-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="card-title" style={{ margin: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          Detailed Calculation
        </h2>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: '4px',
            padding: '4px 12px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--primary)'
          }}
        >
          {isOpen ? '⌃ Hide Calculation Details' : '⌄ Show Calculation Details'}
        </button>
      </div>

      {isOpen && (
        <div className="steps-list">
          {steps.map((step) => (
            <div key={step.number} className="step-block">
              <div className="step-indicator">
                <span className="step-num">{step.number}</span>
              </div>
              <div className="step-body">
                <h3 className="step-title">{step.title}</h3>

                {step.latex && (
                  <div className="step-equation">
                    <span className="step-label">Formula</span>
                    <div className="equation-box">
                      <Tex math={step.latex} display />
                    </div>
                  </div>
                )}

                {step.given && (
                  <div className="step-detail">
                    <span className="step-label">Given</span>
                    <span className="step-text">{step.given}</span>
                  </div>
                )}

                {step.substitution && (
                  <div className="step-detail">
                    <span className="step-label">Substitution</span>
                    <span className="step-text">{step.substitution}</span>
                  </div>
                )}

                <div className="step-result-box">
                  <span className="step-label">Result</span>
                  {step.resultLatex ? (
                    <div className="step-result-value"><Tex math={step.resultLatex} /></div>
                  ) : (
                    <div className="step-result-value">{step.result}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
