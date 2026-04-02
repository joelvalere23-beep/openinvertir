import React from 'react';

interface Props {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<Props> = ({ icon, label, active, onClick }) => {
  return (
    <div 
      onClick={onClick}
      style={{ 
        padding: '14px 18px', borderRadius: '12px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '14px',
        color: active ? 'var(--gold)' : 'var(--muted)',
        background: active ? 'var(--gold-a)' : 'transparent',
        border: '1px solid', borderColor: active ? 'rgba(201,168,76,0.15)' : 'transparent',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', marginBottom: '6px'
      }}
      className="nav-item-hover"
    >
      <div style={{ opacity: active ? 1 : 0.6 }}>{icon}</div>
      <span style={{ fontSize: '14px', fontWeight: 600 }}>{label}</span>
      {active && <div style={{ marginLeft: 'auto', width: '4px', height: '16px', background: 'var(--gold)', borderRadius: '2px', boxShadow: '0 0 10px var(--gold)' }} />}
    </div>
  );
};

export default NavItem;
