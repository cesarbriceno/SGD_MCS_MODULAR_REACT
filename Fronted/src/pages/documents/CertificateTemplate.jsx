import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Registrar fuentes Premium (URLs actualizadas - Google Fonts TTF)
Font.register({
    family: 'Playfair Display',
    src: 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiukDQ.ttf',
    fontWeight: 'bold'
});

Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf', fontWeight: 'normal' },
        { src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf', fontWeight: 'bold' }
    ]
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#fff',
        padding: 40,
        position: 'relative',
    },
    container: {
        flex: 1,
        padding: 20,
        border: '4px solid #16a34a', // green border instead of blue sidebars
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        marginBottom: 20,
        alignItems: 'center',
        flexDirection: 'row',
        gap: 15,
    },
    logo: {
        width: 60,
        height: 60,
        objectFit: 'contain',
    },
    headerText: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    univName: {
        fontFamily: 'Playfair Display',
        fontSize: 22,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#16a34a',
    },
    programName: {
        fontFamily: 'Inter',
        fontSize: 10,
        color: '#718096',
        textTransform: 'uppercase',
        marginTop: 4,
        letterSpacing: 1,
    },
    mainTitle: {
        fontFamily: 'Playfair Display',
        fontSize: 34,
        fontWeight: 'bold',
        color: '#1a202c',
        textTransform: 'uppercase',
        marginVertical: 15,
        textAlign: 'center',
    },
    titleUnderline: {
        width: 350,
        height: 2,
        backgroundColor: '#16a34a',
        marginBottom: 20,
    },
    intro: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#4a5568',
        marginBottom: 5,
    },
    name: {
        fontFamily: 'Playfair Display',
        fontSize: 42,
        fontWeight: 'bold',
        color: '#16a34a',
        marginVertical: 5,
        textAlign: 'center',
    },
    id: {
        fontFamily: 'Inter',
        fontSize: 11,
        fontWeight: 'bold',
        color: '#718096',
        marginBottom: 25,
    },
    bodyContainer: {
        width: '90%',
        paddingHorizontal: 15,
    },
    bodyText: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#2d3748',
        textAlign: 'justify',
        lineHeight: 1.6,
    },
    bold: {
        fontWeight: 'bold',
        color: '#1a202c',
    },
    footerContainer: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    signatureContainer: {
        alignItems: 'center',
        width: 180,
    },
    signLine: {
        width: '100%',
        borderBottom: '1.5pt solid #1a202c',
        marginBottom: 8,
    },
    signTitle: {
        fontFamily: 'Inter',
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#1a202c',
    },
    signSub: {
        fontFamily: 'Inter',
        fontSize: 9,
        color: '#718096',
        marginTop: 2,
    },
    dateContainer: {
        display: 'none', // Removed side date container
    }
});

// Logo Unicordoba en Base64 (SVG simplificado genérico para evitar fallas de red en la librería PDF)
const logoUC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAI+SURBVHhe7ZnLbcMwFETpQhxK40o9Lse1OFIEw0ggCJAi1vKde7C+A4uTPHNGJ/w6p1LrtdZ6r/9Q671v8/D18XPc2jN97SflB8B7b4FvH0y43mJ9D1wT6D98Qd8N9L8c7b8CgDvgZ4PPHwF4N0H9FvTfv8d307/7Ar4DfnboP0Lgvf9X0N8v8F58O8F78U3xXnxDvBffCO/FN8B7cc15L64x78W15b24prwX15L34hryXlwz3otrwnvxrPM+A4D7E+z4HwHAvYh2+o8A4B5CM/6PAOD2pAX+jwDgtqDl/SMAuB1olv8oAK77mep/BQDXXUztvwwArruY0n9ZAFx3MaX/sgC47rJp/1UAcN1l0/6rAOC6nQ3+VwNw3c4G/6sBuG4j+/+vCOAab/b/XxHAte/R/+8I4Np39P87Arieo/7fEcD1vKP/3xXANTyl/18A4HqU/n8BgOtR+v8FAK5H6f+yAON+6v/nAIz7Kf+fAzDup/x/EQDjfsr/FwEw7kf3/4sBGPdR/T8IwLiP6v9BAMZ9VP8PAzDuo/p/GIBxL+1/CACzL+l/CACzL+l/KACzL+l/KACzL+/y/1AABtS/qfCwAA6t9U+FwAANT/VAAAwH9T4n8uAED/TYn/uQAA/Tcl/+cCAPRflvwHAABYlvynAADAWfKfAgAAY0n/gwAAwFjS/yAAADDS9f+DAADARNf/jwAAgLGu/x8CAACjqf//IwDgB/pGv1g50sAFAAAAAElFTkSuQmCC";

