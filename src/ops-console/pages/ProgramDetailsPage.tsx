import React, { useEffect, useState } from "react";
import { Box, Grid, Typography, Button, CircularProgress } from "@mui/material";
import InfoCard from "../components/InfoCard";
import { useHistory, useParams } from "react-router-dom";
import "./ProgramDetailsPage.css";
import Breadcrumb from "../components/Breadcrumb";
import ContactCard from "../components/ContactCard";
import { ServiceConfig } from "../../services/ServiceConfig";
import { t } from "i18next";

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
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
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
            { label: t("Programs"), onClick: () => history.goBack() },
            { label: data?.programDetails.find(d => d.label === "Program Name")?.value ?? "" },
          ]}
        />

        <Grid container spacing={2}>
          {/* Column 1 */}
          <Grid item xs={12} md={4}>
            <Box className="column-container">
              <InfoCard title={t("Program Details")} items={data.programDetails} />
              <InfoCard title={t("Partner Details")} items={data.partnerDetails} />
            </Box>
          </Grid>

          {/* Column 2 */}
          <Grid item xs={12} md={4}>
            <Box className="column-container">
              <InfoCard
                title={t("Location Details")}
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
                title= {t("Program Managers")}
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
              <InfoCard title={t("Program Performance")} items={[]}>
                <Box display="flex" justifyContent="center" >
                  <Button className="full-width-button" variant="contained">
                    {t("View Detailed Analytics")}
                  </Button>
                </Box>
              </InfoCard>
              <InfoCard title={t("Program Statistics")} items={[]}>
                <Box display="flex" justifyContent="center" >
                  <Button className="full-width-button" variant="contained">
                    {t("View Details")}
                  </Button>
                </Box>
              </InfoCard>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default ProgramDetailsPage;
