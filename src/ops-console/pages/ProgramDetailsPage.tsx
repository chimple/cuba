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
import { PAGES, PROGRAM_TAB, PROGRAM_TAB_LABELS } from "../../common/constants";
import { BsFillBellFill } from "react-icons/bs";
import ProgramConnectedSchoolPage from "./ProgramConnectedSchoolPageOps";

interface ProgramDetailComponentProps {
  id: string;
}

interface ProgramStats {
  total_students: number;
  total_teachers: number;
  total_schools: number;
  active_student_percentage: number;
  active_teacher_percentage: number;
  avg_weekly_time_minutes: number;
}

interface ProgramData {
  programDetails: { label: string; value: string }[];
  locationDetails: { label: string; value: string }[];
  partnerDetails: { label: string; value: string }[];
  programManagers: { name: string; role: string; phone: string }[];
}

const formatProgramModel = (value: string) => {
  try {
    return JSON.parse(value)
      .map(
        (k: string) => PROGRAM_TAB_LABELS[k as keyof typeof PROGRAM_TAB_LABELS]
      )
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
    total_teachers: 0,
    total_schools: 0,
    active_student_percentage: 0,
    active_teacher_percentage: 0,
    avg_weekly_time_minutes: 0,
  });
  const [renderDetails, setRenderDetails] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      const programData = await api.getProgramData(id);
      if (!programData) {
        setLoading(false);
        return;
      }
      const result = await api.program_activity_stats(id);
      const countStats = Array.isArray(result) ? result[0] : result;

      setStats({
        total_students: countStats.total_students ?? 0,
        total_teachers: countStats.total_teachers ?? 0,
        total_schools: countStats.total_schools ?? 0,
        active_student_percentage: countStats.active_student_percentage ?? 0,
        active_teacher_percentage: countStats.active_teacher_percentage ?? 0,
        avg_weekly_time_minutes: countStats.avg_weekly_time_minutes ?? 0,
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

  if (renderDetails) {
    return <ProgramConnectedSchoolPage id={id} />;
  }

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
        <div className="program-detail-page-header-title">
          {data.programDetails.find((d) => d.label === "Program Name")?.value}
        </div>
        <IconButton
          className="program-detail-page-header-icon"
          sx={{ color: "black" }}
        >
          <BsFillBellFill />
        </IconButton>
      </div>

      <Box className="program-detail-page-Breadcrumb-padding">
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
          <Grid size={{ xs: 12, md: 4 }} order={{ xs: 2, md: 1 }}>
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
          <Grid size={{ xs: 12, md: 4 }} order={{ xs: 3, md: 2 }}>
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
          <Grid size={{ xs: 12, md: 4 }} order={{ xs: 1, md: 3 }}>
            <Box className="program-detail-page-column-container">
              <InfoCard title={t("Program Performance")} items={[]}>
                <Box
                  className="program-performance-card"
                  sx={{
                    p: 2,
                  }}
                >
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>{t("Active Students")}</Typography>
                    <Typography fontWeight="bold">
                      {`${stats.active_student_percentage.toFixed(2)}%`}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>{t("Avg week time in mins")}</Typography>
                    <Typography fontWeight="bold">
                      {`${stats.avg_weekly_time_minutes.toFixed(2)}`}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography>{t("Active Teachers")}</Typography>
                    <Typography fontWeight="bold">
                      {`${stats.active_teacher_percentage.toFixed(2)}%`}
                    </Typography>
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
                    mb: 2,
                  }}
                >
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>{t("No. of Schools")}</Typography>
                    <Typography fontWeight="bold">
                      {stats.total_schools}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>{t("No. of Students")}</Typography>
                    <Typography fontWeight="bold">
                      {stats.total_students}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography>{t("No. of Teachers")}</Typography>
                    <Typography fontWeight="bold">
                      {stats.total_teachers}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() =>
                      history.push(
                        `${PAGES.SIDEBAR_PAGE}${PAGES.PROGRAM_PAGE}${PAGES.PROGRAM_DETAIL_PAGE}${PAGES.PROGRAM_CONNECTED_SCHOOL_LIST_PAGE_OPS}/${id}`
                      )
                    }
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
