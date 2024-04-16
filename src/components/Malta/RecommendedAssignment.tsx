import { t } from "i18next";
import "./RecommendedAssignment.css";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  FormControlLabel,
  Typography,
} from "@mui/material";
import React from "react";

const RecommendedAssignment: React.FC<{}> = () => {
  const [checked, setChecked] = React.useState([true, false]);

  const handleChange1 = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked([event.target.checked, event.target.checked]);
  };

  const handleChange2 = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked([event.target.checked, event.target.checked]);
  };

  return (
    //render .map()
    <div className="display-card">
      <div style={{ fontSize: "8px" }}>
        These are the recommended assignments based on the previous assignments
      </div>
      <div className="select-all">
        <FormControlLabel
          labelPlacement="start"
          label={<Typography style={{ fontSize: 9 }}>Select All</Typography>}
          control={
            <Checkbox
              checked={checked[0]}
              onChange={handleChange1}
              size="small"
            />
          }
        />
      </div>
      <div className="recommended-content">
        <div className="recommended-subject-header">
          Subject
          <Box
            sx={{
              width: "100%",
              maxWidth: 500,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 2,
              borderRadius: 20,
            }}
          >
            <Card
              sx={{
                display: "flex",
                "& .MuiCardContent-root": {
                  width: "100vh",
                },
              }}
            >
              <CardContent>
                <Typography
                  sx={{ fontSize: 10 }}
                  color="text.secondary"
                  gutterBottom
                >
                  Chapter : Chapter name
                </Typography>
                <div>
                  <FormControlLabel
                    labelPlacement="start"
                    label={
                      <Typography style={{ fontSize: 9 }}>Lesson 1</Typography>
                    }
                    control={
                      <Checkbox
                        checked={checked[0]}
                        onChange={handleChange1}
                        size="small"
                      />
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </Box>
        </div>
      </div>
    </div>
  );
};
export default RecommendedAssignment;
