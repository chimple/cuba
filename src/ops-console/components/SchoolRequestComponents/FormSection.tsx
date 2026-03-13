import React from "react";
import { Box, Grid, TextField, Typography, FormLabel } from "@mui/material";

interface Field {
  label: string;
  name: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  editable?: boolean;
  onChange?: (name: string, value: string) => void;
}

interface FormSectionProps {
  title: string;
  fields: Field[];
}

const FormSection: React.FC<FormSectionProps> = ({ title, fields }) => {
  return (
    <Box
      sx={{
        borderRadius: "8px",
        padding: "10px",
        marginBottom: "20px",
        backgroundColor: "#f9fbfd",
      }}
    >
      <Typography
        variant="subtitle2"
        fontWeight="bold"
        sx={{ marginBottom: "16px", fontSize: "1rem", color: "#111827" }}
      >
        {title}
      </Typography>

      <Grid container spacing={2}>
        {fields.map((field, index) => (
          <Grid size={{ xs: 12, md: 6 }} key={index}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <FormLabel
                sx={{ fontSize: "1rem", color: "#111827", fontWeight: 500 }}
              >
                {field.label} {field.required ? "*" : ""}
              </FormLabel>
              <TextField
                fullWidth
                placeholder={field.placeholder}
                value={field.value || ""}
                onChange={(e) => field.onChange?.(field.name, e.target.value)}
                variant="outlined"
                size="small"
                disabled={field.editable === false}
                InputProps={{
                  sx: {
                    backgroundColor: "#fff",
                    borderRadius: "6px",
                    fontSize: "1rem",
                  },
                }}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FormSection;
