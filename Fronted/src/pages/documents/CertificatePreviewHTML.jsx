import React from 'react';
import { QrCode } from 'lucide-react';
import logoUnivLocal from '../../assets/images/logo_univ.png';
import logoMCSLocal from '../../assets/images/logo_mcs.png';

const COLORS = {
  GREEN: '#006341',
  GOLD: '#A68942',
  BLACK: '#1a1a1b',
  WHITE: '#FFFFFF',
  SLATE: '#64748b'
};

const PremiumVintageCornerHTML = ({ color = "#006341" }) => (
  <svg width="70" height="70" viewBox="0 0 100 100">
    <path d="M0,0 L100,0 C85,5 75,20 70,35 S55,65 30,75 S5,90 0,100 L0,0 Z" fill={color} opacity="0.12" />
    <path d="M2,2 L80,2 C75,10 70,20 60,30 S40,50 30,60 S10,75 2,80 Z" fill={color} />
    <path d="M10,10 L55,10 C50,15 45,25 40,35 S25,50 15,60 Z" fill="#A68942" />
    <circle cx="15" cy="15" r="3" fill="#A68942" />
    <path d="M40,15 C45,20 40,30 30,35 S15,35 10,25" stroke={color} fill="none" strokeWidth="1.5" />
    <path d="M15,40 C20,45 30,40 35,30 S35,15 25,10" stroke={color} fill="none" strokeWidth="1.5" />
    <path d="M60,8 C65,12 60,20 50,25 S30,25 25,20" stroke="#A68942" fill="none" strokeWidth="1" />
  </svg>
);

