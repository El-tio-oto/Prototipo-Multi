/**
 * UTILIDADES GEOGRÁFICAS (El "GPS" de la App)
 * Contiene la lógica matemática para saber si algo está cerca de ti.
 */

/**
 * FUNCIÓN: obtenerDistancia
 * 
 * ¿Cómo funciona?
 * Los teléfonos nos dan latitud y longitud (grados). Pero la Tierra es una esfera, no un plano.
 * Usamos la **Fórmula de Haversine** para calcular la línea curva más corta entre dos puntos.
 * 
 * @param {number} lat1 - Latitud tuya
 * @param {number} lon1 - Longitud tuya
 * @param {number} lat2 - Latitud del Spot
 * @param {number} lon2 - Longitud del Spot
 * @returns {number} El resultado exacto en Metros
 */
export const obtenerDistancia = (lat1, lon1, lat2, lon2) => {
    // Si el teléfono no nos da alguna coordenada, no podemos calcular nada.
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

    const R = 6371e3; // Radio de la Tierra en metros (esto es una constante científica)

    // PASO 1: Convertimos los grados (que entiende el humano) a Radianes (que entiende la matemática)
    const φ1 = lat1 * (Math.PI / 180);
    const φ2 = lat2 * (Math.PI / 180);
    const Δφ = (lat2 - lat1) * (Math.PI / 180); // Diferencia de latitud
    const Δλ = (lon2 - lon1) * (Math.PI / 180); // Diferencia de longitud

    // PASO 2: Aplicamos la parte compleja de la fórmula (senos y cosenos)
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    // PASO 3: Calculamos la distancia final multiplicando por el radio terrestre
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // ¡Listo! Ya tenemos la distancia en metros
};