const CertificateTemplate = ({ data, templateTitle, description }) => {
    const list = Array.isArray(data) ? data : (data ? [data] : []);

    const getDescriptiveText = (item, safeDate) => {
        const dateText = `Dado en Montería a los ${safeDate}.`;

        if (description) {
            return <Text>{description} {dateText}</Text>;
        }

        const r = (item?.rol || '').toLowerCase();
        const eventName = item?.nombreEvento || item?.Nombre_Evento || 'Evento Académico';

        if (r === 'ponente' || r === 'tallerista') {
            const action = r === 'ponente' ? 'dictando la ponencia' : 'impartiendo el taller';
            return (
                <Text>
                    Por su destacada participación en el evento <Text style={styles.bold}>"{eventName}"</Text> realizado bajo la modalidad presencial en la ciudad de {item?.lugar || 'Montería'}, en calidad de <Text style={styles.bold}>{r.toUpperCase()}</Text> {action}: <Text style={styles.bold}>"{item?.tituloPonencia || item?.Titulo_Ponencia || 'Sin título'}"</Text> con una duración de <Text style={styles.bold}>{item?.horas || item?.Intensidad_Horaria || '20'} horas</Text> académicas. {dateText}
                </Text>
            );
        } else if (r === 'organizador') {
            return (
                <Text>
                    Por su destacada participación en el evento <Text style={styles.bold}>"{eventName}"</Text> realizado bajo la modalidad presencial, en calidad de <Text style={styles.bold}>ORGANIZADOR</Text> colaborando activamente en la gestión, logística y ejecución exitosa del evento. {dateText}
                </Text>
            );
        } else {
            return (
                <Text>
                    Por su destacada participación en el evento <Text style={styles.bold}>"{eventName}"</Text> realizado bajo la modalidad presencial en la ciudad de {item?.lugar || 'Montería'}, en calidad de <Text style={styles.bold}>ASISTENTE</Text> cumpliendo con la intensidad horaria de <Text style={styles.bold}>{item?.horas || item?.Intensidad_Horaria || '20'} horas</Text> y los requisitos académicos establecidos en este programa. {dateText}
                </Text>
            );
        }
    };

    if (list.length === 0) {
        return (
            <Document>
                <Page size="A4" orientation="landscape" style={styles.page}>
                    <View style={styles.container}>
                        <Text style={styles.bodyText}>No hay datos disponibles para generar el certificado.</Text>
                    </View>
                </Page>
            </Document>
        );
    }

    return (
        <Document title={templateTitle || "Certificado"}>
            {list.map((item, index) => {
                const safeName = (item?.nombre || item?.Nombre_Persona || 'Participante').toUpperCase();
                const safeId = item?.cedula || item?.Cedula_Persona || 'XXXXXXXXX';

                let safeDate = 'Fecha pendiente';
                try {
                    const d = item?.fecha ? new Date(item.fecha) : new Date();
                    if (!isNaN(d.getTime())) {
                        safeDate = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                    }
                } catch (e) { console.error(e); }

                return (
                    <Page key={index} size="A4" orientation="landscape" style={styles.page}>
                        <View style={styles.container}>
                            <View style={styles.header}>
                                {/* Using base64 logo avoiding network fetch error in Brave */}
                                <Image src={logoUC} style={styles.logo} />
                                <View style={styles.headerText}>
                                    <Text style={styles.univName}>Universidad de Córdoba</Text>
                                    <Text style={styles.programName}>Maestría en Ciencias Sociales</Text>
                                </View>
                            </View>

                            <Text style={styles.mainTitle}>{templateTitle?.toUpperCase() || 'CERTIFICADO DE EVENTO'}</Text>
                            <View style={styles.titleUnderline} />

                            <Text style={styles.intro}>Se otorga el presente a:</Text>
                            <Text style={styles.name}>{safeName}</Text>
                            <Text style={styles.id}>C.C. {safeId}</Text>

                            <View style={styles.bodyContainer}>
                                <View style={styles.bodyText}>
                                    {getDescriptiveText(item, safeDate)}
                                </View>
                            </View>

                            <View style={styles.footerContainer}>
                                <View style={styles.signatureContainer}>
                                    <View style={styles.signLine} />
                                    <Text style={styles.signTitle}>Dr. Jairo Miguel Torres Oviedo</Text>
                                    <Text style={styles.signSub}>Rector - Universidad de Córdoba</Text>
                                </View>

                                <View style={styles.signatureContainer}>
                                    <View style={styles.signLine} />
                                    <Text style={styles.signTitle}>Director de Programa</Text>
                                    <Text style={styles.signSub}>Maestría en Ciencias Sociales</Text>
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
