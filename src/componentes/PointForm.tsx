import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import CancelDialog from "./CancelDialog";
import {
  savePoint,
  isPointSaved,
  savePointToFavorites,
  removePointFromFavorites,
} from "../firebase/points";
import { getCurrentUser } from "../firebase/auth";
import type { PointFormProps } from "../types";
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from "../constants/points";

const PointForm = ({
  point,
  onConfirmDelete,
  onClose,
  onFavoriteChanged,
  onPointSaved,
}: PointFormProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    point.imageUrl || null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [category, setCategory] = useState<string>(point.category || "");
  const [status, setStatus] = useState<string>(point.status || "");
  const [comments, setComments] = useState<string>(point.comments || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determinar si el punto ya está guardado (tiene pointStatus)
  const isSavedPoint = !!point.pointStatus;

  // Verificar si el usuario está logueado
  const user = getCurrentUser();

  // Actualizar los estados cuando cambia el punto
  useEffect(() => {
    setImagePreview(point.imageUrl || null);
    setCategory(point.category || "");
    setStatus(point.status || "");
    setComments(point.comments || "");
    setImageFile(null); // Resetear el archivo de imagen cuando cambia el punto
  }, [point.id, point.imageUrl, point.category, point.status, point.comments]);

  // Verificar si el punto está guardado en favoritos cuando está en modo read-only
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (isSavedPoint && user && point.id) {
        setIsCheckingFavorite(true);
        try {
          const saved = await isPointSaved(point.id);
          setIsFavorite(saved);
        } catch (error) {
          console.error("Error al verificar favorito:", error);
        } finally {
          setIsCheckingFavorite(false);
        }
      }
    };

    checkFavoriteStatus();
  }, [isSavedPoint, user, point.id]);

  const categories = CATEGORY_OPTIONS;
  const statusOptions = STATUS_OPTIONS;

  const handleCloseClick = () => {
    // Si el punto ya está guardado, cerrar directamente sin eliminar
    if (isSavedPoint) {
      if (onClose) {
        onClose();
      }
    } else {
      // Si es un punto nuevo, mostrar el diálogo de confirmación
      setOpenDialog(true);
    }
  };

  const handleCancelDialog = () => {
    setOpenDialog(false);
  };

  const handleConfirmDelete = () => {
    setOpenDialog(false);
    onConfirmDelete();
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // Validar campos requeridos
    if (!category) {
      setSaveError("Por favor selecciona una categoría");
      return;
    }
    if (!status) {
      setSaveError("Por favor selecciona un estado");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await savePoint(
        { lat: point.lat, lng: point.lng },
        category,
        status,
        comments,
        imageFile
      );

      // Mostrar mensaje de éxito
      setShowSuccessSnackbar(true);

      // Notificar que se guardó el punto
      if (onPointSaved) {
        onPointSaved();
      }

      // Cerrar el formulario después de 2 segundos
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);
    } catch (error) {
      console.error("Error al guardar:", error);
      setSaveError(
        error instanceof Error ? error.message : "Error al guardar el punto"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleToggleFavorite = async () => {
    if (!user || !point.id || isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    try {
      if (isFavorite) {
        await removePointFromFavorites(point.id);
        setIsFavorite(false);
        // Notificar que se quitó de favoritos
        if (onFavoriteChanged) {
          onFavoriteChanged();
        }
      } else {
        await savePointToFavorites(point.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error al cambiar favorito:", error);
      setSaveError(
        error instanceof Error ? error.message : "Error al cambiar favorito"
      );
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: "20px",
        left: "20px",
        zIndex: 1000,
        width: "400px",
        maxWidth: "90vw",
      }}
    >
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6" component="span">
                Información del Punto
              </Typography>
              {isSavedPoint && user && point.id && (
                <IconButton
                  onClick={handleToggleFavorite}
                  disabled={isTogglingFavorite || isCheckingFavorite}
                  size="small"
                  sx={{
                    p: 0.5,
                    color: isFavorite ? "#ff6b6b" : "#9ca3af",
                    transition: "color 0.2s ease",
                    "&:hover": {
                      color: isFavorite ? "#ff5252" : "#ff6b6b",
                      backgroundColor: "transparent",
                    },
                    "&:disabled": {
                      color: isFavorite ? "#ff6b6b" : "#9ca3af",
                    },
                  }}
                  aria-label={
                    isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
                  }
                >
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "1.5rem",
                      lineHeight: 1,
                      filter: isFavorite ? "none" : "grayscale(100%)",
                      transition: "filter 0.2s ease",
                    }}
                  >
                    {isTogglingFavorite ? "⏳" : "⭐"}
                  </Typography>
                </IconButton>
              )}
            </Box>
          }
          action={
            <IconButton
              aria-label="cerrar"
              onClick={handleCloseClick}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          }
        />
        <CardContent sx={{ p: 2, maxHeight: "70vh", overflowY: "auto" }}>
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: "bold", mb: 0.5, fontSize: "0.875rem" }}
            >
              Coordenadas:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
              Latitud: {point.lat.toFixed(6)}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
              Longitud: {point.lng.toFixed(6)}
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: "bold", mb: 0.5, fontSize: "0.875rem" }}
            >
              Foto:
            </Typography>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              style={{ display: "none" }}
            />

            {imagePreview ? (
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  mb: 2,
                }}
              >
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Preview"
                  sx={{
                    width: "100%",
                    maxHeight: "180px",
                    objectFit: "cover",
                    borderRadius: 1,
                    border: "1px solid #e0e0e0",
                  }}
                />
                <IconButton
                  onClick={handleRemoveImage}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 1)",
                    },
                  }}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ) : (
              !isSavedPoint && (
                <Box
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleClickUpload}
                  sx={{
                    border: `2px dashed ${isDragging ? "#3b82f6" : "#e0e0e0"}`,
                    borderRadius: 1,
                    p: 3,
                    textAlign: "center",
                    minHeight: "150px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    backgroundColor: isDragging ? "#f0f7ff" : "#fafafa",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "#3b82f6",
                      backgroundColor: "#f0f7ff",
                    },
                  }}
                >
                  <CloudUploadIcon
                    sx={{ fontSize: 48, color: "#9ca3af", mb: 1 }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ color: "#6b7280", mb: 0.5, fontSize: "0.85rem" }}
                  >
                    Arrastra una imagen aquí o haz clic para seleccionar
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "#9ca3af", fontSize: "0.75rem" }}
                  >
                    PNG, JPG, GIF hasta 10MB
                  </Typography>
                </Box>
              )
            )}
          </Box>

          <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
            <FormControl size="small" sx={{ flex: 1 }} disabled={isSavedPoint}>
              <InputLabel id="category-select-label">Categoría</InputLabel>
              <Select
                labelId="category-select-label"
                id="category-select"
                value={category}
                label="Categoría"
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ flex: 1 }} disabled={isSavedPoint}>
              <InputLabel id="status-select-label">Estado</InputLabel>
              <Select
                labelId="status-select-label"
                id="status-select"
                value={status}
                label="Estado"
                onChange={(e) => setStatus(e.target.value)}
                sx={{
                  "& .MuiSelect-select": {
                    color:
                      statusOptions.find((s) => s.value === status)?.color ||
                      "inherit",
                    fontWeight: 500,
                  },
                  "&.Mui-disabled .MuiSelect-select": {
                    color:
                      statusOptions.find((s) => s.value === status)?.color ||
                      "inherit",
                    WebkitTextFillColor:
                      statusOptions.find((s) => s.value === status)?.color ||
                      "inherit",
                  },
                }}
              >
                {statusOptions.map((statusOption) => (
                  <MenuItem key={statusOption.value} value={statusOption.value}>
                    <Box sx={{ color: statusOption.color, fontWeight: 500 }}>
                      {statusOption.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              size="small"
              id="comments-field"
              label="Comentarios"
              placeholder="Agrega comentarios adicionales (opcional)"
              multiline
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              variant="outlined"
              disabled={isSavedPoint}
            />
          </Box>

          {saveError && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="error" onClose={() => setSaveError(null)}>
                {saveError}
              </Alert>
            </Box>
          )}

          {!isSavedPoint && (
            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                startIcon={
                  isSaving ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                onClick={handleSave}
                disabled={isSaving}
                sx={{
                  backgroundColor: "#3b82f6",
                  "&:hover": {
                    backgroundColor: "#2563eb",
                  },
                  "&:disabled": {
                    backgroundColor: "#9ca3af",
                  },
                }}
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <CancelDialog
        open={openDialog}
        onClose={handleCancelDialog}
        onConfirm={handleConfirmDelete}
      />

      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={2000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowSuccessSnackbar(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Punto guardado exitosamente
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PointForm;
