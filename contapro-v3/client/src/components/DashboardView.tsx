import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, BarChart3, Receipt } from 'lucide-react';
import { Transaction, Factura } from '../types';
import KPI from './ui/KPI';
import CategoryItem from './ui/CategoryItem';

interface Props {
  tx: Transaction[];
  facturas: Factura[];
}

const COLORS = ['#ff5e7a', '#c9a84c', '#4d9fff', '#00d68f'];

const DashboardView: React.FC<Props> = ({ tx, facturas }) => {
  const ing = tx.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0);
  const egr = tx.filter(t => t.tipo === 'egreso').reduce((s, t) => s + t.monto, 0);
  const util = ing - egr;
  const pend = facturas.filter(f => f.est === 'pendiente').length;

  // Chart data simulation
  const chartData = [
    { name: 'Ene', income: 4000, expense: 2400 },
    { name: 'Feb', income: 3000, expense: 1398 },
    { name: 'Mar', income: 9800, expense: 2000 },
    { name: 'Abr', income: 3908, expense: 2780 },
    { name: 'May', income: 4800, expense: 1890 },
    { name: 'Jun', income: 3800, expense: 2390 },
  ];

  const pieData = [
    { name: 'Nómina', value: 45 },
    { name: 'Suministros', value: 15 },
    { name: 'Marketing', value: 20 },
    { name: 'Operaciones', value: 20 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <KPI icon={<ArrowUpRight color="var(--green)" />} label="Ingresos" value={`$${ing.toLocaleString()}`} trend="+12.4%" color="var(--green)" />
        <KPI icon={<ArrowDownRight color="var(--red)" />} label="Egresos" value={`$${egr.toLocaleString()}`} trend="+3.1%" color="var(--red)" />
        <KPI icon={<BarChart3 color="var(--gold)" />} label="Utilidad Neta" value={`$${util.toLocaleString()}`} trend="+18.7%" color="var(--gold)" />
        <KPI icon={<Receipt color="var(--blue)" />} label="Facturas" value={facturas.length.toString()} trend={`${pend} Pendientes`} color="var(--blue)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>Flujo de Caja Real vs Gastos</div>
            <div style={{ fontSize: '11px', color: 'var(--gold)', cursor: 'pointer' }}>Detalle Completo →</div>
          </div>
          <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--green)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--green)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--red)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--red)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--muted)', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--muted)', fontSize: 10}} />
                <Tooltip contentStyle={{background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px'}} />
                <Area type="monotone" dataKey="income" stroke="var(--green)" fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="var(--red)" fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '24px' }}>Distribución de Egresos</div>
          <div style={{ height: '180px', width: '100%', marginBottom: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
               </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {pieData.map((item, i) => (
              <CategoryItem key={i} label={item.name} value={`${item.value}%`} color={COLORS[i % COLORS.length]} />
            ))}
          </div>
        </div>
      </div>
      
      <div className="panel">
        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '20px' }}>Análisis de Transacciones Recientes</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontSize: '11px' }}>
                <th style={{ padding: '12px' }}>CONCEPTO</th>
                <th>CATEGORÍA</th>
                <th>FECHA</th>
                <th style={{ textAlign: 'right', paddingRight: '12px' }}>IMPORTE</th>
              </tr>
            </thead>
            <tbody>
              {tx.slice(0, 5).map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '13px' }}>
                  <td style={{ padding: '14px 12px', fontWeight: 600 }}>{t.desc}</td>
                  <td><span className="badge-gold">{t.cat}</span></td>
                  <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{t.fecha}</td>
                  <td style={{ textAlign: 'right', paddingRight: '12px', color: t.tipo === 'ingreso' ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                    {t.tipo === 'ingreso' ? '+' : '-'}${t.monto.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
