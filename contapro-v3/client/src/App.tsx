import React, { useState, useEffect } from 'react';
import { Plus, Bell, Search, Clock } from 'lucide-react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import FlujoView from './components/FlujoView';
import FacturasView from './components/FacturasView';
import ResultadosView from './components/ResultadosView';
import BalancesView from './components/BalancesView';
import NominaView from './components/NominaView';
import Modal from './components/Modal';
import AIPanel from './components/AIPanel';
import { Transaction, Factura, Empleado, BalanceItem } from './types';
import './index.css';

// ◈ ContaPro V3 — Final Business Intelligence Suite
function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAI, setShowAI] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // --- PERSISTENCE & INITIAL STATE ---
  const [tx, setTx] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('cp_tx');
    return saved ? JSON.parse(saved) : [
      { tipo: 'ingreso', desc: 'Venta de productos tech', cat: 'Ventas', monto: 15800, fecha: '2026-03-01' },
      { tipo: 'ingreso', desc: 'Consultoría mensual', cat: 'Servicios', monto: 8500, fecha: '2026-03-05' },
      { tipo: 'egreso', desc: 'Pago de nómina marzo', cat: 'Nómina', monto: 12000, fecha: '2026-03-07' },
      { tipo: 'egreso', desc: 'Renta de oficina', cat: 'Renta', monto: 3500, fecha: '2026-03-08' },
      { tipo: 'ingreso', desc: 'Proyecto cliente ABC', cat: 'Servicios', monto: 22000, fecha: '2026-03-15' },
      { tipo: 'egreso', desc: 'Suministros', cat: 'Suministros', monto: 1200, fecha: '2026-03-16' },
    ];
  });

  const [facturas, setFacturas] = useState<Factura[]>(() => {
    const saved = localStorage.getItem('cp_facturas');
    return saved ? JSON.parse(saved) : [
      { num: 'F-1000', cli: 'Empresa Alfa S.A.', con: 'Consultoría mensual', sub: 18000, iva: 2880, tot: 20880, ven: '2026-04-10', met: 'Transferencia', est: 'pendiente' },
      { num: 'F-1001', cli: 'Comercial Beta', con: 'Diseño y branding', sub: 8500, iva: 1360, tot: 9860, ven: '2026-03-28', met: 'Tarjeta', est: 'cobrada' },
    ];
  });

  const [empleados, setEmpleados] = useState<Empleado[]>(() => {
    const saved = localStorage.getItem('cp_empleados');
    return saved ? JSON.parse(saved) : [
      { nom: 'Ana García', puesto: 'Contadora', depto: 'Administración', sal: 18500, ingreso: '2024-01-15', contrato: 'Indefinido' },
      { nom: 'Luis Martínez', puesto: 'Vendedor Senior', depto: 'Ventas', sal: 12500, ingreso: '2024-06-01', contrato: 'Proyecto' },
      { nom: 'Joel Valera', puesto: 'Director General', depto: 'Dirección', sal: 45000, ingreso: '2023-08-10', contrato: 'Indefinido' },
    ];
  });

  const [activos] = useState<BalanceItem[]>([
    { desc: 'Caja y bancos (Efectivo)', tipo: 'circulante', monto: 45000 },
    { desc: 'Mobiliario y equipo oficina', tipo: 'fijo', monto: 80000 },
    { desc: 'Cuentas por Cobrar Clientes', tipo: 'circulante', monto: 12000 },
  ]);

  const [pasivos] = useState<BalanceItem[]>([
    { desc: 'Proveedores Locales', tipo: 'corto', monto: 15000 },
    { desc: 'Crédito Bancario', tipo: 'largo', monto: 34000 },
    { desc: 'Patrimonio Netos', tipo: 'capital', monto: 88000 },
  ]);

  // Save to localStorage whenever state changes
  useEffect(() => localStorage.setItem('cp_tx', JSON.stringify(tx)), [tx]);
  useEffect(() => localStorage.setItem('cp_facturas', JSON.stringify(facturas)), [facturas]);
  useEffect(() => localStorage.setItem('cp_empleados', JSON.stringify(empleados)), [empleados]);

  // --- ACTIONS ---
  const handleSaveAny = (type: string, data: any) => {
    if (type === 'transaccion') setTx([data, ...tx]);
    if (type === 'factura') setFacturas([data, ...facturas]);
    if (type === 'empleado') setEmpleados([data, ...empleados]);
  };

  const deleteTransaction = (index: number) => {
    setTx(tx.filter((_, i) => i !== index));
  };

  return (
    <div className="main-layout">
      <div className="ambient"></div>
      <div className="grid-bg"></div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="content-area">
        <header style={{ 
          padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(4,8,15,0.7)', backdropFilter: 'blur(24px)',
          position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
          <div>
            <div style={{ fontSize: '24px', fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {activeTab === 'dashboard' ? 'Centro de Mando Corporativo' : `Módulo: ${activeTab.toUpperCase()}`}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>
               CONTAPRO ANALYTICS / {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', marginRight: '16px', borderRight: '1px solid var(--border)', paddingRight: '16px' }}>
               <button style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><Search size={20}/></button>
               <button style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', position: 'relative' }}>
                 <Bell size={20}/>
                 <div style={{ position: 'absolute', top: '0', right: '0', width: '8px', height: '8px', background: 'var(--red)', borderRadius: '50%', border: '2px solid var(--bg)' }}></div>
               </button>
            </div>
            
            <button className="btn-primary" onClick={() => setShowModal(true)} style={{ padding: '12px 24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Plus size={18}/> Crear Registro
            </button>
          </div>
        </header>

        <section style={{ padding: '32px' }}>
          {activeTab === 'dashboard' && <DashboardView tx={tx} facturas={facturas} />}
          {activeTab === 'flujo' && <FlujoView tx={tx} deleteTransaction={deleteTransaction} />}
          {activeTab === 'facturas' && <FacturasView facturas={facturas} />}
          {activeTab === 'resultados' && <ResultadosView tx={tx} />}
          {activeTab === 'balances' && <BalancesView activos={activos} pasivos={pasivos} />}
          {activeTab === 'nomina' && <NominaView empleados={empleados} />}
        </section>
        
        <footer style={{ padding: '40px 32px', textAlign: 'center', borderTop: '1px solid var(--border)', marginTop: '40px' }}>
           <div style={{ color: 'var(--muted)', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14}/> Sincronizado hace 2m</div>
              <span>ContaPro Business Intelligence &copy; 2026</span>
              <span style={{ color: 'var(--gold)' }}>Joel Valera Enterprise</span>
           </div>
        </footer>
      </main>

      <Modal showModal={showModal} setShowModal={setShowModal} onSave={handleSaveAny} />
      <AIPanel showAI={showAI} setShowAI={setShowAI} facturas={facturas} />
    </div>
  );
}

export default App;
