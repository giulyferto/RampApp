import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  POINT_STATUS_LABELS,
  STATUS_COLORS,
  POINT_STATUS_COLORS,
} from '../constants/points';

/**
 * Obtiene la etiqueta en español de una categoría
 */
export const getCategoryLabel = (category?: string): string => {
  return category ? CATEGORY_LABELS[category] || category : 'Sin categoría';
};

/**
 * Obtiene la etiqueta en español de un estado
 */
export const getStatusLabel = (status?: string): string => {
  return status ? STATUS_LABELS[status] || status : 'Sin estado';
};

/**
 * Obtiene la etiqueta en español de un estado de documento
 */
export const getPointStatusLabel = (pointStatus?: string): string => {
  return pointStatus ? POINT_STATUS_LABELS[pointStatus] || pointStatus : 'Sin estado';
};

/**
 * Obtiene el color asociado a un estado
 */
export const getStatusColor = (status?: string): string => {
  return status ? STATUS_COLORS[status] || '#9ca3af' : '#9ca3af';
};

/**
 * Obtiene el color asociado a un estado de documento
 */
export const getPointStatusColor = (pointStatus?: string): string => {
  return pointStatus ? POINT_STATUS_COLORS[pointStatus] || '#9ca3af' : '#9ca3af';
};

