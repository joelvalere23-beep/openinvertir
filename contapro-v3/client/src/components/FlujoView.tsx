import React from 'react';
import { Trash2 } from 'lucide-react';
import { Transaction } from '../types';

interface Props {
  tx: Transaction[];
  deleteTransaction: (index: number) => void;
}

const FlujoView: React.FC<Props> = ({ tx, deleteTransaction }) => {
  const ingTotal = tx.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0);
  const egrTotal = tx.filter(t => t.tipo === 'egreso').reduce((s, t) => s + t.monto, 0);

  return (
    <div className="panel animate-in">
       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>Registro Histórico de Transacciones</div>
          <div style={{ display: 'flex', gap: '10px' }}>
             <div className="stat-pill">↑ ${ingTotal.toLocaleString()}</div>
             <div className="stat-pill" style={{color: 'var(--red)'}}>↓ ${egrTotal.toLocaleString()}</div>
          </div>
       </div>
       <div style={{ overflowX: 'auto' }}>
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontSize: '11px' }}>
                <th style={{ padding: '12px' }}>DESCRIPCIÓN</th>
                <th>CATEGORÍA</th>
                <th>TIPO</th>
                <th>FECHA</th>
                <th style={{ textAlign: 'right' }}>MONTO</th>
                <th style={{ textAlign: 'right', paddingRight: '12px' }}>ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {tx.map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '13px' }}>
                  <td style={{ padding: '16px 12px', fontWeight: 600 }}>{t.desc}</td>
                  <td><span className="badge-gold">{t.cat}</span></td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 800,
                      background: t.tipo === 'ingreso' ? 'var(--green-a)' : 'var(--red-a)',
                      color: t.tipo === 'ingreso' ? 'var(--green)' : 'var(--red)',
                      textTransform: 'uppercase'
                    }}>
                      {t.tipo}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{t.fecha}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: t.tipo === 'ingreso' ? 'var(--green)' : 'var(--red)' }}>
                    {t.tipo === 'ingreso' ? '+' : '-'}${t.monto.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '12px' }}>
                     <button onClick={() => deleteTransaction(i)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', opacity: 0.6, transition: 'var(--transition)' }}>
                        <Trash2 size={16} />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
       </div>
    </div>
  );
};

export default FlujoView;
