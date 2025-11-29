import { collection, addDoc, Timestamp, getDocs, query, orderBy, where, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';
import { getCurrentUser } from './auth';

export interface PointData {
  lat: number;
  lng: number;
  category: string;
  status: string; // Estado del punto (BUENO, REGULAR, MALO)
  comments?: string;
  imageUrl?: string;
  userId: string;
  pointStatus: string; // Estado del documento (PENDIENTE, etc.)
  createdAt: Timestamp;
}

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

export const getPoints = async (): Promise<(PointData & { id: string })[]> => {
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

export interface SavedPoint {
  userId: string;
  pointId: string;
  savedAt: Timestamp;
}

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
export const getSavedPoints = async (): Promise<(PointData & { id: string })[]> => {
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
      .filter((point): point is PointData & { id: string } => point !== null)
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime; // Más recientes primero
      });
  } catch {
    throw new Error('Error al obtener los puntos guardados');
  }
};

