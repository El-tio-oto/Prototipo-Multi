// 1. IMPORTACIONES: Configuración del motor de la base de datos
// 'auto' permite que Supabase use las funciones de URL modernas del navegador
import 'react-native-url-polyfill/auto';
// Almacén local del teléfono (como el disco duro) para recordar al usuario
import AsyncStorage from '@react-native-async-storage/async-storage';
// La herramienta oficial para hablar con la base de datos de Supabase
import { createClient } from '@supabase/supabase-js';

// Extraemos las llaves maestras desde el archivo de configuración (.env)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// INICIALIZACIÓN: Creamos el "Cliente" que usaremos en toda la app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage, // Guarda la sesión aquí para que no se borre al cerrar la app
        autoConfirmOtp: true,  // Confirma códigos automáticamente si es posible
        persistSession: true,  // Mantiene al usuario logueado
        detectSessionInUrl: false, // Desactivado porque es una app móvil, no web
    },
});
