import React from 'react';
import { Transaction } from '../types';

interface Props {
  tx: Transaction[];
}

const ResultadosView: React.FC<Props> = ({ tx }) => {
  const ing = tx.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0);
  const egr = tx.filter(t => t.tipo === 'egreso').reduce((s, t) => s + t.monto, 0);
  const util = ing - egr;
  const isr = util > 0 ? util * 0.3 : 0;
  const neta = util - isr;

  return (
    <div className="panel animate-in" style={{ maxWidth: '650px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
         <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: '"Instrument Serif", serif', fontStyle: 'italic' }}>Estado de Resultados Auditado</div>
         <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '2px' }}>CONSOLIDADO MARZO 2026</div>
      </div>
      
      <ResultRow label="INGRESOS OPERATIVOS" value={ing} color="var(--green)" bold />
      <div style={{ height: '10px' }} />
      <ResultRow label="Costos y Gastos de Operación" value={-egr} sub />
      <ResultRow label="UTILIDAD DE OPERACIÓN" value={util} color="var(--gold)" bold indent />
      <div style={{ height: '10px' }} />
      <ResultRow label="Impuestos sobre la Renta (30%)" value={-isr} sub />
      <div style={{ height: '20px', borderBottom: '1px solid var(--border)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 0', alignItems: 'center' }}>
         <span style={{ fontWeight: 800 }}>UTILIDAD NETA TOTAL</span>
         <span style={{ fontSize: '32px', color: neta >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500, fontFamily: '"Instrument Serif", serif', fontStyle: 'italic' }}>
            ${neta.toLocaleString()}
         </span>
      </div>
    </div>
  );
};

function ResultRow({ label, value, color, bold, indent, sub }: any) {
  return (
    <div style={{ 
      display: 'flex', justifyContent: 'space-between', padding: '12px 0', 
      borderBottom: sub ? 'none' : '1px solid rgba(255,255,255,0.03)',
      fontSize: bold ? '14px' : '13px',
      paddingLeft: indent ? '24px' : '0',
      fontWeight: bold ? 700 : 400
    }}>
      <span style={{ color: sub ? 'var(--muted)' : 'var(--text)' }}>{sub ? '(-)' : ''} {label}</span>
      <span style={{ color: color || (value < 0 ? 'var(--red)' : 'var(--text)') }}>
        {value < 0 ? '-' : ''}${Math.abs(value).toLocaleString()}
      </span>
    </div>
  );
}

export default ResultadosView;
