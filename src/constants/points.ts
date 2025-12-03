import type { PointCategory, PointStatus } from '../types';

/**
 * Opciones de categorías con sus etiquetas en español
 */
export const CATEGORY_OPTIONS: Array<{ value: PointCategory | string; label: string }> = [
  { value: 'RAMPA', label: 'Rampa' },
  { value: 'BANO', label: 'Baño' },
  { value: 'ASCENSOR', label: 'Ascensor' },
  { value: 'ESTACIONAMIENTO', label: 'Estacionamiento' },
  { value: 'SENALIZACION', label: 'Señalización' },
  { value: 'PUERTA', label: 'Puerta' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'VEREDA', label: 'Vereda' },
  { value: 'OTRO', label: 'Otro' },
];

/**
 * Opciones de estado con sus etiquetas y colores
 */
export const STATUS_OPTIONS: Array<{ 
  value: PointStatus | string; 
  label: string; 
  color: string;
}> = [
  { value: 'BUENO', label: 'Bueno', color: '#4caf50' },
  { value: 'REGULAR', label: 'Regular', color: '#ff9800' },
  { value: 'MALO', label: 'Malo', color: '#f44336' },
];

/**
 * Mapeo de categorías a sus etiquetas en español
 */
export const CATEGORY_LABELS: Record<string, string> = {
  RAMPA: 'Rampa',
  BANO: 'Baño',
  ASCENSOR: 'Ascensor',
  ESTACIONAMIENTO: 'Estacionamiento',
  SENALIZACION: 'Señalización',
  PUERTA: 'Puerta',
  TRANSPORTE: 'Transporte',
  VEREDA: 'Vereda',
  OTRO: 'Otro',
};

/**
 * Mapeo de estados a sus etiquetas en español
 */
export const STATUS_LABELS: Record<string, string> = {
  BUENO: 'Bueno',
  REGULAR: 'Regular',
  MALO: 'Malo',
};

/**
 * Mapeo de estados de documento a sus etiquetas en español
 */
export const POINT_STATUS_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
};

/**
 * Mapeo de estados a colores
 */
export const STATUS_COLORS: Record<string, string> = {
  BUENO: '#4caf50',
  REGULAR: '#ff9800',
  MALO: '#f44336',
};

/**
 * Mapeo de estados de documento a colores
 */
export const POINT_STATUS_COLORS: Record<string, string> = {
  PENDIENTE: '#ff9800',
  APROBADO: '#4caf50',
  RECHAZADO: '#f44336',
};

