import React from "react";
import Grid from "@mui/material/Grid";
import "./SchoolOverview.css";
import { Box, Button, Divider, Typography } from "@mui/material";
import "./SchoolInfoCard.css";
import { t } from "i18next";
import InfoCard from "../InfoCard";
import DetailItem from "../DetailItem";
import ContactCard from "../ContactCard";
import { BsBoxArrowUpRight } from "react-icons/bs";

interface SchoolOverviewProps {
  data: any;
  isMobile: boolean;
}

const SchoolOverview: React.FC<SchoolOverviewProps> = ({ data, isMobile }) => {
  // school details
  const schoolDetailsItems = [
    { label: "School Name", value: data.schoolData?.name },
    { label: "School ID (UDISE)", value: data.schoolData?.udise },
    { label: "State", value: data.schoolData?.group1 },
    { label: "District", value: data.schoolData?.group2 },
    { label: "Cluster", value: data.schoolData?.group3 },
    { label: "Block", value: data.schoolData?.group4 },
  ].filter((item) => item.value !== undefined && item.value !== null);

  // school address details
  const schooladdressDetailsItems = [
    { label: "Full Address", value: data.schoolData?.address },
  ].filter((item) => item.value !== undefined && item.value !== null);

  // program details
  const programDetailsItems = [
    { label: "Program Name", value: data.programData?.name },
    {
      label: "Program Type",
      value: data.programData?.program_type
        ? data.programData.program_type.trim().charAt(0).toUpperCase() +
          data.programData.program_type.trim().slice(1).toLowerCase()
        : "",
    },
    {
      label: "Model",
      value: Array.isArray(data.programData?.model)
        ? data.programData.model
            .map((m: string) => m.replace(/_/g, " ").toUpperCase())
            .join(", ")
        : data.programData?.model?.replace(/_/g, " ").toUpperCase(),
    },
  ].filter((item) => item.value !== undefined && item.value !== null);
  const [programName, programType, model] = programDetailsItems;

  //school performance
  const schoolPerformanceItems = [
    { label: "Active Students", value: "85%" },
    { label: "Avg week time in mins", value: "14 mins" },
    { label: "Active Teachers", value: "78%" },
  ].filter((item) => item.value !== undefined && item.value !== null);

  return (
    <div className="school">
      {isMobile ? (
        <Box className="column-container">
          <InfoCard
            title={t("School Performance")}
            className="performance-card"
          >
            <Box className="info-card-items">
              {schoolPerformanceItems.map((item, idx) => (
                <Box
                  key={idx}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="subtitle2">{t(item.label)}</Typography>
                  <Typography variant="body1">{item.value}</Typography>
                </Box>
              ))}
            </Box>
            <Button
              fullWidth
              className="full-width-button"
              variant="contained"
              sx={{ mt: 2 }}
            >
              {t("View Detailed Analytics")}
            </Button>
          </InfoCard>
          <InfoCard
            title={t("Key Contacts")}
            children={
              <Box className="principal-list">
                {data.principals?.map((principal, idx) => (
                  <ContactCard
                    key={idx}
                    name={principal.name}
                    role={"Principal"}
                    phone={principal.phone || principal.email}
                  />
                ))}
                {data.coordinators?.map((coordinator, idx) => (
                  <ContactCard
                    key={idx}
                    name={coordinator.name}
                    role={"Coordinator"}
                    phone={coordinator.phone || coordinator.email}
                  />
                ))}
              </Box>
            }
          />
          <InfoCard
            title={t("School Details")}
            className="school-detail-infocard school-card"
            items={schoolDetailsItems}
          />
          <Box position="relative" width="100%">
            <InfoCard title={t("Address & Location")} className="address-card">
              <Box>
                {schooladdressDetailsItems.map((item, idx) => (
                  <Box key={idx} mb={2}>
                    <Typography variant="caption" color="text.secondary">
                      {t(item.label)}
                    </Typography>
                    <Typography variant="body2" align="left">
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box
                style={{
                  position: "absolute",
                  top: 20,
                  right: 24,
                  zIndex: 2,
                }}
              >
                <BsBoxArrowUpRight
                  style={{ fontSize: 18, cursor: "pointer" }}
                />
              </Box>
            </InfoCard>
          </Box>
          <InfoCard title={t("Program Details")} className="program-card">
            <Box className="info-card-items">
              {programDetailsItems.map((item, idx) => (
                <DetailItem key={idx} {...item} />
              ))}
            </Box>
            <Divider className="info-card-section-divider" />
            <Box mt={2}>
              <Typography
                variant="subtitle1"
                className="info-card-section-title"
                gutterBottom
                align="left"
                fontWeight={500}
              >
                {t("Program Manager")}
              </Typography>
              <Box>
                {data.programManagers?.map((manager, idx) => (
                  <ContactCard
                    key={idx}
                    name={manager.name}
                    role={manager.role || t("Program Manager")}
                    phone={manager.phone || manager.email}
                  />
                ))}
              </Box>
            </Box>
          </InfoCard>
        </Box>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box className="column-container">
              <InfoCard
                title={t("School Details")}
                className="school-detail-infocard school-card"
                items={schoolDetailsItems}
              />
              <Box position="relative" width="100%">
                <InfoCard
                  title={t("Address & Location")}
                  className="address-card"
                >
                  <Box>
                    {schooladdressDetailsItems.map((item, idx) => (
                      <Box key={idx} mb={2}>
                        <Typography variant="caption" color="text.secondary">
                          {t(item.label)}
                        </Typography>
                        <Typography variant="body2" align="left">
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box
                    style={{
                      position: "absolute",
                      top: 20,
                      right: 24,
                      zIndex: 2,
                    }}
                  >
                    <BsBoxArrowUpRight
                      style={{ fontSize: 18, cursor: "pointer" }}
                    />
                  </Box>
                </InfoCard>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box className="column-container">
              <InfoCard
                title={t("Key Contacts")}
                children={
                  <Box className="principal-list">
                    {data.principals?.map((principal, idx) => (
                      <ContactCard
                        key={idx}
                        name={principal.name}
                        role={"Principal"}
                        phone={principal.phone || principal.email}
                      />
                    ))}
                    {data.coordinators?.map((coordinator, idx) => (
                      <ContactCard
                        key={idx}
                        name={coordinator.name}
                        role={"Coordinator"}
                        phone={coordinator.phone || coordinator.email}
                      />
                    ))}
                  </Box>
                }
              />
              <InfoCard title={t("Program Details")} className="program-card">
                <Box height={4} />
                <Box
                  display="flex"
                  flexDirection="row"
                  width="100%"
                  gap={4}
                  mb={2}
                >
                  <Box
                    flex={1}
                    display="flex"
                    flexDirection="column"
                    alignItems="flex-start"
                    minWidth={0}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight={500}
                      textAlign="left"
                    >
                      {t(programName?.label)}
                    </Typography>
                    <Typography
                      variant="body1"
                      gutterBottom
                      textAlign="left"
                      sx={{ wordBreak: "break-word", width: "100%" }}
                    >
                      {programName?.value}
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      fontWeight={500}
                      textAlign="left"
                    >
                      {t(programType?.label)}
                    </Typography>
                    <Typography
                      variant="body1"
                      textAlign="left"
                      sx={{ wordBreak: "break-word", width: "100%" }}
                    >
                      {programType?.value}
                    </Typography>
                  </Box>
                  <Box
                    flex={1}
                    display="flex"
                    flexDirection="column"
                    alignItems="flex-start"
                    minWidth={0}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight={500}
                      textAlign="left"
                    >
                      {t(model?.label)}
                    </Typography>
                    <Typography
                      variant="body1"
                      textAlign="left"
                      sx={{ wordBreak: "break-word", width: "100%" }}
                    >
                      {model?.value}
                    </Typography>
                  </Box>
                </Box>
                <Divider className="info-card-section-divider" />
                <Box mt={2}>
                  <Typography
                    variant="subtitle2"
                    className="info-card-section-title"
                    gutterBottom
                    align="left"
                    fontWeight={500}
                  >
                    {t("Program Manager")}
                  </Typography>
                  <Box>
                    {data.programManagers?.map((manager, idx) => (
                      <ContactCard
                        key={idx}
                        name={manager.name}
                        role={manager.role || t("Program Manager")}
                        phone={manager.phone || manager.email}
                      />
                    ))}
                  </Box>
                </Box>
              </InfoCard>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <InfoCard
              title={t("School Performance")}
              className="performance-card"
            >
              <Box className="info-card-items">
                {schoolPerformanceItems.map((item, idx) => (
                  <Box
                    key={idx}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography variant="subtitle2">{t(item.label)}</Typography>
                    <Typography variant="body1">{item.value}</Typography>
                  </Box>
                ))}
              </Box>
              <Button
                fullWidth
                className="full-width-button"
                variant="contained"
                sx={{ mt: 2 }}
              >
                {t("View Detailed Analytics")}
              </Button>
            </InfoCard>
          </Grid>
        </Grid>
      )}
    </div>
  );
};

export default SchoolOverview;