const CertificatePreviewHTML = ({ data, description, uniqueCode }) => {
  const safeName = (data?.nombre || 'Nombre del Participante').toUpperCase();
  const safeId = data?.cedula || 'XXXXXXXXX';

  let displayDate = '...';
  try {
    if (data?.fecha) {
      const [y, m, d] = data.fecha.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      displayDate = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    } else {
      displayDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  } catch (e) { }

  const renderDescription = () => {
    if (description) return <span>{description} {`Dado en Montería a los ${displayDate}.`}</span>;

    const r = (data?.rol || 'ASISTENTE').toUpperCase();
    const eventName = (data?.nombreEvento || 'CERTIFICADO DE EVENTO').toUpperCase();
    const modal = (data?.modalidad || 'PRESENCIAL').toUpperCase();
    const horas = data?.horas || '20';

    return (
      <span className="italic">
        Por su destacada participación en el evento <strong className="font-bold not-italic text-black">"{eventName}"</strong> realizado bajo la modalidad <strong className="font-bold not-italic text-black">{modal}</strong> en la ciudad de Montería, en calidad de {" "}
        {r === 'PONENTE' || r === 'TALLERISTA'
          ? <span><strong className="font-bold not-italic text-black">{r}</strong>{data?.tituloPonencia || data?.Titulo_Ponencia ? <>: "{data.tituloPonencia || data.Titulo_Ponencia}"</> : <> con una duración de </>}<strong className="font-bold not-italic text-black">{horas} HORAS</strong>.</span>
          : r === 'ORGANIZADOR'
            ? <span><strong className="font-bold not-italic text-black">{r}</strong> colaborando activamente en la gestión, logística y ejecución exitosa del evento.</span>
            : r === 'EVALUADOR'
              ? <span><strong className="font-bold not-italic text-black">{r}</strong> contribuyendo al análisis y evaluación académica del evento.</span>
              : <span><strong className="font-bold not-italic text-black">ASISTENTE</strong> cumpliendo con el total de <strong className="font-bold not-italic text-black">{horas} HORAS</strong>.</span>
        } {`Dado en Montería a los ${displayDate}.`}
      </span>
    );
  };

  return (
    <div className="w-full h-full flex justify-center items-center bg-slate-100 min-h-[500px] p-2">
      <div
        className="bg-white shadow-2xl relative overflow-hidden flex flex-col items-center"
        style={{
          aspectRatio: '297 / 210',
          width: '100%',
          maxWidth: '820px',
          fontFamily: "'Times New Roman', serif"
        }}
      >
        <div className="w-[99%] h-[99%] m-auto border-[1.2px] border-[#006341] p-0.5 flex bg-white">
          <div className="w-full h-full border-[6.5px] border-[#006341] p-0.5 flex bg-white">
            <div className="w-full h-full border-[1.2px] border-[#006341] relative flex flex-col items-center justify-between py-5 px-6 bg-white overflow-hidden">

              <div className="absolute top-[-2px] left-[-2px] scale-90"><PremiumVintageCornerHTML /></div>
              <div className="absolute top-[-2px] right-[-2px] rotate-90 scale-90"><PremiumVintageCornerHTML /></div>
              <div className="absolute bottom-[-2px] left-[-2px] -rotate-90 scale-90"><PremiumVintageCornerHTML /></div>
              <div className="absolute bottom-[-2px] right-[-2px] rotate-180 scale-90"><PremiumVintageCornerHTML /></div>

              <div className="z-30 w-full h-full flex flex-col items-center justify-between">

                <div className="mt-1 flex items-center justify-center gap-12 w-full h-16">
                  <img src={logoUnivLocal} alt="Univ" className="h-full object-contain" />
                  <img src={logoMCSLocal} alt="MCS" className="h-full object-contain" />
                </div>

                <div className="flex flex-col items-center flex-1 justify-center w-full">
                  <h1 className="text-4xl md:text-5xl font-bold tracking-[0.2em] text-[#1a1a1b] uppercase mt-1 mb-0">Certificado</h1>
                  <h2 className="text-[14px] font-bold text-[#006341] tracking-[0.7em] uppercase border-y-[1.5px] border-[#006341] py-1.5 px-12 mt-1 mb-6 font-sans">DE PARTICIPACIÓN</h2>

                  <div className="flex flex-col items-center mb-4">
                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-[0.4em] mb-2">Presentado con orgullo a:</p>
                    <h3 className="text-3xl md:text-4xl font-bold text-[#006341] italic leading-tight text-center max-w-[90%]">{safeName}</h3>
                    <div className="w-[70%] h-[2.5px] bg-[#A68942] mt-3" />
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-2 font-serif">IDENTIFICACIÓN NO. <span className="text-black font-black">{safeId}</span></p>
                  </div>

                  <div className="px-10 w-full min-h-[70px] flex items-center justify-center">
                    <p className="text-[14.5px] leading-relaxed text-slate-800 text-center font-serif">
                      {renderDescription()}
                    </p>
                  </div>
                </div>

                {/* PIE DE PÁGINA SIMPLE SIN QR */}
                <div className="w-full flex justify-between items-end mb-1 mt-4 px-4 overflow-hidden">
                  <div className="w-[32%] flex flex-col items-center">
                    <div className="w-full border-t-[1.2px] border-black mt-12 pt-2">
                      <p className="text-[10px] font-bold text-black uppercase text-center">Dr. Jairo Miguel Torres Oviedo</p>
                      <p className="text-[8px] text-[#64748b] font-medium leading-tight text-center">Rector - Universidad de Córdoba</p>
                    </div>
                  </div>

                  <div className="w-[34%] flex flex-col items-center">
                    <div className="text-center text-[9px] space-y-1">
                      <div>
                        <p className="text-slate-400 uppercase text-[7px] font-bold tracking-wider">No. de Certificado</p>
                        <p className="text-[#006341] font-black text-[10px] leading-none">{uniqueCode || 'XXXXXXXX'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 uppercase text-[7px] font-bold tracking-wider">Fecha de Expedición</p>
                        <p className="text-[#006341] font-black text-[10px] leading-none">{displayDate}</p>
                      </div>
                    </div>
                  </div>

                  <div className="w-[32%] flex flex-col items-center">
                    <div className="w-full border-t-[1.2px] border-black mt-12 pt-2">
                      <p className="text-[10px] font-bold text-black uppercase text-center">Director de Programa</p>
                      <p className="text-[8px] text-[#64748b] font-medium leading-tight text-center">Maestría en Ciencias Sociales</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreviewHTML;