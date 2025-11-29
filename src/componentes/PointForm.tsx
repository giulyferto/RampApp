import { useState } from "react";
import { Card, CardContent, CardHeader, IconButton, Box } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import type { Point } from "./MapboxMap";
import CancelDialog from "./CancelDialog";

interface PointFormProps {
  point: Point;
  onConfirmDelete: () => void;
}

const PointForm = ({ point, onConfirmDelete }: PointFormProps) => {
  const [openDialog, setOpenDialog] = useState(false);

  const handleCloseClick = () => {
    setOpenDialog(true);
  };

  const handleCancelDialog = () => {
    setOpenDialog(false);
  };

  const handleConfirmDelete = () => {
    setOpenDialog(false);
    onConfirmDelete();
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
          title="Información del Punto"
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
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <strong>Coordenadas:</strong>
            <div>Latitud: {point.lat.toFixed(6)}</div>
            <div>Longitud: {point.lng.toFixed(6)}</div>
          </Box>
          {/* Aquí se agregarán los campos del formulario más adelante */}
          <Box sx={{ mt: 2 }}>
            <em>Los campos del formulario se agregarán aquí...</em>
          </Box>
        </CardContent>
      </Card>

      <CancelDialog
        open={openDialog}
        onClose={handleCancelDialog}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
};

export default PointForm;

