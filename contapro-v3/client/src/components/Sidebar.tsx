import React from 'react';
import { LayoutGrid, ArrowUpRight, Receipt, BarChart3, PieChart, Users } from 'lucide-react';
import NavItem from './ui/NavItem';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="sidebar">
      <div style={{ padding: '32px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ 
          fontSize: '22px', fontWeight: 800, color: 'var(--text)', 
          display: 'flex', alignItems: 'center', gap: '12px' 
        }}>
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '10px', 
            background: 'linear-gradient(135deg, var(--gold), #8a6e2f)',
            boxShadow: '0 4px 16px var(--gold-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#000', fontSize: '20px'
          }}>◈</div>
          <span style={{ letterSpacing: '-0.5px' }}>Conta<span style={{color: 'var(--gold)'}}>Pro</span></span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '3px', marginTop: '6px', fontWeight: 700 }}>SYSTEM V3.0</div>
      </div>

      <nav style={{ padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <NavItem icon={<LayoutGrid size={18}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavItem icon={<ArrowUpRight size={18}/>} label="Flujo de Caja" active={activeTab === 'flujo'} onClick={() => setActiveTab('flujo')} />
        <NavItem icon={<Receipt size={18}/>} label="Facturación" active={activeTab === 'facturas'} onClick={() => setActiveTab('facturas')} />
        <NavItem icon={<BarChart3 size={18}/>} label="Resultados" active={activeTab === 'resultados'} onClick={() => setActiveTab('resultados')} />
        <NavItem icon={<PieChart size={18}/>} label="Balances" active={activeTab === 'balances'} onClick={() => setActiveTab('balances')} />
        <NavItem icon={<Users size={18}/>} label="Nómina" active={activeTab === 'nomina'} onClick={() => setActiveTab('nomina')} />
      </nav>

      <div style={{ marginTop: 'auto', padding: '24px' }}>
        <div className="panel" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--gold-a)', border: '1px solid var(--border)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#000' }}>JV</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Joel Valera</div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>CFO & Admin</div>
          </div>
          <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 10px var(--green)' }} />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
