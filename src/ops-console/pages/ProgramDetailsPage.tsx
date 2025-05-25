import React, { useEffect, useState } from "react";
import { Box, Grid, Typography, Button, CircularProgress } from "@mui/material";
import InfoCard from "../components/InfoCard";
import { useHistory, useParams } from "react-router-dom";
import "./ProgramDetailsPage.css";
import Breadcrumb from "../components/Breadcrumb";
import ContactCard from "../components/ContactCard";
import { SupabaseApi } from "../../services/api/SupabaseApi";
import { ServiceConfig } from "../../services/ServiceConfig";

interface RouteParams {
  programId: string;
}

interface ProgramData {
  programDetails: { label: string; value: string }[];
  locationDetails: { label: string; value: string }[];
  partnerDetails: { label: string; value: string }[];
  programManagers: { name: string; role: string; phone: string }[];
}

const ProgramDetailsPage = () => {
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const { programId } = useParams<RouteParams>();
  const [data, setData] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!programId) return;

    const fetchData = async () => {
      setLoading(true);
      const programData = await api.getProgramData(programId);
      console.log("Fetched program data:", programData);
      setData(programData);
      setLoading(false);
    };

    fetchData();
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
        {data.programDetails.find((d) => d.label === "Program Name")?.value}
      </div>
      <Box className="page-padding">
        <Breadcrumb
          crumbs={[
            { label: "Programs", onClick: () => history.goBack() },
            { label: data?.programDetails.find(d => d.label === "Program Name")?.value ?? "Untitled Program" },
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
                children={
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
                children={
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
