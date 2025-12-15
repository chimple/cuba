import React from "react";
import Grid from "@mui/material/Grid";
import "./SchoolOverview.css";
import { Box, Button, Divider, Typography } from "@mui/material";
import "./SchoolInfoCard.css";
import { t } from "i18next";
import InfoCard from "../InfoCard";
import DetailItem from "../DetailItem";
import ContactCard from "../ContactCard";
import {
  PAGES,
  PROGRAM_TAB_LABELS,
  USER_ROLE,
} from "../../../common/constants";
import { useHistory } from "react-router";
import { RoleType } from "../../../interface/modelInterfaces";

interface SchoolOverviewProps {
  data: any;
  isMobile: boolean;
}

const SchoolOverview: React.FC<SchoolOverviewProps> = ({ data, isMobile }) => {
  // school details
  const formatModel = (raw: any) => {
    if (!raw) return "";
    let arr: string[] = [];
    try {
      arr = Array.isArray(raw) ? raw : JSON.parse(raw);
    } catch {
      arr = [String(raw)];
    }
    return arr
      .map(
        (v: string) =>
          PROGRAM_TAB_LABELS?.[v.toLowerCase().replace(/ /g, "_")] ||
          v
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
      )
      .join(", ");
  };
  const schoolModelValue = formatModel(data.schoolData?.model || "");

  const schoolDetailsItems = [
    { label: "School Name", value: data.schoolData?.name },
    { label: "School ID (UDISE)", value: data.schoolData?.udise },
    { label: "School Model", value: schoolModelValue },
    { label: "State", value: data.schoolData?.group1 },
    { label: "District", value: data.schoolData?.group2 },
    { label: "Block", value: data.schoolData?.group3 },
    { label: "Cluster", value: data.schoolData?.group4 },
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
      value: (() => {
        const raw = data.programData?.model;
        if (!raw) return "";
        let arr: string[] = [];
        try {
          arr = Array.isArray(raw) ? raw : JSON.parse(raw);
        } catch {
          return "";
        }
        return arr
          .map(
            (v: string) =>
              PROGRAM_TAB_LABELS?.[v.toLowerCase().replace(/ /g, "_")] ||
              v
                .toLowerCase()
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())
          )
          .join(", ");
      })(),
    },
  ].filter((item) => item.value !== undefined && item.value !== null);
  const [programName, programType, model] = programDetailsItems;

  //school performance
  const activeStudents =
    data.schoolStats?.active_student_percentage?.toFixed(2) ?? "0.00";
  const avgWeekTime =
    data.schoolStats?.avg_weekly_time_minutes?.toFixed(2) ?? "0.00";
  const activeTeachers =
    data.schoolStats?.active_teacher_percentage?.toFixed(2) ?? "0.00";

  const interactionItems = [
    { label: "Number of Visits", value: data.interactionStats?.visits ?? 0 },
    {
      label: "Number of Calls Made",
      value: data.interactionStats?.calls_made ?? 0,
    },
    {
      label: "Tech Issues Reported",
      value: data.interactionStats?.tech_issues ?? 0 ,
    },
    {
      label: "Parents Interacted",
      value: data.interactionStats?.parents_interacted ?? 0,
    },
    {
      label: "Students Interacted",
      value: data.interactionStats?.students_interacted ?? 0,
    },
    {
      label: "Teachers Interacted",
      value: data.interactionStats?.teachers_interacted ?? 0,
    },
  ];

  const InteractionMetricsSection = () => (
    <InfoCard
      title={t("Interaction Metrics")}
      className="interaction-card"
      hideDivider={true}
      headerAction={
        !isMobile ? (
          <Button
            size="small"
            variant="outlined"
            className="view-all-interactions-btn"
            sx={{ textTransform: "none" }}
            onClick={() =>
              history.replace(
                `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.ACTIVITIES_PAGE}`,
                data.schoolData
              )
            }
          >
            {t("View All Interactions")}
          </Button>
        ) : undefined
      }
    >
      <Grid container spacing={2} mt={0.5}>
        {interactionItems.map((item, idx) => (
          <Grid key={idx} size={{ xs: 6, sm: 6, md: 4 }}>
            <Box className="interaction-item">
              <Typography
                variant="body2"
                color="text.secondary"
                className="interaction-item-label"
              >
                {t(item.label)}
              </Typography>
              <Typography variant="h4" fontWeight="700" color="text.primary">
                {item.value}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      {isMobile && (
        <Button
          fullWidth
          size="small"
          className="full-width-button"
          variant="outlined"
          sx={{ mt: 2, textTransform: "none" }}
          onClick={() =>
            history.replace(
              `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.ACTIVITIES_PAGE}`,
              data.schoolData
            )
          }
        >
          {t("View All Interactions")}
        </Button>
      )}
    </InfoCard>
  );

  const schoolPerformanceItems = [
    { label: "Active Students", value: `${activeStudents}%` },
    { label: "Avg week time in mins", value: `${avgWeekTime} mins` },
    { label: "Active Teachers", value: `${activeTeachers}%` },
  ].filter((item) => item.value !== undefined && item.value !== null);

  const history = useHistory();
  let keyContacts: Array<any> = [];
  const rawKeyContacts = data?.schoolData?.key_contacts;
  if (rawKeyContacts) {
    try {
      keyContacts =
        typeof rawKeyContacts === "string"
          ? JSON.parse(rawKeyContacts)
          : rawKeyContacts;
      if (!Array.isArray(keyContacts)) keyContacts = [];
    } catch (e) {
      keyContacts = [];
    }
  }

  const userRoles = JSON.parse(localStorage.getItem(USER_ROLE) || "[]");
  const rolesWithAccess = [
    RoleType.SUPER_ADMIN,
    RoleType.OPERATIONAL_DIRECTOR,
    RoleType.PROGRAM_MANAGER,
  ];
  const haveAccess = userRoles.some((role) =>
    rolesWithAccess.includes(role as RoleType)
  );

  return (
    <div className="school">
      {isMobile ? (
        <Box className="column-container">
          <InteractionMetricsSection />
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
              size="small"
              className="full-width-button"
              variant="outlined"
              sx={{ mt: 2, textTransform: "none" }}
            >
              {t("View Detailed Analytics")}
            </Button>
          </InfoCard>
          <InfoCard
            title={t("Key Contacts")}
            children={
              <Box className="principal-list">
                {(() => {
                  const contactsToShow =
                    keyContacts && keyContacts.length
                      ? keyContacts.map((c: any) => ({
                          name: c.name,
                          phone: c.phone || c.email,
                          role: c.role || t("Key Contact"),
                        }))
                      : [
                          ...(data.principals?.map((p: any) => ({
                            name: p.name,
                            phone: p.phone || p.email,
                            role: t("Principal"),
                          })) || []),
                          ...(data.coordinators?.map((c: any) => ({
                            name: c.name,
                            phone: c.phone || c.email,
                            role: t("Coordinator"),
                          })) || []),
                        ];

                  return contactsToShow.map((contact: any, idx: number) => (
                    <ContactCard
                      key={idx}
                      name={contact.name}
                      role={contact.role}
                      phone={contact.phone}
                    />
                  ));
                })()}
              </Box>
            }
          />
          <InfoCard
            title={t("School Details")}
            className="school-detail-infocard school-card"
            items={schoolDetailsItems}
            showEditIcon={haveAccess}
            onEditClick={() =>
              history.replace(
                `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.ADD_SCHOOL_PAGE}`,
                data
              )
            }
          />
          {/* <Box position="relative" width="100%">
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
          </Box> */}
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
          <Grid size={{ xs: 12, md: 8 }}>
            <Box className="column-container">
              <InteractionMetricsSection />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
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
                size="small"
                className="full-width-button"
                variant="outlined"
                sx={{ mt: 2, textTransform: "none" }}
              >
                {t("View Detailed Analytics")}
              </Button>
            </InfoCard>
          </Grid>

          <Grid size={{ xs: 12, md: 12 }}>
            <Box sx={{ height: 5, width: "100%" }} />
          </Grid>

          {/* Second row - School Details, Key Contacts, Program Details */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box className="column-container">
              <InfoCard
                title={t("School Details")}
                className="school-detail-infocard school-card"
                items={schoolDetailsItems}
                showEditIcon={haveAccess}
                onEditClick={() =>
                  history.replace(
                    `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.ADD_SCHOOL_PAGE}`,
                    data
                  )
                }
              />
              {/* <Box position="relative" width="100%">
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
              </Box> */}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box className="column-container">
              <InfoCard
                title={t("Key Contacts")}
                children={
                  <Box className="principal-list">
                    {(() => {
                      const contactsToShow =
                        keyContacts && keyContacts.length
                          ? keyContacts.map((c: any) => ({
                              name: c.name,
                              phone: c.phone || c.email,
                              role: c.role || t("Key Contact"),
                            }))
                          : [
                              ...(data.principals?.map((p: any) => ({
                                name: p.name,
                                phone: p.phone || p.email,
                                role: t("Principal"),
                              })) || []),
                              ...(data.coordinators?.map((c: any) => ({
                                name: c.name,
                                phone: c.phone || c.email,
                                role: t("Coordinator"),
                              })) || []),
                            ];

                      return contactsToShow.map((contact: any, idx: number) => (
                        <ContactCard
                          key={idx}
                          name={contact.name}
                          role={contact.role}
                          phone={contact.phone}
                        />
                      ));
                    })()}
                  </Box>
                }
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
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
                  fontWeight={600}
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
          </Grid>
        </Grid>
      )}
    </div>
  );
};

export default SchoolOverview;
