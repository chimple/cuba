import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  CircularProgress,
  IconButton,
} from "@mui/material";
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

interface ProgramStats {
  total_students: number;
  active_students: number;
  avg_time_spent: number;
  active_teachers: number;
  total_institutes: number;
  total_teachers: number;
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

const ProgramDetailsPage: React.FC<ProgramDetailComponentProps> = ({ id }) => {
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  
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
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      const programData = await api.getProgramData(id);
      if (!programData) {
        setLoading(false);
        return;
      }
      const result = await api.countProgramStats(id);
      const countStats = Array.isArray(result) ? result[0] : result;

      setStats({
        total_students: countStats.total_students ?? 0,
        active_students: countStats.active_students ?? 0,
        avg_time_spent: countStats.avg_time_spent ?? 0,
        total_teachers: countStats.total_teachers ?? 0,
        active_teachers: countStats.active_teachers ?? 0,
        total_institutes: countStats.total_institutes ?? 0,
      });

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
        <IconButton sx={{ color: "black" }}>
          <BsFillBellFill />
        </IconButton>
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
              <InfoCard
                title={t("Program Details")}
                items={data.programDetails}
              />
              <InfoCard
                title={t("Partner Details")}
                items={data.partnerDetails}
              />
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
                    <Typography fontWeight="bold">{stats.total_students > 0 ? `${((stats.active_students / stats.total_students) * 100).toFixed(2)}%` : "0.00%"}</Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>{t("Avg week time in mins")}</Typography>
                    <Typography fontWeight="bold">{`${stats.avg_time_spent / 60} mins`}</Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography>{t("Active Teachers")}</Typography>
                    <Typography fontWeight="bold">{stats.active_teachers > 0 ? `${((stats.active_teachers / stats.total_teachers) * 100).toFixed(2)}%` : "0.00%"}</Typography>
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
