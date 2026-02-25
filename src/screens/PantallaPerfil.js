// 1. IMPORTACIONES: Herramientas para la vista de usuario
import React from 'react';
// Componentes de diseño
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// Iconos: Ionicons para flechas/ajustes y FontAwesome para el monigote del avatar
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
// Nuestra etiqueta personalizada para el estado "Verificado"
import Etiqueta from '../components/Etiqueta';

/**
 * PANTALLA: PantallaPerfil
 * 
 * ¿Qué hace? 
 * Muestra quién está logueado y da la opción de salir (Cerrar sesión).
 */
const PantallaPerfil = ({ usuario, alCerrarSesion }) => {
    return (
        <View style={styles.contenedorPerfil}>
            {/* PARTE 1: La tarjeta de presentación del usuario */}
            <View style={styles.cabeceraPerfil}>
                <View style={styles.avatarPerfilGrande}>
                    <FontAwesome5 name="user-alt" size={40} color="#7b2ff7" />
                </View>
                <Text style={styles.emailPerfil}>{usuario?.email}</Text>
                {/* Usamos el componente Etiqueta con un fondo morado fuerte */}
                <Etiqueta texto="Miembro de Spot Verificado" style={styles.etiquetaVerificada} textStyle={{ color: 'white' }} />
            </View>

            {/* PARTE 2: Menú de opciones */}
            <View style={{ marginTop: 40, width: '100%' }}>
                <TouchableOpacity style={styles.filaAccionPerfil}>
                    <Ionicons name="settings-outline" size={24} color="white" />
                    <Text style={styles.textoAccionPerfil}>Configuración</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                {/* BOTÓN DE SALIDA: Ejecuta la función que limpia la sesión en Supabase */}
                <TouchableOpacity style={[styles.filaAccionPerfil, { borderBottomWidth: 0 }]} onPress={alCerrarSesion}>
                    <Ionicons name="log-out-outline" size={24} color="#ff4444" />
                    <Text style={[styles.textoAccionPerfil, { color: '#ff4444' }]}>Cerrar sesión</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ESTILOS: Simples y limpios para no distraer de la información del usuario
const styles = StyleSheet.create({
    contenedorPerfil: { flex: 1, padding: 30, alignItems: 'center' },
    cabeceraPerfil: { alignItems: 'center', marginBottom: 30 },
    avatarPerfilGrande: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1a1a24', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    emailPerfil: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    etiquetaVerificada: { backgroundColor: '#7b2ff7', paddingHorizontal: 15, paddingVertical: 4 },
    filaAccionPerfil: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#2d2d3d' },
    textoAccionPerfil: { flex: 1, color: 'white', fontSize: 16, marginLeft: 15 },
});

export default PantallaPerfil;
