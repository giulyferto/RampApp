import mapboxgl from "mapbox-gl";
import { useRef, useEffect, useState, useCallback } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { onAuthChange, getCurrentUser } from "../firebase/auth";
import type { User } from "firebase/auth";
import { Tooltip, Button } from "@mui/material";
import { getPoints, getSavedPoints, getMyPoints, getPendingPoints } from "../firebase/points";
import type { Point, MapboxMapProps } from "../types";

const MapboxMap = ({ onPointAdded, onRemovePoint, onPointUpdated, isFormOpen = false, showOnlySavedPoints = false, showOnlyMyPoints = false, showPendingPoints = false, savedPointsRefreshKey, mapRefreshKey }: MapboxMapProps) => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const pointsMapRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const onPointUpdatedRef = useRef(onPointUpdated);
  const onPointAddedRef = useRef(onPointAdded);
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Mantener las referencias actualizadas
  useEffect(() => {
    onPointUpdatedRef.current = onPointUpdated;
    onPointAddedRef.current = onPointAdded;
  }, [onPointUpdated, onPointAdded]);

  // Verificar estado de autenticación
  useEffect(() => {
    // Verificar si hay un usuario autenticado al cargar
    setUser(getCurrentUser());

    // Escuchar cambios en el estado de autenticación
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
    const markers = markersRef.current;
    let map: mapboxgl.Map | null = null;
    
    if (mapContainerRef.current) {
      map = new mapboxgl.Map({
        container: mapContainerRef.current as HTMLElement,
        center: [-64.19218, -31.41138],
        zoom: 11.63,
      });
      mapRef.current = map;

      // Agregar controles de navegación (zoom in, zoom out, brújula)
      map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    }

    return () => {
      // Limpiar marcadores
      markers.forEach((marker) => marker.remove());
      if (map) {
        map.remove();
      }
    };
  }, []);

  // Efecto separado para manejar el cambio de cursor
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = isAddingPoint ? "crosshair" : "";
    }
  }, [isAddingPoint]);

  // Mantener un registro de puntos nuevos (sin pointStatus) para preservarlos
  const newPointsRef = useRef<Set<string>>(new Set());

  const addPointToMap = useCallback((point: Point, isSavedPoint = false) => {
    if (!mapRef.current) return;

    // Si el punto ya existe, no agregarlo de nuevo
    if (pointsMapRef.current.has(point.id)) {
      return;
    }

    // Si es un punto nuevo (sin pointStatus), agregarlo al registro
    if (!isSavedPoint && !point.pointStatus) {
      newPointsRef.current.add(point.id);
    }

    // Crear un elemento HTML personalizado para el marcador con emoji
    const el = document.createElement("div");
    el.className = "custom-marker";
    el.style.width = "auto";
    el.style.height = "auto";
    el.style.cursor = isSavedPoint ? "pointer" : "grab";
    el.style.fontSize = "32px";
    el.style.lineHeight = "1";
    el.style.userSelect = "none";
    
    // Agregar emoji de ubicación
    el.textContent = "📍";

    // Crear el marcador con offset para que el pin apunte correctamente
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: "bottom",
      draggable: !isSavedPoint, // Solo los puntos nuevos son arrastrables
    })
      .setLngLat([point.lng, point.lat])
      .addTo(mapRef.current);

    // Si es un punto guardado, hacer que sea clickeable para abrir el formulario
    if (isSavedPoint) {
      el.addEventListener("click", (e) => {
        e.stopPropagation(); // Evitar que el click se propague al mapa
        if (onPointAddedRef.current) {
          onPointAddedRef.current(point);
        }
      });
    } else {
      // Cambiar cursor cuando se está arrastrando (solo para puntos nuevos)
      marker.on("dragstart", () => {
        el.style.cursor = "grabbing";
      });

      marker.on("dragend", () => {
        el.style.cursor = "grab";
        // Obtener las nuevas coordenadas del marcador
        const newLngLat = marker.getLngLat();
        const updatedPoint: Point = {
          id: point.id,
          lng: newLngLat.lng,
          lat: newLngLat.lat,
        };
        // Notificar al componente padre que el punto se actualizó usando la ref
        if (onPointUpdatedRef.current) {
          onPointUpdatedRef.current(updatedPoint);
        }
      });
    }

    markersRef.current.push(marker);
    pointsMapRef.current.set(point.id, marker);
  }, []);

  // Función para limpiar solo los marcadores guardados (no los puntos nuevos)
  const clearSavedMarkers = useCallback(() => {
    // Solo eliminar marcadores que NO son puntos nuevos
    const markersToRemove: mapboxgl.Marker[] = [];
    const pointIdsToRemove: string[] = [];
    
    pointsMapRef.current.forEach((marker, pointId) => {
      // Preservar los puntos nuevos (que están en newPointsRef)
      if (!newPointsRef.current.has(pointId)) {
        markersToRemove.push(marker);
        pointIdsToRemove.push(pointId);
      }
    });

    markersToRemove.forEach((marker) => {
      marker.remove();
      const index = markersRef.current.indexOf(marker);
      if (index > -1) {
        markersRef.current.splice(index, 1);
      }
    });

    pointIdsToRemove.forEach((pointId) => {
      pointsMapRef.current.delete(pointId);
    });
  }, []);

  // Cargar puntos según el modo (todos o solo guardados)
  useEffect(() => {
    if (!mapRef.current) return;

    const loadPoints = async () => {
      // Limpiar solo los marcadores guardados, preservando los puntos nuevos
      clearSavedMarkers();

      try {
        let pointsToLoad;
        
        if (showPendingPoints) {
          // Cargar solo los puntos pendientes (modo administración)
          pointsToLoad = await getPendingPoints();
        } else if (showOnlySavedPoints && user) {
          // Cargar solo los puntos guardados del usuario
          pointsToLoad = await getSavedPoints();
        } else if (showOnlyMyPoints && user) {
          // Cargar solo los puntos creados por el usuario
          pointsToLoad = await getMyPoints();
        } else {
          // Cargar todos los puntos aprobados (vista principal)
          pointsToLoad = await getPoints();
        }

        pointsToLoad.forEach((pointData) => {
          // Verificar si el punto ya existe en el mapa (para evitar duplicados)
          if (!pointsMapRef.current.has(pointData.id)) {
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
            addPointToMap(point, true); // true indica que es un punto guardado
          }
        });
      } catch (error) {
        console.error("Error al cargar puntos:", error);
      }
    };

    // Esperar a que el mapa esté listo
    if (mapRef.current.loaded()) {
      loadPoints();
    } else {
      mapRef.current.once("load", loadPoints);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOnlySavedPoints, showOnlyMyPoints, showPendingPoints, user, savedPointsRefreshKey, mapRefreshKey]);

  // Exponer la función de eliminación
  useEffect(() => {
    interface WindowWithRemovePoint extends Window {
      __removePointFromMap?: (pointId: string) => void;
    }
    
    // Función para eliminar un punto del mapa
    const removePoint = (pointId: string) => {
      const marker = pointsMapRef.current.get(pointId);
      if (marker) {
        marker.remove();
        pointsMapRef.current.delete(pointId);
        // Remover del registro de puntos nuevos también
        newPointsRef.current.delete(pointId);
        // Remover del array de marcadores también
        const index = markersRef.current.indexOf(marker);
        if (index > -1) {
          markersRef.current.splice(index, 1);
        }
        if (onRemovePoint) {
          onRemovePoint(pointId);
        }
      }
    };

    (window as WindowWithRemovePoint).__removePointFromMap = removePoint;
    return () => {
      delete (window as WindowWithRemovePoint).__removePointFromMap;
    };
  }, [onRemovePoint]);

  // Función para manejar clics en el mapa usando el estado actual
  useEffect(() => {
    if (!mapRef.current) return;

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      if (isAddingPoint && user) {
        const newPoint: Point = {
          id: Date.now().toString(),
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
        };
        addPointToMap(newPoint);
        setIsAddingPoint(false);
        // Notificar al componente padre que se agregó un punto
        if (onPointAddedRef.current) {
          onPointAddedRef.current(newPoint);
        }
      }
    };

    mapRef.current.on("click", handleMapClick);

    return () => {
      if (mapRef.current) {
        mapRef.current.off("click", handleMapClick);
      }
    };
  }, [isAddingPoint, user, onPointAdded, addPointToMap]);

  const handleAddPointClick = () => {
    if (user) {
      setIsAddingPoint(true);
    }
  };

  const handleCancelAddPoint = () => {
    setIsAddingPoint(false);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 1000,
          display: "flex",
          gap: "10px",
        }}
      >
        {isAddingPoint ? (
          <div style={{ display: "flex", gap: "10px" }}>
            <div
              style={{
                padding: "10px 20px",
                backgroundColor: "white",
                borderRadius: "5px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                fontSize: "14px",
                fontWeight: "500",
                color: "#3b82f6",
              }}
            >
              Haz clic en el mapa para agregar un punto
            </div>
            <Button
              variant="contained"
              color="error"
              onClick={handleCancelAddPoint}
            >
              Cancelar
            </Button>
          </div>
        ) : !isFormOpen && (
          <Tooltip
            title="Inicia sesión con tu cuenta para agregar un punto"
            disableHoverListener={!!user}
            arrow
          >
            <span>
              <Button
                variant="contained"
                onClick={handleAddPointClick}
                disabled={!user}
                sx={{
                  backgroundColor: user ? "#3b82f6" : "#9ca3af",
                  "&:hover": {
                    backgroundColor: user ? "#2563eb" : "#9ca3af",
                  },
                  "&:disabled": {
                    backgroundColor: "#9ca3af",
                    opacity: 0.6,
                  },
                }}
              >
                + Agregar Punto
              </Button>
            </span>
          </Tooltip>
        )}
      </div>
      <div id="map-container" ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default MapboxMap;
