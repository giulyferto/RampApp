import { collection, addDoc, Timestamp, getDocs, query, orderBy, where, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';
import { getCurrentUser } from './auth';
import type { PointData, SavedPoint, PointWithId } from '../types';

export const savePoint = async (
  point: { lat: number; lng: number },
  category: string,
  status: string,
  comments: string,
  imageFile: File | null
): Promise<string> => {
  const user = getCurrentUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // Esperar a que el token de autenticación esté listo
  const token = await user.getIdToken();
  if (!token) {
    throw new Error('No se pudo obtener el token de autenticación');
  }

  let imageUrl: string | undefined;

  // Subir imagen si existe
  if (imageFile) {
    try {
      // Crear una referencia única para la imagen
      // Limpiar el nombre del archivo para evitar caracteres especiales
      const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const imageRef = ref(storage, `points/${user.uid}/${Date.now()}_${sanitizedFileName}`);
      
      // Subir el archivo con metadata
      await uploadBytes(imageRef, imageFile, {
        contentType: imageFile.type,
        customMetadata: {
          uploadedBy: user.uid,
          uploadedAt: new Date().toISOString(),
        },
      });
      
      // Obtener la URL de descarga
      imageUrl = await getDownloadURL(imageRef);
    } catch (error) {
      // Proporcionar un mensaje de error más descriptivo
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('cors') || errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
          throw new Error('Error de permisos/CORS. Verifica: 1) Reglas de Firebase Storage, 2) Configuración CORS del bucket en Google Cloud Console.');
        }
        throw new Error(`Error al subir la imagen: ${error.message}`);
      }
      throw new Error('Error al subir la imagen');
    }
  }

  // Crear el documento del punto (solo campos requeridos)
  const pointData: Record<string, unknown> = {
    lat: point.lat,
    lng: point.lng,
    category,
    status,
    userId: user.uid,
    pointStatus: 'PENDIENTE',
    createdAt: Timestamp.now(),
  };

  // Solo agregar campos opcionales si tienen valor (Firestore no acepta undefined)
  if (comments && comments.trim() !== '') {
    pointData.comments = comments.trim();
  }
  if (imageUrl) {
    pointData.imageUrl = imageUrl;
  }

  try {
    // Guardar en Firestore
    const docRef = await addDoc(collection(db, 'punto'), pointData);
    return docRef.id;
  } catch {
    throw new Error('Error al guardar el punto');
  }
};

export const getPoints = async (): Promise<PointWithId[]> => {
  try {
    const q = query(collection(db, 'punto'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as PointData),
    }));
  } catch {
    throw new Error('Error al obtener los puntos');
  }
};

/**
 * Obtener todos los puntos con estado PENDIENTE (solo para administradores)
 * @returns Lista de puntos pendientes ordenados por fecha de creación
 */
export const getPendingPoints = async (): Promise<PointWithId[]> => {
  try {
    const q = query(
      collection(db, 'punto'),
      where('pointStatus', '==', 'PENDIENTE'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as PointData),
    }));
  } catch (error) {
    // Si el error es por falta de índice, intentar sin orderBy y ordenar en el cliente
    if (error instanceof Error && error.message.includes('index')) {
      try {
        const q = query(
          collection(db, 'punto'),
          where('pointStatus', '==', 'PENDIENTE')
        );
        const querySnapshot = await getDocs(q);
        
        const points = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as PointData),
        }));
        
        // Ordenar por fecha de creación en el cliente (más recientes primero)
        return points.sort((a, b) => {
          const aTime = a.createdAt?.toMillis() || 0;
          const bTime = b.createdAt?.toMillis() || 0;
          return bTime - aTime;
        });
      } catch (fallbackError) {
        console.error('Error al obtener puntos pendientes (fallback):', fallbackError);
        throw new Error('Error al obtener puntos pendientes. Por favor, crea el índice compuesto en Firestore o contacta al administrador.');
      }
    }
    console.error('Error al obtener puntos pendientes:', error);
    throw new Error(error instanceof Error ? error.message : 'Error al obtener puntos pendientes');
  }
};


