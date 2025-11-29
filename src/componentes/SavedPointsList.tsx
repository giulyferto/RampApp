import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Avatar, Chip, CircularProgress, Alert, IconButton, Tooltip } from '@mui/material';
import { LocationOn as LocationIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Bookmark as BookmarkIcon } from '@mui/icons-material';
import type { Point } from './MapboxMap';
import { getSavedPoints } from '../firebase/points';
import type { PointData } from '../firebase/points';

interface SavedPointsListProps {
  onPointClick: (point: Point) => void;
}

const SavedPointsList = ({ onPointClick }: SavedPointsListProps) => {
  const [points, setPoints] = useState<(PointData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const loadPoints = async () => {
      setLoading(true);
      setError(null);
      try {
        const savedPoints = await getSavedPoints();
        setPoints(savedPoints);
      } catch (err) {
        console.error('Error al cargar puntos guardados:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los puntos guardados');
      } finally {
        setLoading(false);
      }
    };

    loadPoints();
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'BUENO':
        return '#4caf50';
      case 'REGULAR':
        return '#ff9800';
      case 'MALO':
        return '#f44336';
      default:
        return '#9ca3af';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'BUENO':
        return 'Bueno';
      case 'REGULAR':
        return 'Regular';
      case 'MALO':
        return 'Malo';
      default:
        return 'Sin estado';
    }
  };

  const getCategoryLabel = (category?: string) => {
    const categories: Record<string, string> = {
      RAMPA: 'Rampa',
      BANO: 'Baño',
      ASCENSOR: 'Ascensor',
      ESTACIONAMIENTO: 'Estacionamiento',
      SENALIZACION: 'Señalización',
      PUERTA: 'Puerta',
      TRANSPORTE: 'Transporte',
      OTRO: 'Otro',
    };
    return categories[category || ''] || category || 'Sin categoría';
  };

  const handlePointClick = (pointData: PointData & { id: string }) => {
    const point: Point = {
      id: pointData.id,
      lng: pointData.lng,
      lat: pointData.lat,
      category: pointData.category,
      status: pointData.status,
      comments: pointData.comments,
      imageUrl: pointData.imageUrl,
      userId: pointData.userId,
      pointStatus: pointData.pointStatus,
    };
    onPointClick(point);
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Si está minimizado, mostrar solo el icono
  if (isMinimized) {
    return (
      <Tooltip title="Mostrar puntos guardados" arrow>
        <Box
          onClick={handleToggleMinimize}
          sx={{
            position: 'absolute',
            left: '20px',
            top: '80px',
            width: '48px',
            height: '48px',
            zIndex: 1000,
            backgroundColor: 'white',
            borderRadius: '50%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
              transform: 'scale(1.05)',
              backgroundColor: '#f5f5f5',
            },
          }}
        >
          <BookmarkIcon sx={{ color: '#3b82f6', fontSize: '24px' }} />
        </Box>
      </Tooltip>
    );
  }

  // Panel completo
  return (
    <Box
      sx={{
        position: 'absolute',
        left: '20px',
        top: '80px',
        width: '350px',
        maxWidth: 'calc(100vw - 40px)',
        maxHeight: 'calc(100vh - 100px)',
        zIndex: 1000,
        backgroundColor: 'white',
        borderRadius: 2,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            Puntos Guardados
          </Typography>
          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.85rem' }}>
            {points.length} {points.length === 1 ? 'punto' : 'puntos'}
          </Typography>
        </Box>
        <Tooltip title="Minimizar" arrow>
          <IconButton
            onClick={handleToggleMinimize}
            size="small"
            sx={{
              color: '#666',
              '&:hover': {
                backgroundColor: '#e0e0e0',
              },
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 1,
        }}
      >
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={30} />
          </Box>
        )}

        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error" sx={{ fontSize: '0.85rem' }}>
              {error}
            </Alert>
          </Box>
        )}

        {!loading && !error && points.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#666' }}>
              No tienes puntos guardados aún
            </Typography>
          </Box>
        )}

        {!loading && !error && points.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {points.map((point) => (
              <Card
                key={point.id}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => handlePointClick(point)}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    {point.imageUrl ? (
                      <Avatar
                        src={point.imageUrl}
                        variant="rounded"
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 1,
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 1,
                          backgroundColor: '#e3f2fd',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <LocationIcon sx={{ color: '#2196f3' }} />
                      </Avatar>
                    )}

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {getCategoryLabel(point.category)}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, flexWrap: 'wrap' }}>
                        <Chip
                          label={getStatusLabel(point.status)}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            backgroundColor: getStatusColor(point.status),
                            color: 'white',
                            fontWeight: 500,
                          }}
                        />
                      </Box>

                      {point.comments && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#666',
                            fontSize: '0.75rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.3,
                          }}
                        >
                          {point.comments}
                        </Typography>
                      )}

                      <Typography
                        variant="caption"
                        sx={{
                          color: '#999',
                          fontSize: '0.7rem',
                          mt: 0.5,
                          display: 'block',
                        }}
                      >
                        {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SavedPointsList;

