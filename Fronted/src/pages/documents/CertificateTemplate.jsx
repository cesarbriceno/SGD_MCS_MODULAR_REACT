import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Svg, Path, Circle, Font } from '@react-pdf/renderer';
import logoUnivLocal from '../../assets/images/logo_univ.png';
import logoMCSLocal from '../../assets/images/logo_mcs.png';

const COLORS = {
  GREEN: '#006341',
  GOLD: '#A68942',
  BLACK: '#1a1a1b',
  WHITE: '#FFFFFF',
  SLATE: '#64748b'
};

// --- REGISTRO DE FUENTES NATIVAS PARA RESOLUCIÓN DE ESTILOS ANIDADOS ---
// Esto soluciona el error "Could not resolve font for Times-Bold, fontStyle italic"
Font.register({
  family: 'Times-New-Roman',
  fonts: [
    { src: 'Times-Roman' },
    { src: 'Times-Bold', fontWeight: 'bold' },
    { src: 'Times-Italic', fontStyle: 'italic' },
    { src: 'Times-BoldItalic', fontWeight: 'bold', fontStyle: 'italic' },
  ]
});

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.WHITE,
    padding: 0,
    position: 'relative',
    fontFamily: 'Times-New-Roman', // Familia base para toda la página
  },

  // --- MARCO TRIPLE ---
  outerBorder: {
    width: '99%',
    height: '99%',
    margin: 'auto',
    border: '1.2pt solid #006341',
    padding: 3,
  },
  midBorder: {
    width: '100%',
    height: '100%',
    border: '6pt solid #006341',
    padding: 3,
  },
  innerBorder: {
    width: '100%',
    height: '100%',
    border: '1.2pt solid #006341',
    position: 'relative',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 15,
    paddingVertical: 15,
    alignItems: 'center',
  },

  cornerSvg: {
    position: 'absolute',
    width: 70,
    height: 70,
    zIndex: 5,
  },
  topLeft: { top: -2, left: -2 },
  topRight: { top: -2, right: -2, transform: 'scaleX(-1)' },
  bottomLeft: { bottom: -2, left: -2, transform: 'scaleY(-1)' },
  bottomRight: { bottom: -2, right: -2, transform: 'scale(-1)' },

  container: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  logoSection: {
    width: '100%',
    height: 65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginTop: 5,
  },
  logo: {
    width: 175,
    height: '100%',
    objectFit: 'contain',
  },
  logoMCS: {
    width: 105,
    height: '100%',
    objectFit: 'contain',
  },

  headerContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  headerTitle: {
    fontWeight: 'bold', // Usa la familia registrada
    fontSize: 48,
    color: COLORS.BLACK,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: 'bold', // Usa la familia registrada
    color: COLORS.GREEN,
    letterSpacing: 7,
    textTransform: 'uppercase',
    marginTop: 2,
    borderTop: '1.4pt solid #006341',
    borderBottom: '1.4pt solid #006341',
    paddingVertical: 4,
    paddingHorizontal: 40,
  },

  participantSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    marginTop: 10,
  },
  presentedTo: {
    fontSize: 10,
    color: COLORS.SLATE,
    textTransform: 'uppercase',
    letterSpacing: 5,
    marginBottom: 6,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: COLORS.GREEN,
    textAlign: 'center',
    marginBottom: 3,
  },
  nameLine: {
    width: '70%',
    height: 2.2,
    backgroundColor: COLORS.GOLD,
    marginBottom: 8,
  },
  idText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.SLATE,
  },

  bodyText: {
    fontSize: 12.5,
    color: COLORS.BLACK,
    textAlign: 'center',
    lineHeight: 1.6,
    paddingHorizontal: 35,
    marginTop: 15,
    marginBottom: 5,
  },
  bold: { fontWeight: 'bold', color: '#000' }, // Solo fontWeight para permitir herencia
  italic: { fontStyle: 'italic' },

  footerContainer: {
    flexDirection: 'row',
    width: '98%',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },

  signatureColumn: {
    width: '32%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTop: '1.2pt solid #000',
    marginTop: 40,
    paddingTop: 8,
    alignItems: 'center',
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    textTransform: 'uppercase',
  },
  signatureTitle: {
    fontSize: 8.5,
    color: COLORS.SLATE,
    marginTop: 3,
  },

  centerColumn: {
    width: '34%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaBlock: {
    alignItems: 'center',
    marginBottom: 5,
  },
  metaLabel: {
    fontSize: 7,
    color: COLORS.SLATE,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  metaValue: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: COLORS.GREEN,
    marginBottom: 3,
  }
});

const PremiumVintageCorner = ({ color = "#006341" }) => (
  <Svg width="70" height="70" viewBox="0 0 100 100">
    <Path d="M0,0 L100,0 C85,5 75,20 70,35 S55,65 30,75 S5,90 0,100 L0,0 Z" fill={color} opacity={0.12} />
    <Path d="M2,2 L80,2 C75,10 70,20 60,30 S40,50 30,60 S10,75 2,80 Z" fill={color} />
    <Path d="M10,10 L55,10 C50,15 45,25 40,35 S25,50 15,60 Z" fill="#A68942" />
    <Circle cx="15" cy="15" r="3" fill="#A68942" />
    <Path d="M40,15 C45,20 40,30 30,35 S15,35 10,25" stroke={color} fill="none" strokeWidth="1.5" />
    <Path d="M15,40 C20,45 30,40 35,30 S35,15 25,10" stroke={color} fill="none" strokeWidth="1.5" />
    <Path d="M60,8 C65,12 60,20 50,25 S30,25 25,20" stroke="#A68942" fill="none" strokeWidth="1" />
  </Svg>
);

