import { Timestamp } from 'firebase/firestore';

/**
 * Categorías disponibles para los puntos
 */
export enum PointCategory {
  RAMPA = 'RAMPA',
  BANO = 'BANO',
  ASCENSOR = 'ASCENSOR',
  ESTACIONAMIENTO = 'ESTACIONAMIENTO',
  SENALIZACION = 'SENALIZACION',
  PUERTA = 'PUERTA',
  TRANSPORTE = 'TRANSPORTE',
  OTRO = 'OTRO',
}

/**
 * Estado de calidad del punto
 */
export enum PointStatus {
  BUENO = 'BUENO',
  REGULAR = 'REGULAR',
  MALO = 'MALO',
}

/**
 * Estado del documento del punto en el sistema
 */
export enum PointDocumentStatus {
  PENDIENTE = 'PENDIENTE',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
}

/**
 * Datos completos de un punto almacenado en Firestore
 */
export interface PointData {
  lat: number;
  lng: number;
  category: string;
  status: string; // PointStatus
  comments?: string;
  imageUrl?: string;
  userId: string;
  pointStatus: string; // PointDocumentStatus
  createdAt: Timestamp;
}

/**
 * Punto con ID (usado en la UI)
 */
export interface Point {
  id: string;
  lng: number;
  lat: number;
  category?: string;
  status?: string;
  comments?: string;
  imageUrl?: string;
  userId?: string;
  pointStatus?: string;
}

/**
 * Punto guardado en favoritos
 */
export interface SavedPoint {
  userId: string;
  pointId: string;
  savedAt: Timestamp;
}

/**
 * Punto con ID incluido (combinación de PointData + id)
 */
export type PointWithId = PointData & { id: string };

/**
 * Coordenadas geográficas
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

