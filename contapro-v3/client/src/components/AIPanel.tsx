import React, { useState } from 'react';
import { X, BrainCircuit, MessageSquare, Sparkles } from 'lucide-react';
import { Factura } from '../types';

interface Props {
  showAI: boolean;
  setShowAI: (show: boolean) => void;
  facturas: Factura[];
}

const AIPanel: React.FC<Props> = ({ showAI, setShowAI, facturas }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: '¡Hola Joel! Soy tu analista ContaPro. He detectado un aumento del 12% en ingresos este mes. ¿Quieres que analicemos los detalles?' }
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages([...messages, userMsg]);
    setInput('');
    
    // Simple mock response logic
    setTimeout(() => {
      let aiResponse = 'Interesante. Mis algoritmos sugieren que mantengas un fondo de reserva para el próximo trimestre.';
      if (input.toLowerCase().includes('factura')) {
        const pend = facturas.filter(f => f.est === 'pendiente').length;
        aiResponse = `Actualmente tienes ${pend} facturas pendientes por cobrar. Te recomiendo enviar recordatorios de pago.`;
      }
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    }, 800);
  };

  if (!showAI) return (
    <button 
      style={{
        position: 'fixed', bottom: '28px', right: '28px',
        width: '64px', height: '64px', borderRadius: '32px',
        background: 'linear-gradient(135deg, var(--gold), var(--gold2))',
        color: '#000', cursor: 'pointer', border: 'none',
        boxShadow: '0 12px 40px var(--gold-glow)', zIndex: 200,
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      className="ai-btn-hover"
      onClick={() => setShowAI(true)}
    >
      <BrainCircuit size={32} />
    </button>
  );

  return (
    <div className="ai-panel show" style={{
      position: 'fixed', bottom: '110px', right: '28px',
      width: '380px', height: '520px', background: 'var(--bg2)',
      border: '1px solid var(--border)', borderRadius: '24px',
      zIndex: 199, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      boxShadow: '0 40px 100px rgba(0,0,0,0.7)', 
      animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{ padding: '20px', background: 'var(--gold-a)', borderBottom: '1px solid var(--border)', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', background: 'var(--green)', borderRadius: '50%', boxShadow: '0 0 12px var(--green)' }}></div>
            <span style={{ fontSize: '15px' }}>ContaPro AI Analyst ◈</span>
         </div>
         <button onClick={() => setShowAI(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', opacity: 0.6 }}><X size={20}/></button>
      </div>
      
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ 
            padding: '12px 16px', 
            borderRadius: m.role === 'ai' ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
            background: m.role === 'ai' ? 'var(--bg3)' : 'var(--gold-a)',
            color: m.role === 'ai' ? 'var(--text)' : 'var(--gold)',
            maxWidth: '85%',
            alignSelf: m.role === 'ai' ? 'flex-start' : 'flex-end',
            fontSize: '13px',
            lineHeight: '1.5',
            border: m.role === 'ai' ? '1px solid var(--border)' : '1px solid var(--gold-a)',
            position: 'relative'
          }}>
            {m.role === 'ai' && <Sparkles size={12} style={{ position: 'absolute', top: '-10px', left: '0', color: 'var(--gold)' }} />}
            {m.text}
          </div>
        ))}
      </div>

      <div style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', background: 'var(--bg3)' }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Analizar estado financiero..." 
          style={{ 
            flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', 
            padding: '10px 14px', color: '#fff', outline: 'none', fontSize: '14px', borderRadius: '10px'
          }} 
        />
        <button 
          onClick={handleSend}
          style={{ 
            background: 'var(--gold)', border: 'none', borderRadius: '10px', 
            width: '42px', height: '42px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' 
          }}
        >
          <MessageSquare size={18} />
        </button>
      </div>
    </div>
  );
};

export default AIPanel;
