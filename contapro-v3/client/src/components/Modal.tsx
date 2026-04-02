import React, { useState } from 'react';
import { X, Plus, Receipt, UserPlus, TrendingUp } from 'lucide-react';

interface Props {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  onSave: (type: string, data: any) => void;
}

const Modal: React.FC<Props> = ({ showModal, setShowModal, onSave }) => {
  const [modalTab, setModalTab] = useState('transaccion');
  const [formData, setFormData] = useState<any>({
    mDesc: '',
    mMonto: '',
    mTipo: 'ingreso',
    fCli: '',
    fCon: '',
    fTot: '',
    eNom: '',
    ePuesto: '',
    eSal: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSave = () => {
    if (modalTab === 'transaccion') {
      if (formData.mDesc && formData.mMonto) {
        onSave('transaccion', {
          tipo: formData.mTipo,
          desc: formData.mDesc,
          monto: parseFloat(formData.mMonto),
          cat: 'Manual',
          fecha: new Date().toISOString().split('T')[0]
        });
        setShowModal(false);
      }
    } else if (modalTab === 'factura') {
       if (formData.fCli && formData.fTot) {
         onSave('factura', {
           num: `F-${Math.floor(Math.random()*9000)+1000}`,
           cli: formData.fCli,
           con: formData.fCon || 'Servicios Profesionales',
           sub: parseFloat(formData.fTot) * 0.82,
           iva: parseFloat(formData.fTot) * 0.18,
           tot: parseFloat(formData.fTot),
           ven: '2026-04-30',
           met: 'Pospago',
           est: 'pendiente'
         });
         setShowModal(false);
       }
    } else if (modalTab === 'empleado') {
       if (formData.eNom && formData.eSal) {
         onSave('empleado', {
           nom: formData.eNom,
           puesto: formData.ePuesto,
           depto: 'Administración',
           sal: parseFloat(formData.eSal),
           ingreso: new Date().toISOString().split('T')[0],
           contrato: 'Indefinido'
         });
         setShowModal(false);
       }
    }
  };

  if (!showModal) return null;

  return (
    <div className="modal-overlay animate-in" onClick={() => setShowModal(false)} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '24px',
        width: '520px', padding: '0', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.8)'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontSize: '24px' }}>Registrar Nueva Entrada</div>
          <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><X size={24}/></button>
        </div>
        
        <div style={{ padding: '30px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg3)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            {['transaccion', 'factura', 'empleado'].map(t => (
              <button key={t} onClick={() => setModalTab(t)} style={{ 
                flex: 1,
                background: modalTab === t ? 'var(--gold)' : 'transparent',
                color: modalTab === t ? '#000' : 'var(--muted)',
                border: 'none', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
                {t === 'transaccion' && <TrendingUp size={14}/>}
                {t === 'factura' && <Receipt size={14}/>}
                {t === 'empleado' && <UserPlus size={14}/>}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {modalTab === 'transaccion' && (
              <>
                <input className="modal-input" placeholder="Descripción de la operación" id="mDesc" onChange={handleChange} value={formData.mDesc} />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input className="modal-input" type="number" placeholder="Monto (USD)" id="mMonto" style={{ flex: 1 }} onChange={handleChange} value={formData.mMonto} />
                  <select className="modal-input" id="mTipo" style={{ width: '130px' }} onChange={handleChange} value={formData.mTipo}>
                    <option value="ingreso">Ingresos (+)</option>
                    <option value="egreso">Egresos (-)</option>
                  </select>
                </div>
              </>
            )}

            {modalTab === 'factura' && (
              <>
                <input className="modal-input" placeholder="Nombre del Cliente" id="fCli" onChange={handleChange} value={formData.fCli} />
                <input className="modal-input" placeholder="Concepto (ej. Auditoría Trimestral)" id="fCon" onChange={handleChange} value={formData.fCon} />
                <input className="modal-input" type="number" placeholder="Importe Total" id="fTot" onChange={handleChange} value={formData.fTot} />
              </>
            )}

            {modalTab === 'empleado' && (
              <>
                <input className="modal-input" placeholder="Nombre Completo" id="eNom" onChange={handleChange} value={formData.eNom} />
                <input className="modal-input" placeholder="Puesto / Cargo" id="ePuesto" onChange={handleChange} value={formData.ePuesto} />
                <input className="modal-input" type="number" placeholder="Salario Mensual" id="eSal" onChange={handleChange} value={formData.eSal} />
              </>
            )}

            <button 
              className="btn-primary" 
              style={{ marginTop: '20px', width: '100%', height: '48px', background: 'linear-gradient(to right, var(--gold), #8a6e2f)', color: '#000', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 24px var(--gold-glow)' }}
              onClick={handleSave}
            >
              Confirmar Registro ◈
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
