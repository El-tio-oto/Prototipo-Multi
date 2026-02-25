// 1. IMPORTACIONES: Herramientas para la pantalla de Login y Registro
import React, { useState } from 'react';
// Herramientas de interfaz y comportamiento (teclado, alertas, scroll)
import {
    StyleSheet,
    View,
    Text,
    ActivityIndicator, // El circulito de carga
    TextInput,         // El cuadro donde escribes
    TouchableOpacity,  // Un botón que brilla al tocarlo
    KeyboardAvoidingView, // Evita que el teclado tape el botón
    Platform,          // Para saber si es iPhone o Android
    Alert,             // Ventanitas de error
    ScrollView,        // Permite bajar y subir si el contenido es largo
    SafeAreaView,      // Evita los bordes/notch del teléfono
    Keyboard           // Para cerrar el teclado por código
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Nuestra conexión directa con el servidor de Supabase
import { supabase } from '../lib/supabase';

/**
 * PANTALLA: PantallaAutenticacion
 * 
 * ¿Qué hace? 
 * Es la puerta de entrada. Maneja si el usuario quiere ENTRAR o REGISTRARSE.
 * No cambia de pantalla aquí mismo, sino que avisa a App.js cuando hay éxito.
 */
const PantallaAutenticacion = ({ onAuthSuccess }) => {
    // ESTADOS: Pequeños interruptores y memorias de la pantalla
    const [esLogin, setEsLogin] = useState(true); // true = Login, false = Registro
    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [cargando, setCargando] = useState(false); // Bloquea el botón mientras procesa

    // LÓGICA: Se dispara al pulsar el botón principal
    const manejarAutenticacion = async () => {
        // Validaciones básicas antes de molestar al servidor
        if (cargando) return;
        if (!correo || !contrasena) return Alert.alert('Error', 'Completa todos los campos');

        Keyboard.dismiss(); // Escondemos el teclado para que el usuario vea la carga
        setCargando(true);

        try {
            // Decidimos qué función llamar de Supabase según el modo
            const { error } = esLogin
                ? await supabase.auth.signInWithPassword({ email: correo.trim(), password: contrasena.trim() })
                : await supabase.auth.signUp({ email: correo.trim(), password: contrasena.trim() });

            if (error) {
                setCargando(false);
                // Traducimos los mensajes técnicos a algo que una persona entienda
                let mensajeUsuario = error.message;
                if (error.message === 'Invalid login credentials') {
                    mensajeUsuario = 'Correo o contraseña incorrectos.';
                } else if (error.message === 'Email not confirmed') {
                    mensajeUsuario = 'Debes confirmar tu correo antes de entrar.';
                }
                Alert.alert('Error', mensajeUsuario);
            }
        } catch (err) {
            setCargando(false);
            Alert.alert('Error Inesperado', 'Problema de conexión al servidor.');
        }
    };

    return (
        <SafeAreaView style={styles.contenedorPantalla}>
            {/* Ajusta la altura cuando sale el teclado para no tapar los campos */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 40}
            >
                <ScrollView contentContainerStyle={styles.contenidoScroll}>
                    {/* PARTE 1: La marca y el logo de Spot */}
                    <View style={styles.filaLogo}>
                        <View style={[styles.iconoLogo, { width: 60, height: 60, borderRadius: 20 }]}>
                            <Ionicons name="location" size={30} color="white" />
                        </View>
                        <View style={{ marginLeft: 15 }}>
                            <Text style={[styles.textoLogo, { fontSize: 32 }]}>Spot</Text>
                            <Text style={[styles.subtextoUbicacion, { fontSize: 14 }]}>CERCA DE TI</Text>
                        </View>
                    </View>

                    {/* PARTE 2: Bienvenida dinámica */}
                    <Text style={styles.tituloAuth}>{esLogin ? 'Hola de nuevo' : 'Únete a Spot'}</Text>
                    <Text style={styles.subtituloAuth}>
                        {esLogin ? 'Inicia sesión para ver qué pasa a tu alrededor.' : 'Crea una cuenta para compartir tus vibras.'}
                    </Text>

                    {/* PARTE 3: Cuadros de texto para escribir */}
                    <View style={styles.formularioAuth}>
                        <TextInput
                            style={styles.inputAuth}
                            placeholder="Correo electrónico"
                            placeholderTextColor="#9ca3af"
                            value={correo}
                            onChangeText={setCorreo}
                            autoCapitalize="none" // Evita que ponga la primera en mayúscula por error
                            keyboardType="email-address"
                        />
                        <TextInput
                            style={styles.inputAuth}
                            placeholder="Contraseña"
                            placeholderTextColor="#9ca3af"
                            value={contrasena}
                            onChangeText={setContrasena}
                            secureTextEntry // Oculta lo que escribes con puntos
                        />

                        {/* Botón de acción: Cambia su texto y muestra carga si es necesario */}
                        <TouchableOpacity style={styles.botonAuthPrincipal} onPress={manejarAutenticacion} disabled={cargando}>
                            {cargando ? <ActivityIndicator color="white" /> : (
                                <Text style={styles.textoBotonAuth}>{esLogin ? 'Entrar' : 'Registrarse'}</Text>
                            )}
                        </TouchableOpacity>

                        {/* Switch para cambiar entre "Entrar" y "Registrarme" */}
                        <TouchableOpacity style={{ marginTop: 20, alignSelf: 'center' }} onPress={() => setEsLogin(!esLogin)}>
                            <Text style={styles.textoCambioAuth}>
                                {esLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Entra"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// ESTILOS: Colores neón, fondos oscuros y espaciados amplios
const styles = StyleSheet.create({
    contenedorPantalla: { flex: 1, backgroundColor: '#0c0c14' },
    contenidoScroll: { flexGrow: 1, justifyContent: 'center', padding: 30, paddingTop: Platform.OS === 'ios' ? 0 : 50 },
    filaLogo: { flexDirection: 'row', alignItems: 'center' },
    iconoLogo: { backgroundColor: '#7b2ff7', padding: 6, borderRadius: 10, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
    textoLogo: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    subtextoUbicacion: { fontSize: 9, color: '#7b2ff7', fontWeight: 'bold', letterSpacing: 1 },
    tituloAuth: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 40 },
    subtituloAuth: { color: '#9ca3af', fontSize: 14, marginTop: 10 },
    formularioAuth: { marginTop: 40 },
    inputAuth: { backgroundColor: '#1a1a24', borderRadius: 15, padding: 15, color: 'white', marginBottom: 15, fontSize: 15 },
    botonAuthPrincipal: { backgroundColor: '#7b2ff7', borderRadius: 15, padding: 15, alignItems: 'center', marginTop: 10 },
    textoBotonAuth: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    textoCambioAuth: { color: '#7b2ff7', fontSize: 14 },
});

export default PantallaAutenticacion;
