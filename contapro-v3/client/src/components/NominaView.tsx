import React from 'react';
import { Empleado } from '../types';

interface Props {
  empleados: Empleado[];
}

const NominaView: React.FC<Props> = ({ empleados }) => {
  return (
    <div className="panel animate-in">
       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>Gestión de Capital Humano</div>
          <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '11px' }}>+ Registrar Empleado</button>
       </div>
       <div style={{ overflowX: 'auto' }}>
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontSize: '11px' }}>
                <th style={{ padding: '12px' }}>COLABORADOR</th>
                <th>POSICIÓN</th>
                <th>DEPARTAMENTO</th>
                <th>MODALIDAD</th>
                <th style={{ textAlign: 'right', paddingRight: '12px' }}>SUELDO BRUTO</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map((e, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '13px' }}>
                  <td style={{ padding: '18px 12px', fontWeight: 600 }}>{e.nom}</td>
                  <td style={{ color: 'var(--muted)' }}>{e.puesto}</td>
                  <td><span style={{ fontSize: '10px', background: 'var(--blue-a)', color: 'var(--blue)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(77,159,255,0.1)' }}>{e.depto}</span></td>
                  <td><span style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>{e.contrato}</span></td>
                  <td style={{ textAlign: 'right', paddingRight: '12px', fontWeight: 700 }}>${e.sal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
       </div>
    </div>
  );
};

export default NominaView;
