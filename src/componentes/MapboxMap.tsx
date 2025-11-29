import mapboxgl from "mapbox-gl";
import { useRef, useEffect, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

interface Point {
  id: string;
  lng: number;
  lat: number;
}

const MapboxMap = () => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isAddingPoint, setIsAddingPoint] = useState(false);

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

  const addPointToMap = (point: Point) => {
    if (!mapRef.current) return;

    // Crear un elemento HTML personalizado para el marcador con emoji
    const el = document.createElement("div");
    el.className = "custom-marker";
    el.style.width = "auto";
    el.style.height = "auto";
    el.style.cursor = "grab";
    el.style.fontSize = "32px";
    el.style.lineHeight = "1";
    el.style.userSelect = "none";
    
    // Agregar emoji de ubicación
    el.textContent = "📍";

    // Crear el marcador con offset para que el pin apunte correctamente
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: "bottom",
      draggable: true,
    })
      .setLngLat([point.lng, point.lat])
      .addTo(mapRef.current);

    // Cambiar cursor cuando se está arrastrando
    marker.on("dragstart", () => {
      el.style.cursor = "grabbing";
    });

    marker.on("dragend", () => {
      el.style.cursor = "grab";
    });

    markersRef.current.push(marker);
  };

  // Función para manejar clics en el mapa usando el estado actual
  useEffect(() => {
    if (!mapRef.current) return;

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      if (isAddingPoint) {
        const newPoint: Point = {
          id: Date.now().toString(),
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
        };
        addPointToMap(newPoint);
        setIsAddingPoint(false);
      }
    };

    mapRef.current.on("click", handleMapClick);

    return () => {
      if (mapRef.current) {
        mapRef.current.off("click", handleMapClick);
      }
    };
  }, [isAddingPoint]);

  const handleAddPointClick = () => {
    setIsAddingPoint(true);
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
        {!isAddingPoint ? (
          <button
            onClick={handleAddPointClick}
            style={{
              padding: "10px 20px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            + Agregar Punto
          </button>
        ) : (
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
            <button
              onClick={handleCancelAddPoint}
              style={{
                padding: "10px 20px",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
      <div id="map-container" ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default MapboxMap;
