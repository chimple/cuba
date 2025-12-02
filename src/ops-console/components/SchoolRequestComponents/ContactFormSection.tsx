import React from "react";
import { Box, Grid, TextField, Typography } from "@mui/material";
interface ContactFieldItem {
  label: string;
  name: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

interface ContactField {
  subheader: string;
  required?: boolean;
  fields: ContactFieldItem[];
}

interface ContactFormSectionProps {
  title: string;
  fields: ContactField[];
  onChange?: (contactIndex: number, fieldName: string, value: string) => void;
}

const ContactFormSection: React.FC<ContactFormSectionProps> = ({
  title,
  fields,
  onChange,
}) => {
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

      <Grid container spacing={3}>
        {fields.map((contact, index) => (
          <Grid size={{ xs: 12, md: 6 }} key={index}>
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              sx={{
                fontSize: "1rem",
                mb: 1,
                color: "#111827",
                textAlign: "left",
              }}
            >
              {contact.subheader} {contact.required ? <span style={{ color: "red" }}>*</span> : ""}
            </Typography>

            <Grid container spacing={2}>
              {contact.fields.map((field, idx) => (
                <Grid size={{ xs: 12 }} key={idx}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "1rem",
                      fontWeight: 500,
                      mb: 0.5,
                      color: "#111827",
                      textAlign: "left",
                    }}
                  >
                    {field.label}
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder={field.placeholder}
                    value={field.value || ""}
                    onChange={(e) => {
                      let val = e.target.value;

                      if (field.name.toLowerCase().includes("phone")) {
                        val = val.replace(/\D/g, ""); // only digits
                        if (val.length > 10) val = val.slice(0, 10); // restrict to 10 digits
                      }

                      onChange?.(index, field.name, val);
                    }}
                    size="small"
                    variant="outlined"
                    error={
                      field.name.toLowerCase().includes("phone") &&
                      field.value !== undefined &&
                      field.value.length > 0 &&
                      field.value.length < 10
                    }
                    helperText={
                      field.name.toLowerCase().includes("phone") &&
                      field.value !== undefined &&
                      field.value.length > 0 &&
                      field.value.length < 10
                        ? "Phone number must be 10 digits"
                        : ""
                    }
                    inputProps={
                      field.name.toLowerCase().includes("phone")
                        ? {
                            inputMode: "numeric",
                            maxLength: 10,
                          }
                        : {}
                    }
                    InputProps={{
                      sx: {
                        backgroundColor: "#fff",
                        borderRadius: "6px",
                        fontSize: "1rem",
                      },
                    }}
                    disabled={field.disabled}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
export default ContactFormSection;
