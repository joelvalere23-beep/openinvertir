import React from 'react';

interface Props {
  label: string;
  value: string;
  color: string;
}

const CategoryItem: React.FC<Props> = ({ label, value, color }) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
        <span style={{ color: 'var(--muted)' }}>{label}</span>
        <span style={{ fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: '4px', background: 'var(--bg3)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: value, background: color || 'var(--gold)', borderRadius: '2px' }} />
      </div>
    </div>
  );
};

export default CategoryItem;
