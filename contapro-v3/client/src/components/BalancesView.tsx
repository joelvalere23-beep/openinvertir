import React from 'react';
import { BalanceItem } from '../types';

interface Props {
  activos: BalanceItem[];
  pasivos: BalanceItem[];
}

const BalancesView: React.FC<Props> = ({ activos, pasivos }) => {
  const totAct = activos.reduce((s, a) => s + a.monto, 0);
  const totPas = pasivos.reduce((s, p) => s + p.monto, 0);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-in">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="panel">
          <div style={{ fontSize: '14px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '12px' }}>Estado Activos</div>
          {activos.map((a, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px' }}>
              <span>{a.desc} <span style={{fontSize: '10px', color: 'var(--muted)'}}>({a.tipo})</span></span>
              <span style={{color:'var(--green)', fontWeight:700}}>${a.monto.toLocaleString()}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
             <span>Total Activos</span>
             <span style={{ color: 'var(--green)' }}>${totAct.toLocaleString()}</span>
          </div>
        </div>
        <div className="panel">
          <div style={{ fontSize: '14px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '12px' }}>Pasivos & Patrimonio</div>
          {pasivos.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px' }}>
              <span>{p.desc} <span style={{fontSize: '10px', color: 'var(--muted)'}}>({p.tipo})</span></span>
              <span style={{color:'var(--red)', fontWeight:700}}>${p.monto.toLocaleString()}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
             <span>Total Pasivos + Capital</span>
             <span style={{ color: 'var(--red)' }}>${totPas.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="panel" style={{ textAlign: 'center', background: 'var(--gold-a)', border: '1px solid var(--gold)' }}>
         <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>ESTADO DE EQUILIBRIO PATRIMONIAL</div>
         <div style={{ fontSize: '32px', fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', color: Math.abs(totAct - totPas) < 1 ? 'var(--green)' : 'var(--gold)' }}>
           {Math.abs(totAct - totPas) < 1 ? '⚖️ BALANCE ESTRUCTURAL' : `$${(totAct - totPas).toLocaleString()}`}
         </div>
      </div>
    </div>
  );
};

export default BalancesView;
