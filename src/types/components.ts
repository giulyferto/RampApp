import type { ReactNode } from 'react';
import type { Point, PointWithId } from './points';

/**
 * Props del componente MapboxMap
 */
export interface MapboxMapProps {
  onPointAdded?: (point: Point) => void;
  onRemovePoint?: (pointId: string) => void;
  onPointUpdated?: (point: Point) => void;
  isFormOpen?: boolean;
  showOnlySavedPoints?: boolean;
  showOnlyMyPoints?: boolean;
  savedPointsRefreshKey?: number;
  mapRefreshKey?: number;
}

/**
 * Props del componente PointForm
 */
export interface PointFormProps {
  point: Point;
  onConfirmDelete: () => void;
  onClose?: () => void;
  onFavoriteChanged?: () => void;
  onPointSaved?: () => void;
  isAdminMode?: boolean;
  onStatusUpdated?: () => void;
}

/**
 * Props del componente PointsList
 */
export interface PointsListProps {
  title: string;
  fetchPoints: () => Promise<PointWithId[]>;
  onPointClick: (point: Point) => void;
  showPointStatus?: boolean;
  icon?: ReactNode;
  emptyMessage?: string;
  tooltipTitle?: string;
  refreshKey?: number;
}

/**
 * Props del componente NavBar
 */
export interface NavBarProps {
  onShowSavedPoints?: () => void;
  onShowAllPoints?: () => void;
  onShowMyPoints?: () => void;
  onShowPendingPoints?: () => void;
  showOnlySavedPoints?: boolean;
  showOnlyMyPoints?: boolean;
  showPendingPoints?: boolean;
}

/**
 * Props del componente CancelDialog
 */
export interface CancelDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

