import React from 'react';

interface Props {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  color?: string;
}

const KPI: React.FC<Props> = ({ icon, label, value, trend, color }) => {
  return (
    <div className="panel" style={{ textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
          {icon}
        </div>
        <div style={{ fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', background: 'var(--gold-a)', color: 'var(--gold)', border: '1px solid var(--gold-a)' }}>{trend}</div>
      </div>
      <div style={{ fontSize: '28px', fontStyle: 'italic', fontFamily: '"Instrument Serif", serif', marginBottom: '4px', color: color || 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '2px', fontWeight: 600 }}>{label}</div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${color || 'var(--gold)'}, transparent)` }} />
    </div>
  );
};

export default KPI;
