// 1. IMPORTACIONES: Traemos las herramientas básicas de React y React Native
import React from 'react';
// View es como un "div", Text es para párrafos, y StyleSheet para los estilos (el CSS de la app)
import { View, Text, StyleSheet } from 'react-native';

/**
 * COMPONENTE ATÓMICO: Etiqueta
 * 
 * ¿Qué hace? 
 * Crea un pequeño recuadro con texto resaltado. Se usa para la distancia en el feed 
 * o el estado de verificación en el perfil.
 * 
 * @param {string} texto - Es el mensaje que aparecerá dentro (ej: "500m")
 * @param {object} style - Permite pasar colores o márgenes extras al recuadro desde fuera
 * @param {object} textStyle - Permite cambiar el color o tamaño del texto desde fuera
 */
const Etiqueta = ({ texto, style, textStyle }) => (
    // Combinamos los estilos base (styles.contenedor) con los que lleguen por prop (style)
    <View style={[styles.contenedor, style]}>
        <Text style={[styles.textoEtiqueta, textStyle]}>{texto}</Text>
    </View>
);

// HOJA DE ESTILOS: Aquí definimos la "guapura" del componente
const styles = StyleSheet.create({
    contenedor: {
        paddingHorizontal: 7, // Aire a los lados del texto
        paddingVertical: 2,   // Aire arriba y abajo
        borderRadius: 6,      // Curvatura de las esquinas
        marginRight: 6        // Espacio con el siguiente elemento
    },
    // Estilo de la fuente: pequeña y en negrita para que parezca una "placa" informativa
    textoEtiqueta: {
        fontSize: 10,
        fontWeight: 'bold'
    },
});

export default Etiqueta;
