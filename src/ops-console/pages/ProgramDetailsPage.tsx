import React, { useEffect, useState } from "react";
import { Box, Grid, Typography, Button, CircularProgress, IconButton } from "@mui/material";
import InfoCard from "../components/InfoCard";
import { useHistory, useParams } from "react-router-dom";
import "./ProgramDetailsPage.css";
import Breadcrumb from "../components/Breadcrumb";
import ContactCard from "../components/ContactCard";
import { ServiceConfig } from "../../services/ServiceConfig";
import { t } from "i18next";
import { PROGRAM_TAB, PROGRAM_TAB_LABELS } from "../../common/constants";
import { BsFillBellFill } from "react-icons/bs";

interface ProgramDetailComponentProps {
  id: string;
}

interface ProgramData {
  programDetails: { label: string; value: string }[];
  locationDetails: { label: string; value: string }[];
  partnerDetails: { label: string; value: string }[];
  programManagers: { name: string; role: string; phone: string }[];
}

const formatProgramModel = (value: string) => {
  try {
    const arr = JSON.parse(value.replace(/'/g, '"')) as string[];
    return arr
      .map((m) => PROGRAM_TAB_LABELS[m as PROGRAM_TAB])
      .filter(Boolean)
      .join(", ");
  } catch {
    return "";
  }
};

const formatProgramDate = (value: string) => {
  const [start, end] = value.split(/\s+/);
  if (!start || !end) return value;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  return `${formatDate(start)} - ${formatDate(end)}`;
};

const ProgramDetailsPage : React.FC<ProgramDetailComponentProps> = ({ id })=> {
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const [data, setData] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      const programData = await api.getProgramData(id);
      if (!programData) {
        setLoading(false);
        return;
      }

      const updatedProgramDetails = programData.programDetails.map((item) => {
        if (item.id === "program_model")
          return { ...item, value: formatProgramModel(item.value) };
        if (item.id === "program_date")
          return { ...item, value: formatProgramDate(item.value) };
        return item;
      });

      setData({ ...programData, programDetails: updatedProgramDetails });
      setLoading(false);
    };

    fetchData();
  }, [id]);

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
      <Box className="program-detail-page-error-container">
        <Typography variant="h6">Failed to load program data.</Typography>
      </Box>
    );
  }

  return (
    <div className="program-detail-page">
      <div className="program-detail-page-header">
        {data.programDetails.find((d) => d.label === "Program Name")?.value}
        <IconButton sx={{color: "black"}}><BsFillBellFill/></IconButton>
      </div>
      <Box className="program-detail-page-padding">
        <Breadcrumb
          crumbs={[
            { label: t("Programs"), onClick: () => history.goBack() },
            {
              label:
                data?.programDetails.find((d) => d.label === "Program Name")
                  ?.value ?? "",
            },
          ]}
        />

        <Grid container spacing={2}>
          {/* Column 1 */}
          <Grid item xs={12} md={4}>
            <Box className="program-detail-page-column-container">
              <InfoCard title={t("Program Details")} items={data.programDetails} />
              <InfoCard title={t("Partner Details")} items={data.partnerDetails} />
            </Box>
          </Grid>

          {/* Column 2 */}
          <Grid item xs={12} md={4}>
            <Box className="program-detail-page-column-container">
              <InfoCard
                title={t("Location Details")}
                children={
                  <Box className="program-detail-page-location-details-grid">
                    {data.locationDetails.map((item, idx) => (
                      <Box
                        key={idx}
                        className="program-detail-page-location-details-item"
                      >
                        <Typography className="program-detail-page-location-details-label">
                          {item.label}
                        </Typography>
                        <Typography className="program-detail-page-location-details-value">
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                }
              />
              <InfoCard
                title={t("Program Managers")}
                children={
                  <Box className="program-detail-page-managers-list">
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
            <Box className="program-detail-page-column-container">
              <InfoCard title={t("Program Performance")} items={[]}>
                <Box display="flex" justifyContent="center">
                  <Button
                    className="program-detail-page-full-width-button"
                    variant="contained"
                  >
                    {t("View Detailed Analytics")}
                  </Button>
                </Box>
              </InfoCard>
              <InfoCard title={t("Program Statistics")} items={[]}>
                <Box display="flex" justifyContent="center">
                  <Button
                    className="program-detail-page-full-width-button"
                    variant="contained"
                  >
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