// Verificar si un punto está guardado por el usuario actual
export const isPointSaved = async (pointId: string): Promise<boolean> => {
  const user = getCurrentUser();
  
  if (!user) {
    return false;
  }

  try {
    const q = query(
      collection(db, 'puntosGuardados'),
      where('userId', '==', user.uid),
      where('pointId', '==', pointId)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch {
    return false;
  }
};

// Obtener el ID del documento guardado (para poder eliminarlo después)
export const getSavedPointDocId = async (pointId: string): Promise<string | null> => {
  const user = getCurrentUser();
  
  if (!user) {
    return null;
  }

  try {
    const q = query(
      collection(db, 'puntosGuardados'),
      where('userId', '==', user.uid),
      where('pointId', '==', pointId)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }
    return null;
  } catch {
    return null;
  }
};

// Guardar un punto en la colección puntosGuardados
export const savePointToFavorites = async (pointId: string): Promise<void> => {
  const user = getCurrentUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // Verificar si ya está guardado
  const alreadySaved = await isPointSaved(pointId);
  if (alreadySaved) {
    return; // Ya está guardado, no hacer nada
  }

  try {
    const savedPointData: SavedPoint = {
      userId: user.uid,
      pointId: pointId,
      savedAt: Timestamp.now(),
    };
    await addDoc(collection(db, 'puntosGuardados'), savedPointData);
  } catch {
    throw new Error('Error al guardar el punto en favoritos');
  }
};

// Eliminar un punto de la colección puntosGuardados
export const removePointFromFavorites = async (pointId: string): Promise<void> => {
  const user = getCurrentUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  try {
    const docId = await getSavedPointDocId(pointId);
    if (docId) {
      await deleteDoc(doc(db, 'puntosGuardados', docId));
    } else {
      // Si no se encuentra el documento, verificar si realmente no existe
      const isSaved = await isPointSaved(pointId);
      if (isSaved) {
        throw new Error('No se pudo encontrar el documento para eliminar');
      }
      // Si no está guardado, no hay nada que eliminar, simplemente retornar
      return;
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('No se pudo encontrar')) {
      throw error;
    }
    throw new Error('Error al eliminar el punto de favoritos');
  }
};

// Obtener todos los puntos guardados del usuario actual
export const getSavedPoints = async (): Promise<PointWithId[]> => {
  const user = getCurrentUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  try {
    // Obtener todos los puntos guardados del usuario
    const q = query(
      collection(db, 'puntosGuardados'),
      where('userId', '==', user.uid)
    );
    const savedPointsSnapshot = await getDocs(q);
    
    if (savedPointsSnapshot.empty) {
      return [];
    }

    // Obtener los IDs de los puntos guardados
    const pointIds = savedPointsSnapshot.docs.map(doc => doc.data().pointId);
    
    // Obtener los datos completos de cada punto desde la colección 'punto'
    const pointsPromises = pointIds.map(async (pointId) => {
      try {
        const pointDoc = await getDoc(doc(db, 'punto', pointId));
        if (pointDoc.exists()) {
          return {
            id: pointDoc.id,
            ...(pointDoc.data() as PointData),
          };
        }
        return null;
      } catch {
        return null;
      }
    });

    const points = await Promise.all(pointsPromises);
    
    // Filtrar los nulls (puntos que ya no existen) y ordenar por fecha de creación
    return points
      .filter((point): point is PointWithId => point !== null)
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime; // Más recientes primero
      });
  } catch {
    throw new Error('Error al obtener los puntos guardados');
  }
};

// Obtener todos los puntos creados por el usuario actual
export const getMyPoints = async (): Promise<PointWithId[]> => {
  const user = getCurrentUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  try {
    // Intentar obtener los puntos con ordenamiento
    const q = query(
      collection(db, 'punto'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as PointData),
    }));
  } catch (error) {
    // Si el error es por falta de índice, intentar sin orderBy y ordenar en el cliente
    if (error instanceof Error && error.message.includes('index')) {
      try {
        const q = query(
          collection(db, 'punto'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        
        const points = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as PointData),
        }));
        
        // Ordenar por fecha de creación en el cliente (más recientes primero)
        return points.sort((a, b) => {
          const aTime = a.createdAt?.toMillis() || 0;
          const bTime = b.createdAt?.toMillis() || 0;
          return bTime - aTime;
        });
      } catch (fallbackError) {
        console.error('Error al obtener mis puntos (fallback):', fallbackError);
        throw new Error('Error al obtener mis puntos. Por favor, crea el índice compuesto en Firestore o contacta al administrador.');
      }
    }
    // Si es otro tipo de error, lanzarlo con más información
    console.error('Error al obtener mis puntos:', error);
    throw new Error(error instanceof Error ? error.message : 'Error al obtener mis puntos');
  }
};

/**
 * Actualizar el estado de un punto (solo para administradores)
 * @param pointId - ID del punto a actualizar
 * @param newStatus - Nuevo estado ('APROBADO' o 'RECHAZADO')
 */
export const updatePointStatus = async (pointId: string, newStatus: 'APROBADO' | 'RECHAZADO'): Promise<void> => {
  const user = getCurrentUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  if (newStatus !== 'APROBADO' && newStatus !== 'RECHAZADO') {
    throw new Error('El estado debe ser APROBADO o RECHAZADO');
  }

  try {
    await updateDoc(doc(db, 'punto', pointId), {
      pointStatus: newStatus,
    });
  } catch (error) {
    console.error('Error al actualizar el estado del punto:', error);
    throw new Error('Error al actualizar el estado del punto');
  }
};

/**
 * Obtener información del usuario creador desde Firestore
 * @param userId - ID del usuario
 * @returns Información del usuario o null si no se encuentra
 */
export const getUserInfo = async (userId: string): Promise<{ email: string; displayName: string } | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        email: data.email || '',
        displayName: data.displayName || '',
      };
    }
    return null;
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    return null;
  }
};

