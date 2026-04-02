import React from 'react';
import { Factura } from '../types';

interface Props {
  facturas: Factura[];
}

const FacturasView: React.FC<Props> = ({ facturas }) => {
  return (
    <div className="panel animate-in">
       <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Gestión de Facturación</div>
       <div style={{ overflowX: 'auto' }}>
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontSize: '11px' }}>
                <th style={{ padding: '12px' }}>Nº</th>
                <th>CLIENTE</th>
                <th>CONCEPTO</th>
                <th>VENCIMIENTO</th>
                <th>ESTADO</th>
                <th style={{ textAlign: 'right', paddingRight: '12px' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '13px' }}>
                  <td style={{ padding: '16px 12px' }}><span style={{ color: 'var(--gold)', fontWeight: 700 }}>{f.num}</span></td>
                  <td style={{ fontWeight: 600 }}>{f.cli}</td>
                  <td style={{ color: 'var(--muted)' }}>{f.con}</td>
                  <td style={{ fontSize: '12px' }}>{f.ven}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 800,
                      background: f.est === 'cobrada' ? 'var(--green-a)' : 'var(--gold-a)',
                      color: f.est === 'cobrada' ? 'var(--green)' : 'var(--gold)',
                      textTransform: 'uppercase'
                    }}>
                      {f.est}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '12px', fontWeight: 700 }}>${f.tot.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
       </div>
    </div>
  );
};

export default FacturasView;
