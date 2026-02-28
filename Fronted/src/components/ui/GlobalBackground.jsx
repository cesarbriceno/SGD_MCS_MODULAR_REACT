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
    background-color: #f1f5f9; /* Slate 100 */
    color: #334155;
  }

  /* MODO OSCURO (Activado con clase .dark) */
  .dark body {
    background-color: #021027; /* Tu azul profundo */
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
  .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(96,165,250,0.4) 0%, rgba(0,0,0,0) 70%); }
  .dark .orb-1 { background: radial-gradient(circle, rgba(6,182,212,0.5) 0%, rgba(0,0,0,0) 70%); } /* Cian en dark */

  /* Orbe 2 (Abajo Derecha) */
  .orb-2 { bottom: -10%; right: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(167,139,250,0.4) 0%, rgba(0,0,0,0) 70%); animation-delay: -5s; }
  .dark .orb-2 { background: radial-gradient(circle, rgba(124,58,237,0.5) 0%, rgba(0,0,0,0) 70%); } /* Violeta en dark */

  /* Orbe 3 (Centro) */
  .orb-3 { top: 40%; left: 30%; width: 40vw; height: 40vw; background: radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(0,0,0,0) 70%); opacity: 0.4; }
  .dark .orb-3 { background: radial-gradient(circle, rgba(37,99,235,0.3) 0%, rgba(0,0,0,0) 70%); }

  @keyframes float-orb {
    0% { transform: translate(0, 0) scale(1); }
    100% { transform: translate(30px, -30px) scale(1.1); }
  }

  /* 3. CLASES GLASS COMPARTIDAS (Premium) */
  .glass-panel {
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.65);
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.1);
  }
  
  .dark .glass-panel {
    background: rgba(10, 25, 47, 0.7); /* Oscuro tintado */
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
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