import { collection, addDoc, Timestamp, getDocs, query, orderBy } from 'firebase/firestore';
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

