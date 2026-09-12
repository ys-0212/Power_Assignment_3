import React from 'react';

export function TransmissionDiagram() {
  return (
    <div className="diagram-container" id="diagram-section">
      <svg viewBox="0 0 600 100" className="tl-diagram" aria-label="Transmission line schematic">
        {/* Sending end */}
        <circle cx="60" cy="50" r="8" fill="none" stroke="#2563eb" strokeWidth="2" />
        <text x="60" y="85" textAnchor="middle" className="diagram-label">Sending End</text>
        <text x="60" y="25" textAnchor="middle" className="diagram-sublabel">V_S, I_S</text>

        {/* Line */}
        <line x1="68" y1="50" x2="240" y2="50" stroke="#374151" strokeWidth="2" />
        {/* Zigzag for impedance */}
        <polyline points="240,50 250,40 260,60 270,40 280,60 290,40 300,60 310,40 320,50"
          fill="none" stroke="#374151" strokeWidth="2" />
        <line x1="320" y1="50" x2="532" y2="50" stroke="#374151" strokeWidth="2" />

        {/* Label */}
        <text x="300" y="85" textAnchor="middle" className="diagram-sublabel">Z, Y</text>

        {/* Receiving end */}
        <circle cx="540" cy="50" r="8" fill="none" stroke="#dc2626" strokeWidth="2" />
        <text x="540" y="85" textAnchor="middle" className="diagram-label">Receiving End</text>
        <text x="540" y="25" textAnchor="middle" className="diagram-sublabel">V_R, I_R</text>

        {/* Load symbol */}
        <line x1="548" y1="50" x2="580" y2="50" stroke="#374151" strokeWidth="2" />
        <path d="M580,35 L580,65 L595,50 Z" fill="none" stroke="#374151" strokeWidth="2" />
      </svg>
    </div>
  );
}
