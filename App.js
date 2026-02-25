import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  Keyboard
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// --- Importaciones de la nueva arquitectura modular (en español) ---
import { supabase } from './src/lib/supabase';
import { obtenerDistancia } from './src/utils/geolocalizacion';
import TarjetaSpot from './src/components/TarjetaSpot';
import PantallaAutenticacion from './src/screens/PantallaAutenticacion';
import PantallaPerfil from './src/screens/PantallaPerfil';

const { width } = Dimensions.get('window');

/**
 * COMPONENTE PRINCIPAL (Orquestador)
 * Maneja la sesión, ubicación global y la lógica de publicación.
 */
export default function App() {
  // --- Sesión y Estados Globales ---
  const [sesion, setSesion] = useState(null);
  const [cargandoApp, setCargandoApp] = useState(true);
  const [pestanaActiva, setPestanaActiva] = useState('feed'); // 'feed' (Inicio) o 'profile' (Perfil)

  // --- Datos y Sensores ---
  const [ubicacion, setUbicacion] = useState(null);
  const [spots, setSpots] = useState([]);
  const [tecladoVisible, setTecladoVisible] = useState(false); // Para ocultar el navbar al escribir

  // --- Formulario de nuevo "Spot" ---
  const [textoNuevoSpot, setTextoNuevoSpot] = useState('');
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [confirmarImagen, setConfirmarImagen] = useState(null);
  const [publicando, setPublicando] = useState(false);

  // --- Efecto Inicial: Sesión, Ubicación y Realtime ---
  useEffect(() => {
    // 1. Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesion(session);
      setCargandoApp(false);
    });

    // 2. Escuchar cambios en la autenticación (Login/Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session);
      setCargandoApp(false);
    });

    // 3. Control del teclado para mejorar el espacio en pantalla (Android/iOS)
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setTecladoVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setTecladoVisible(false));

    // 4. Inicialización de ubicación y suscripción en tiempo real
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let loc = await Location.getCurrentPositionAsync({});
      setUbicacion(loc.coords);
      obtenerPulsos();

      // Transmisión en tiempo real: Escucha cuando se inserta un nuevo registro en la tabla 'pulses'
      const subscription = supabase
        .channel('pulses-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pulses' }, (payload) => {
          setSpots(actuales => [payload.new, ...actuales]); // Agrega el nuevo Spot al inicio de la lista
        })
        .subscribe();

      return () => {
        authListener.subscription.unsubscribe();
        showSubscription.remove();
        hideSubscription.remove();
        supabase.removeChannel(subscription);
      };
    })();
  }, []);

  /**
   * Obtiene publicaciones creadas en las últimas 2 horas.
   */
  const obtenerPulsos = async () => {
    const haceDosHoras = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('pulses')
      .select('*')
      .gt('created_at', haceDosHoras)
      .order('created_at', { ascending: false });
    if (data) setSpots(data);
  };

  /**
   * Abre la galería y gestiona la pre-confirmación de la imagen.
   */
  const seleccionarImagen = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setConfirmarImagen(result.assets[0].uri);
    }
  };

  /**
   * Sube la imagen a Supabase Storage y retorna la URL pública.
   * Usamos FormData ya que Supabase requiere este formato para el cuerpo del upload.
   */
  const subirImagen = async (uri) => {
    const ext = uri.split('.').pop();
    const nombreArchivo = `${Date.now()}_${sesion.user.id}.${ext}`;
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: nombreArchivo,
      type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    });

    const { error } = await supabase.storage
      .from('pulses')
      .upload(nombreArchivo, formData, {
        contentType: 'multipart/form-data',
        cacheControl: '3600', // Cache de 1 hora para mejorar rendimiento
        upsert: false
      });

    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('pulses').getPublicUrl(nombreArchivo);
    return publicUrl;
  };

  /**
   * Orquestador para publicar un nuevo "Spot" con texto/imagen.
   * Coordina la subida de imagen, registro en BD y limpieza de estados.
   */
  const manejarPublicarSpot = async () => {
    if (!textoNuevoSpot.trim() && !imagenSeleccionada) return;
    if (!ubicacion) return Alert.alert('Error', 'Necesitamos tu ubicación para publicar');

    setPublicando(true);
    try {
      let urlImagen = null;
      if (imagenSeleccionada) {
        urlImagen = await subirImagen(imagenSeleccionada);
      }

      // Registro en la base de datos con coordenadas exactas (lat/lng)
      const { error } = await supabase
        .from('pulses')
        .insert([{
          content: textoNuevoSpot.trim(),
          lat: ubicacion.latitude,
          lng: ubicacion.longitude,
          image_url: urlImagen,
          user_id: sesion.user.id
        }]);

      if (error) {
        Alert.alert('Error en BD', error.message);
      } else {
        setTextoNuevoSpot('');
        setImagenSeleccionada(null);
        Keyboard.dismiss(); // Cierra el teclado automáticamente tras publicar
      }
    } catch (err) {
      Alert.alert('Error fatal', err.message);
    } finally {
      setPublicando(false);
    }
  };

  // --- Vistas de Carga y Autenticación ---
  if (cargandoApp) {
    return (
      <View style={[styles.contenedor, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7b2ff7" />
        <Text style={{ color: 'white', marginTop: 10 }}>Iniciando sesión...</Text>
      </View>
    );
  }

  if (!sesion) return <PantallaAutenticacion />;

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar style="light" />

      {/* Overlay de Confirmación */}
      {confirmarImagen && (
        <View style={styles.overlayConfirmacion}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.contenidoConfirmacion}>
            <Text style={styles.tituloConfirmacion}>¿Usar esta foto?</Text>
            <View style={styles.contenedorImagenConfirmacion}>
              <Image source={{ uri: confirmarImagen }} style={styles.imagenConfirmacion} />
            </View>
            <View style={styles.botonesConfirmacion}>
              <TouchableOpacity style={[styles.btnConfirmar, { backgroundColor: '#374151' }]} onPress={() => setConfirmarImagen(null)}>
                <Text style={styles.textoBtnConfirmar}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnConfirmar, { backgroundColor: '#1a1a24', borderWidth: 1, borderColor: '#374151' }]} disabled={true}>
                <Text style={[styles.textoBtnConfirmar, { color: '#9ca3af' }]}>RECORTAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnConfirmar, { backgroundColor: '#7b2ff7' }]} onPress={() => { setImagenSeleccionada(confirmarImagen); setConfirmarImagen(null); }}>
                <Text style={styles.textoBtnConfirmar}>LISTO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Header */}
      {pestanaActiva === 'feed' && (
        <View style={[styles.cabecera, { paddingTop: Platform.OS === 'ios' ? 10 : 45 }]}>
          <View style={styles.filaLogo}>
            <View style={styles.iconoLogo}><Ionicons name="location" size={18} color="white" /></View>
            <View>
              <Text style={styles.textoLogo}>Spot</Text>
              <Text style={styles.subtextoUbicacion}>CERCA DE TI</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.botonNotificacion}>
            <Ionicons name="notifications" size={20} color="white" />
            <View style={styles.puntoNotif} />
          </TouchableOpacity>
        </View>
      )}

      {/* Área de Contenido Principal */}
      <View style={{ flex: 1 }}>
        {pestanaActiva === 'feed' ? (
          <>
            <View style={styles.contenedorPestanas}>
              <TouchableOpacity style={[styles.pestana, styles.pestanaActiva]}>
                <MaterialCommunityIcons name="broadcast" size={16} color="white" />
                <Text style={styles.textoPestana}>Cerca</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pestana}>
                <Ionicons name="flame" size={16} color="#9ca3af" />
                <Text style={[styles.textoPestana, { color: '#9ca3af' }]}>Tendencias</Text>
              </TouchableOpacity>
            </View>

            {/* Filtrado Local: Solo publicaciones en un radio de 500 metros */}
            <FlatList
              data={spots.filter(p => !ubicacion || obtenerDistancia(ubicacion.latitude, ubicacion.longitude, p.lat, p.lng) <= 500)}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <TarjetaSpot item={item} userLocation={ubicacion} />}
              contentContainerStyle={styles.scrollFeed}
              showsVerticalScrollIndicator={false}
            />
          </>
        ) : (
          <PantallaPerfil usuario={sesion.user} alCerrarSesion={() => supabase.auth.signOut()} />
        )}
      </View>

      {/* Composición de un nuevo Spot (Solo visible en Feed) */}
      {pestanaActiva === 'feed' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
        >
          {imagenSeleccionada && (
            <View style={styles.previsualizacionImagenWrapper}>
              <Image source={{ uri: imagenSeleccionada }} style={styles.previsualizacionImagen} />
              <View style={styles.overlayImagen}>
                <Ionicons name="checkmark-circle" size={20} color="#4ade80" /><Text style={styles.textoListo}>LISTA</Text>
              </View>
              <TouchableOpacity style={styles.btnQuitarImagen} onPress={() => setImagenSeleccionada(null)}>
                <Ionicons name="close-circle" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.areaInput}>
            <View style={styles.contenedorInput}>
              <Ionicons name="create-outline" size={20} color="#9ca3af" style={{ marginRight: 10 }} />
              <TextInput style={styles.input} placeholder="¿Qué está pasando cerca?" placeholderTextColor="#9ca3af" value={textoNuevoSpot} onChangeText={setTextoNuevoSpot} maxLength={100} />
            </View>
            <TouchableOpacity style={[styles.btnImagen, { backgroundColor: '#2f56f7' }]} onPress={seleccionarImagen}><Ionicons name="image" size={22} color="white" /></TouchableOpacity>
            <TouchableOpacity style={[styles.btnImagen, { backgroundColor: '#7b2ff7', marginLeft: 8 }]} onPress={manejarPublicarSpot} disabled={(!textoNuevoSpot.trim() && !imagenSeleccionada) || publicando}>
              {publicando ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="send" size={20} color="white" />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Menú de Navegación Inferior (Se oculta al escribir) */}
      {!tecladoVisible && (
        <View style={[styles.barraNavegacion, { paddingBottom: Platform.OS === 'ios' ? 0 : 25 }]}>
          <TouchableOpacity style={styles.itemNav} onPress={() => setPestanaActiva('feed')}>
            <Ionicons name="home" size={22} color={pestanaActiva === 'feed' ? '#7b2ff7' : '#9ca3af'} />
            <Text style={[styles.textoNav, pestanaActiva === 'feed' && styles.textoNavActivo]}>Inicio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.itemNav} onPress={() => setPestanaActiva('profile')}>
            <Ionicons name="person" size={22} color={pestanaActiva === 'profile' ? '#7b2ff7' : '#9ca3af'} />
            <Text style={[styles.textoNav, pestanaActiva === 'profile' && styles.textoNavActivo]}>Perfil</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// --- Estilos Centralizados ---
const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#0c0c14' },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  filaLogo: { flexDirection: 'row', alignItems: 'center' },
  iconoLogo: { backgroundColor: '#7b2ff7', padding: 6, borderRadius: 10, marginRight: 10 },
  textoLogo: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  subtextoUbicacion: { fontSize: 9, color: '#7b2ff7', fontWeight: 'bold', letterSpacing: 1 },
  botonNotificacion: { backgroundColor: '#1a1a24', padding: 8, borderRadius: 12 },
  puntoNotif: { width: 6, height: 6, backgroundColor: '#7b2ff7', borderRadius: 3, position: 'absolute', top: 8, right: 10 },
  contenedorPestanas: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15 },
  pestana: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a24', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, marginRight: 8 },
  pestanaActiva: { backgroundColor: '#7b2ff7' },
  textoPestana: { color: 'white', marginLeft: 5, fontWeight: 'bold', fontSize: 13 },
  scrollFeed: { paddingHorizontal: 20, paddingBottom: 20 },
  areaInput: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#0c0c14' },
  contenedorInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a24', borderRadius: 22, paddingHorizontal: 15, height: 45 },
  input: { flex: 1, color: 'white', fontSize: 13 },
  btnImagen: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  previsualizacionImagenWrapper: { paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', position: 'relative' },
  previsualizacionImagen: { width: 80, height: 80, borderRadius: 12, borderWidth: 2, borderColor: '#7b2ff7' },
  overlayImagen: { position: 'absolute', bottom: 15, left: 25, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, borderRadius: 8 },
  textoListo: { color: 'white', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  btnQuitarImagen: { position: 'absolute', top: 5, left: 85 },
  // Estilos de la barra inferior (Tab Bar)
  barraNavegacion: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, backgroundColor: '#0c0c14', borderTopWidth: 0.5, borderTopColor: '#2d2d3d' },
  itemNav: { alignItems: 'center' },
  textoNav: { color: '#9ca3af', fontSize: 10, marginTop: 4 },
  textoNavActivo: { color: '#7b2ff7', fontWeight: 'bold' },
  // Estilos del modal de confirmación de imagen
  overlayConfirmacion: { ...StyleSheet.absoluteFillObject, zIndex: 9999, justifyContent: 'center', alignItems: 'center', padding: 20 },
  contenidoConfirmacion: { width: '100%', backgroundColor: '#1a1a24', borderRadius: 30, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#374151', elevation: 10 },
  tituloConfirmacion: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 20, letterSpacing: 0.5 },
  contenedorImagenConfirmacion: { width: width - 80, height: width - 80, borderRadius: 20, overflow: 'hidden', marginBottom: 25, borderWidth: 2, borderColor: '#7b2ff7' },
  imagenConfirmacion: { width: '100%', height: '100%' },
  botonesConfirmacion: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 8 },
  btnConfirmar: { flex: 1, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  textoBtnConfirmar: { color: 'white', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },
});
