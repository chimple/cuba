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

interface ProgramStats {
  total_students: number;
  active_students: number;
  avg_time_spent: number;
  active_teachers: number;
  total_institutes: number;
  total_teachers: number;
}

const ProgramDetailsPage = () => {
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const { programId } = useParams<RouteParams>();
  const [data, setData] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProgramStats>({
    total_students: 0,
    active_students: 0,
    avg_time_spent: 0,
    active_teachers: 0,
    total_institutes: 0,
    total_teachers: 0,
  });

  useEffect(() => {
    if (!programId) return;

    const fetchData = async () => {
      setLoading(true);
      const programData = await api.getProgramData(programId);
      console.log("Fetched program data:", programData);

      const countStats = await api.countProgramStats(programId);
      console.log("Fetched Stats For Program: ", countStats);

      setData(programData);
      setStats({
        total_students: countStats.total_students,
        active_students: countStats.active_students,
        avg_time_spent: countStats.avg_time_spent || 0, // default to 0 if undefined
        active_teachers: countStats.active_teachers,
        total_institutes: countStats.total_institutes,
        total_teachers: countStats.total_teachers || 0,
      });
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
      <Box className="program-detail-page-error-container">
        <Typography variant="h6">Failed to load program data.</Typography>
      </Box>
    );
  }

  return (
    <div className="program-detail-page">
      <div className="program-detail-page-header">
        {data.programDetails.find((d) => d.label === "Program Name")?.value}
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
                      <Box key={idx} className="program-detail-page-location-details-item">
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
                <Box
                  className="program-performance-card"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    boxShadow: 1,
                    border: "1px solid #eee",
                  }}
                >
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>{t("Active Students")}</Typography>
                    <Typography fontWeight="bold">{`${(stats.active_students/stats.total_students)*100}%`}</Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>{t("Avg week time in mins")}</Typography>
                    <Typography fontWeight="bold">{`${stats.avg_time_spent/60} mins`}</Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography>{t("Active Teachers")}</Typography>
                    <Typography fontWeight="bold">{`${(stats.active_teachers/stats.total_teachers)*100}%`}</Typography>
                  </Box>

                  <Button variant="contained" fullWidth>
                    {t("View Detailed Analytics")}
                  </Button>
                </Box>
              </InfoCard>
              <InfoCard title={t("Program Statistics")} items={[]}>
                <Box
                  className="program-detail-page-stats"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    boxShadow: 1,
                    border: "1px solid #eee",
                    mb: 2,
                  }}
                >
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>{t("No of Institutes")}</Typography>
                    <Typography fontWeight="bold">
                      {stats.total_institutes}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>{t("No of Students")}</Typography>
                    <Typography fontWeight="bold">
                      {stats.total_students}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography>{t("No of Teachers")}</Typography>
                    <Typography fontWeight="bold">
                      {stats.total_teachers}
                    </Typography>
                  </Box>
                  <Button variant="contained" fullWidth>
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