const CertificateTemplate = ({ data, templateTitle, description, uniqueCode }) => {
  const list = Array.isArray(data) ? data : (data ? [data] : []);

  const getDescriptiveText = (item, safeDate) => {
    const dateText = `Dado en Montería a los ${safeDate}.`;
    if (description) return <Text style={styles.italic}>{description} {dateText}</Text>;

    const r = (item?.rol || 'ASISTENTE').toUpperCase();
    const eventName = (item?.nombreEvento || item?.Nombre_Evento || 'EVENTO').toUpperCase();
    const modal = (item?.modalidad || item?.Modalidad || 'PRESENCIAL').toUpperCase();

    let fechasStr = '';
    const fIni = item?.fechaInicio || item?.Fecha_Inicio;
    const fFin = item?.fechaFin || item?.Fecha_Fin;
    if (fIni && fFin) fechasStr = ` del ${fIni} al ${fFin}`;

    return (
      <Text style={styles.italic}>
        Por su destacada participación en el evento <Text style={styles.bold}>"{eventName}"</Text> realizado{fechasStr} bajo la modalidad <Text style={styles.bold}>{modal}</Text> en la ciudad de Montería, en calidad de {" "}
        {r === 'PONENTE' || r === 'TALLERISTA'
          ? <><Text style={styles.bold}>{r}</Text>{item?.tituloPonencia || item?.Titulo_Ponencia ? <>: "{item.tituloPonencia || item.Titulo_Ponencia}"</> : <> con una duración de </>}<Text style={styles.bold}>{item?.horas || '20'} HORAS</Text>.</>
          : r === 'ORGANIZADOR'
            ? <><Text style={styles.bold}>{r}</Text> colaborando activamente en la gestión, logística y ejecución exitosa del evento.</>
            : r === 'EVALUADOR'
              ? <><Text style={styles.bold}>{r}</Text> contribuyendo al análisis y evaluación académica del evento.</>
              : <><Text style={styles.bold}>ASISTENTE</Text> cumpliendo con el total de <Text style={styles.bold}>{item?.horas || '20'} HORAS</Text>.</>
        } {dateText}
      </Text>
    );
  };

  return (
    <Document title={data?.nombreEvento || templateTitle || "Certificado Oficial"}>
      {list.map((item, index) => {
        const safeName = (item?.nombre || item?.Nombre_Persona || 'Participante').toUpperCase();
        const safeId = item?.cedula || item?.Cedula_Persona || 'XXXXXXXXX';

        let safeDate = '...';
        try {
          const dateStr = item?.fecha || item?.Fecha;
          if (dateStr) {
            const [y, m, d] = dateStr.split('-').map(Number);
            safeDate = new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
          } else {
            safeDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
          }
        } catch (e) { }

        return (
          <Page key={index} size="A4" orientation="landscape" style={styles.page} wrap={false}>
            <View style={styles.outerBorder}>
              <View style={styles.midBorder}>
                <View style={styles.innerBorder}>

                  <View style={[styles.cornerSvg, styles.topLeft]}><PremiumVintageCorner /></View>
                  <View style={[styles.cornerSvg, styles.topRight]}><PremiumVintageCorner /></View>
                  <View style={[styles.cornerSvg, styles.bottomRight]}><PremiumVintageCorner /></View>
                  <View style={[styles.cornerSvg, styles.bottomLeft]}><PremiumVintageCorner /></View>

                  <View style={styles.container}>
                    <View style={styles.logoSection}>
                      <Image src={logoUnivLocal} style={styles.logo} />
                      <Image src={logoMCSLocal} style={styles.logoMCS} />
                    </View>

                    <View style={styles.headerContainer}>
                      <Text style={styles.headerTitle}>Certificado</Text>
                      <Text style={styles.headerSubtitle}>De Participación</Text>
                    </View>

                    <View style={styles.participantSection}>
                      <Text style={styles.presentedTo}>Presentado con orgullo a</Text>
                      <Text style={styles.name}>{safeName}</Text>
                      <View style={styles.nameLine} />
                      <Text style={styles.idText}>IDENTIFICACIÓN No. {safeId}</Text>
                    </View>

                    <View style={styles.bodyText}>
                      {getDescriptiveText(item, safeDate)}
                    </View>

                    <View style={styles.footerContainer}>
                      <View style={styles.signatureColumn}>
                        <View style={styles.signatureLine}>
                          <Text style={styles.signatureName}>Dr. Jairo Miguel Torres Oviedo</Text>
                          <Text style={styles.signatureTitle}>Rector - Universidad de Córdoba</Text>
                        </View>
                      </View>

                      <View style={styles.centerColumn}>
                        <View style={styles.metaBlock}>
                          <Text style={styles.metaLabel}>No. de Certificado</Text>
                          <Text style={styles.metaValue}>{uniqueCode || 'XXXXXXXX'}</Text>
                          <Text style={styles.metaLabel}>Fecha de Expedición</Text>
                          <Text style={styles.metaValue}>{safeDate}</Text>
                        </View>
                      </View>

                      <View style={styles.signatureColumn}>
                        <View style={styles.signatureLine}>
                          <Text style={styles.signatureName}>Director de Programa</Text>
                          <Text style={styles.signatureTitle}>Maestría en Ciencias Sociales</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

export default CertificateTemplate;