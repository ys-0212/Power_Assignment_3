import React from 'react';
import { MEMBERS } from '../data/members';
import { LineParams } from '../calculations/transmissionLine';

interface Props {
  mode: 'assignment' | 'manual';
  onModeChange: (mode: 'assignment' | 'manual') => void;
  memberNumber: number;
  groupNumber: number;
  manualParams: LineParams;
  onMemberChange: (n: number) => void;
  onGroupChange: (n: number) => void;
  onManualChange: (params: Partial<LineParams>) => void;
  onCalculate: () => void;
  error?: string;
}

export function InputSection({
  mode, onModeChange,
  memberNumber, groupNumber,
  manualParams, onMemberChange, onGroupChange, onManualChange,
  onCalculate, error,
}: Props) {
  const memberName = groupNumber === 14 
    ? MEMBERS.find(m => m.number === memberNumber)?.name 
    : `Student ${memberNumber}`;

  return (
    <section className="card" id="input-section">
      <h2 className="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Assignment Input
      </h2>

      <div className="mode-toggle">
        <button
          className={`mode-btn ${mode === 'assignment' ? 'active' : ''}`}
          onClick={() => onModeChange('assignment')}
        >
          Assignment Mode
        </button>
        <button
          className={`mode-btn ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => onModeChange('manual')}
        >
          Manual Input
        </button>
      </div>

      {mode === 'assignment' ? (
        <div className="input-form">
          <div className="input-row">
            <div className="input-field">
              <label htmlFor="member-number">Member Number</label>
              <select
                id="member-number"
                value={memberNumber}
                onChange={e => onMemberChange(parseInt(e.target.value))}
              >
                {MEMBERS.map(m => (
                  <option key={m.number} value={m.number}>
                    {m.number} — {groupNumber === 14 ? m.name : `Student ${m.number}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-field">
              <label htmlFor="group-number">Group Number</label>
              <input
                id="group-number"
                type="number"
                min="1"
                value={groupNumber}
                onChange={e => onGroupChange(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>
          {memberName && (
            <div className="student-badge">
              <span className="student-badge-label">Student</span>
              <span className="student-badge-name">{memberName}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="input-form">
          <div className="input-row">
            <div className="input-field">
              <label htmlFor="m-freq">Frequency (Hz)</label>
              <input id="m-freq" type="number" value={manualParams.frequencyHz}
                onChange={e => onManualChange({ frequencyHz: parseFloat(e.target.value) || 50 })} />
            </div>
            <div className="input-field">
              <label htmlFor="m-length">Line Length (km)</label>
              <input id="m-length" type="number" value={manualParams.lengthKm}
                onChange={e => onManualChange({ lengthKm: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="input-row">
            <div className="input-field">
              <label htmlFor="m-r">Resistance (Ω/km)</label>
              <input id="m-r" type="number" step="0.01" value={manualParams.rPerKm}
                onChange={e => onManualChange({ rPerKm: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="input-field">
              <label htmlFor="m-x">Reactance (Ω/km)</label>
              <input id="m-x" type="number" step="0.01" value={manualParams.xPerKm}
                onChange={e => onManualChange({ xPerKm: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="input-row">
            <div className="input-field">
              <label htmlFor="m-b">Shunt Susceptance (S/km)</label>
              <input id="m-b" type="number" step="1e-7" value={manualParams.bPerKm}
                onChange={e => onManualChange({ bPerKm: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="input-field">
              <label htmlFor="m-vr">Receiving Voltage (kV L-L)</label>
              <input id="m-vr" type="number" value={manualParams.V_R_LL_kV}
                onChange={e => onManualChange({ V_R_LL_kV: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="input-row">
            <div className="input-field">
              <label htmlFor="m-pr">Receiving Power (MW)</label>
              <input id="m-pr" type="number" value={manualParams.P_R_MW}
                onChange={e => onManualChange({ P_R_MW: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="input-field">
              <label htmlFor="m-pf">Power Factor</label>
              <div className="pf-row">
                <input id="m-pf" type="number" step="0.01" min="0.01" max="1"
                  value={manualParams.PF_R}
                  onChange={e => onManualChange({ PF_R: parseFloat(e.target.value) || 0.8 })} />
                <select value={manualParams.pfType}
                  onChange={e => onManualChange({ pfType: e.target.value as 'lagging' | 'leading' })}>
                  <option value="lagging">Lagging</option>
                  <option value="leading">Leading</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      <button className="calc-btn" onClick={onCalculate}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Calculate Solution
      </button>
    </section>
  );
}
