import React from 'react';

const globalStyles = `
  /* 1. FONDO BASE DINÁMICO */
  body, #root {
    transition: background-color 0.5s ease, color 0.5s ease;
    margin: 0;
    min-height: 100vh;
  }

  /* MODO CLARO (Por defecto) */
  body {
    background-color: #f8fafc;
    color: #334155;
  }

  /* MODO OSCURO (Activado con clase .dark) */
  .dark body {
    background-color: #0f172a;
    color: #f1f5f9;
  }

  /* 2. ORBES DE LUZ */
  .orb-canvas {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    z-index: -50; pointer-events: none; overflow: hidden;
  }

  .orb {
    position: absolute; border-radius: 50%;
    filter: blur(80px); opacity: 0.6;
    animation: float-orb 15s ease-in-out infinite alternate;
    transition: background 0.5s ease;
  }

  /* Orbe 1 (Arriba Izquierda) */
  .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(59,130,246,0.5) 0%, rgba(0,0,0,0) 70%); }
  .dark .orb-1 { background: radial-gradient(circle, rgba(37,99,235,0.3) 0%, rgba(0,0,0,0) 70%); }

  /* Orbe 2 (Abajo Derecha) */
  .orb-2 { bottom: -10%; right: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(139,92,246,0.5) 0%, rgba(0,0,0,0) 70%); animation-delay: -5s; }
  .dark .orb-2 { background: radial-gradient(circle, rgba(124,58,237,0.3) 0%, rgba(0,0,0,0) 70%); }

  @keyframes float-orb {
    0% { transform: translate(0, 0) scale(1); }
    100% { transform: translate(30px, -30px) scale(1.1); }
  }

  /* 3. ANIMACIONES DE ICONOS (MICRO-INTERACCIONES) */
  @keyframes icon-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  @keyframes icon-shake { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-10deg); } 75% { transform: rotate(10deg); } }
  @keyframes icon-pulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
  
  .icon-hover-bounce:hover { animation: icon-bounce 0.5s ease-in-out; color: #60a5fa; }
  .icon-hover-shake:hover { animation: icon-shake 0.4s ease-in-out; color: #a78bfa; }
  .icon-hover-pulse:hover { animation: icon-pulse 0.4s ease-in-out; color: #34d399; }

  /* 4. CLASES GLASS COMPARTIDAS (Premium) */
  .glass-panel-premium {
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.65);
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.1);
    border-radius: 2rem;
  }
  
  .dark .glass-panel-premium {
    background: rgba(15, 23, 42, 0.4); 
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  }

  /* 5. INPUTS GLASS PREMIUM (Para Formularios) */
  .premium-input {
    background: rgba(255, 255, 255, 0.3); border: 1px solid rgba(0, 0, 0, 0.1); color: #1e293b; 
    transition: all 0.2s;
  }
  .dark .premium-input {
    background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); color: #f1f5f9;
  }
  .premium-input:focus {
    background: rgba(255, 255, 255, 0.8); border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }
  .dark .premium-input:focus {
    background: rgba(0, 0, 0, 0.6); border-color: #818cf8;
  }
  
  /* 6. DROPDOWN FLOTANTE GLASS */
  .glass-dropdown {
    background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.5); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  }
  .dark .glass-dropdown {
    background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
  }
`;

const GlobalBackground = () => (
  <>
    <style>{globalStyles}</style>
    <div className="orb-canvas">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
    </div>
  </>
);

export default GlobalBackground;