import React, { useEffect, useState } from "react";
import { Box, Grid, Typography, Button, CircularProgress } from "@mui/material";
import InfoCard from "../components/InfoCard";
import { useHistory, useParams } from "react-router-dom";
import "./ProgramDetailsPage.css";
import Breadcrumb from "../components/Breadcrumb";
import ContactCard from "../components/ContactCard";

interface RouteParams {
  programId: string;
}

interface ProgramData {
  programDetails: { label: string; value: string }[];
  locationDetails: { label: string; value: string }[];
  performance: { label: string; value: string }[];
  partnerDetails: { label: string; value: string }[];
  programManagers: { name: string; role: string; phone: string }[];
  statistics: { label: string; value: string }[];
}

const mockProgramData: ProgramData = {
  programDetails: [
    { label: "Program Name", value: "XYZ Program" },
    { label: "Program Type", value: "Learning Centers" },
    { label: "Program Model", value: "At Home" },
    {label: "Program Date", value: "April 15, 2025 December 20, 2025"},
  ],
  locationDetails: [
    { label: "Country", value: "India" },
    { label: "State", value: "Uttar Pradesh" },
    { label: "District", value: "Buddha Nagar" },
    { label: "Cluster", value: "Noida-East" },
    { label: "Block", value: "Noida" },
    { label: "Village", value: "Uttaranchal" },
  ],
  performance: [
    { label: "Completion Rate", value: "85%" },
    { label: "Satisfaction", value: "90%" },
  ],
  partnerDetails: [
    { label: "Implementation Partner", value: "Educational Initiatives" },
    { label: "Funding Partner", value: "Global Education Fund" },
    { label: "Institute Owner", value: "Ministry of Education" },
  ],
  programManagers: [
    { name: "Alice Johnson", role: "Lead Manager", phone: "+91 9876543210" },
    { name: "Bob Smith", role: "Assistant Manager", phone: "+91 8765432109" },
  ],
  statistics: [
    { label: "Participants", value: "150" },
    { label: "Events", value: "20" },
  ],
};

const ProgramDetailsPage = () => {
  const history = useHistory();
  const { programId } = useParams<RouteParams>();
  const [data, setData] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setData(mockProgramData);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [programId]);

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box className="error-container">
        <Typography variant="h6">Failed to load program data.</Typography>
      </Box>
    );
  }

  return (
    <div className="program-details-page">
      <div className="program-detail-page-header">
        {mockProgramData.programDetails.find((d) => d.label === "Program Name")?.value}
      </div>
      <Box className="page-padding">
        <Breadcrumb
          crumbs={[
            { label: "Programs", onClick: () => history.goBack() },
            { label: "XYZ Program" },
          ]}
        />

        <Grid container spacing={2}>
          {/* Column 1 */}
          <Grid item xs={12} md={4}>
            <Box className="column-container">
              <InfoCard title="Program Details" items={data.programDetails} />
              <InfoCard title="Partner Details" items={data.partnerDetails} />
            </Box>
          </Grid>

          {/* Column 2 */}
          <Grid item xs={12} md={4}>
            <Box className="column-container">
              <InfoCard
                title="Location Details"
                content={
                  <Box className="location-details-grid">
                    {data.locationDetails.map((item, idx) => (
                      <Box key={idx} className="location-details-item">
                        <Typography className="location-details-label">{item.label}</Typography>
                        <Typography className="location-details-value">{item.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                }
              />
              <InfoCard
                title="Program Managers"
                content={
                  <Box className="managers-list">
                    {data.programManagers.map((manager, idx) => (
                      <ContactCard
                        key={idx}
                        name={manager.name}
                        role={manager.role}
                        phone={manager.phone}
                      />
                    ))}
                  </Box>
                }
              />
            </Box>
          </Grid>

          {/* Column 3 */}
          <Grid item xs={12} md={4}>
            <Box className="column-container">
              <InfoCard title="Program Performance" items={[]}>
                <Button fullWidth className="full-width-button" variant="contained">
                  View Detailed Analytics
                </Button>
              </InfoCard>
              <InfoCard title="Program Statistics" items={[]}>
                <Button fullWidth className="full-width-button" variant="contained">
                  View Details
                </Button>
              </InfoCard>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default ProgramDetailsPage;
