// 1. IMPORTACIONES: Requeridas para construir la tarjeta
import React from 'react';
// Componentes visuales básicos
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
// Paquetes de iconos (Expo incluye estos por defecto)
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
// Nuestra utilidad de matemáticas para el radar
import { obtenerDistancia } from '../utils/geolocalizacion';
// El componente pequeño que creamos para las etiquetas
import Etiqueta from './Etiqueta';

/**
 * COMPONENTE: TarjetaSpot
 * 
 * ¿Qué hace? 
 * Es el contenedor de cada publicación que ves en la lista principal.
 * Se encarga de mostrar quién publicó, qué texto puso, la foto y a qué distancia está.
 */
const TarjetaSpot = ({ item, userLocation }) => {
    // LÓGICA: Calculamos cuántos minutos han pasado desde que se creó el Spot
    const tiempoTranscurrido = Math.round((Date.now() - new Date(item.created_at)) / 60000);

    // LÓGICA: Calculamos la distancia real entre tú y el Spot usando el GPS
    const distancia = Math.round(obtenerDistancia(userLocation?.latitude, userLocation?.longitude, item.lat, item.lng));

    return (
        <View style={styles.tarjeta}>
            {/* PARTE 1: La cabecera (Avatar y nombre de usuario) */}
            <View style={styles.cabeceraTarjeta}>
                <View style={styles.contenedorAvatar}>
                    <FontAwesome5 name="user-alt" size={16} color="#7b2ff7" />
                </View>
                <View style={styles.infoCabecera}>
                    <Text style={styles.nombreUsuario}>@usuario_local</Text>
                    <View style={styles.filaEtiquetas}>
                        {/* Usamos nuestra "Etiqueta" para mostrar la distancia con un color azul */}
                        <Etiqueta texto={`${distancia}m de distancia`} style={styles.etiquetaDistancia} textStyle={{ color: '#2f56f7' }} />
                        <Text style={styles.textoTiempo}>{tiempoTranscurrido < 1 ? 'Justo ahora' : `hace ${tiempoTranscurrido} min`}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.botonMas}>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#9ca3af" />
                </TouchableOpacity>
            </View>

            {/* PARTE 2: El cuerpo (El texto que escribió el usuario) */}
            <Text style={styles.contenidoTarjeta}>{item.content}</Text>

            {/* PARTE 3: La imagen (Solo si el Spot tiene una foto adjunta) */}
            {item.image_url && (
                <Image source={{ uri: item.image_url }} style={styles.imagenTarjeta} resizeMode="cover" />
            )}

            {/* PARTE 4: Acciones (Me gusta, Comentar y Compartir) */}
            <View style={styles.accionesTarjeta}>
                <TouchableOpacity style={styles.itemAccion}>
                    <Ionicons name="heart-outline" size={20} color="#9ca3af" />
                    <Text style={styles.textoAccion}>24 Vibras</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.itemAccion}>
                    <Ionicons name="chatbubble-outline" size={20} color="#9ca3af" />
                    <Text style={styles.textoAccion}>8</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <TouchableOpacity>
                    <Ionicons name="share-social-outline" size={20} color="#9ca3af" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ESTILOS: El maquillaje de la tarjeta (colores oscuros y bordes muy redondeados)
const styles = StyleSheet.create({
    tarjeta: { backgroundColor: '#1a1a24', padding: 16, borderRadius: 24, marginBottom: 15 },
    cabeceraTarjeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    contenedorAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0c0c14', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    infoCabecera: { flex: 1 },
    nombreUsuario: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    filaEtiquetas: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    etiquetaDistancia: { backgroundColor: 'rgba(47, 86, 247, 0.1)' },
    textoTiempo: { color: '#9ca3af', fontSize: 10 },
    contenidoTarjeta: { color: 'white', fontSize: 14, lineHeight: 20, marginBottom: 12 },
    imagenTarjeta: { width: '100%', height: 200, borderRadius: 15, marginBottom: 12 },
    accionesTarjeta: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: '#2d2d3d', paddingTop: 10 },
    itemAccion: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
    textoAccion: { color: '#9ca3af', marginLeft: 5, fontSize: 12 },
    botonMas: { padding: 4 },
});

export default TarjetaSpot;
