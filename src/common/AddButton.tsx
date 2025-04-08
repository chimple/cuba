import React from "react";
import { Fab } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import "./AddButton.css";

const AddButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const fabGreenStyle = {
    color: "white",
    bgcolor: "#7c5db0",
    position: "fixed",
    bottom: "25px",
    right: "25px",
    zIndex: "1000",
    "&:hover": {
      transform: "scale(1.1)",
      bgcolor: "#7c5db0",
    },
  };
  return (
    <Fab
      aria-label="Add"
      className="custom-fab"
      onClick={onClick}
      sx={fabGreenStyle}
    >
      <AddIcon />
    </Fab>
  );
};

export default AddButton;
