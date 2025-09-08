import { useEffect, useState } from "react";
import { Typography, Paper, Grid, Divider, Button } from "@mui/material";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { ServiceConfig } from "../../services/ServiceConfig";
import { PAGES, REQUEST_TABS, RequestTypes } from "../../common/constants";
import "./PrincipalTeacherPendingRequest.css";
import { Constants } from "../../services/database";
import OpsCustomDropdown from "../components/OpsCustomDropdown";
import { OpsUtil } from "../OpsUtility/OpsUtil";
import { t } from "i18next";

// Utility function for parsing class names (keep this as is)

const PrincipalTeacherPendingRequest = () => {
  const [gradeOptions, setGradeOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;

  const [isEditing, setIsEditing] = useState(false);
  const [editableRequestType, setEditableRequestType] = useState<
    RequestTypes | ""
  >("");
  const [roleOptions, setRoleOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [requestData, setRequestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const editClicked = async () => {
    const options = Object.values(RequestTypes).map((type) => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      value: type,
    }));
    setRoleOptions(options);
    if (requestData?.school?.id) {
      try {
        const response = await api.getClassesBySchoolId(requestData.school.id);
        const classes = Array.isArray(response) ? response : [response];
        const gradeOpts = classes.map((cls: any) => ({
          label: cls.name, // shown in dropdown
          value: cls.id, // actual value stored
        }));

        setGradeOptions(gradeOpts);
      } catch (err) {
        console.error("Error fetching classes for school:", err);
      }
    }

    setIsEditing(true); // switch to edit mode
  };

  useEffect(() => {
    async function fetchRequest() {
      setLoading(true);
      try {
        const state = location.state as { request?: any } | undefined;
        if (state?.request && state.request.request_id === id) {
          setRequestData(state.request);
        } else {
          // Fetch all types of requests to find it if not in state
          const [pendingRequests, approvedRequests, rejectedRequests] =
            await Promise.all([
              api.getOpsRequests(
                Constants.public.Enums.ops_request_status[0],
                1,
                1000
              ),
              api.getOpsRequests(
                Constants.public.Enums.ops_request_status[2],
                1,
                1000
              ),
              api.getOpsRequests(
                Constants.public.Enums.ops_request_status[1],
                1,
                1000
              ),
            ]);

          const allRequests = [
            ...(pendingRequests || []),
            ...(approvedRequests || []),
            ...(rejectedRequests || []),
          ];
          const req = allRequests.find((r: any) => r.request_id === id);

          if (req) {
            setRequestData(req);
            setRequestData(null);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    fetchRequest();
  }, [id, api, location.state]);

  const handleApproveClick = async () => {
    if (!requestData?.request_id) {
      return;
    }

    try {
      // Role: from edit mode OR existing request type
      const role: (typeof RequestTypes)[keyof typeof RequestTypes] =
        editableRequestType || requestData.request_type;

      // SchoolId and ClassId
      const schoolId = requestData?.school?.id || undefined;
      const classId = selectedGradeId || requestData?.class_id || undefined;

      // RespondedBy: whoever is logged in
      const auth = ServiceConfig.getI().authHandler;
      const user = await auth.getCurrentUser();
      if (!user?.id) {
        throw new Error("No logged-in user found. Cannot approve request.");
      }
      const respondedBy = user?.id;

      // 1. Approve request
      await api.approveOpsRequest(
        requestData.request_id,
        respondedBy, // current user who approves
        role,
        schoolId,
        classId
      );

      // 2. Add user to school or class based on request type

      if (schoolId && requestData) {
        if (request_type === RequestTypes.PRINCIPAL) {
          try {
            await api.addUserToSchool(
              schoolId,
              requestedBy, // must be of type TableTypes<"user">
              request_type
            );
          } catch (err) {
            console.error("Error adding user to school:", err);
          }
        } else if (request_type === RequestTypes.TEACHER) {
          try {
            await api.addTeacherToClass(classId, requestedBy);
          } catch (err) {
            console.error("Error adding teacher to class:", err);
          }
        } else {
          console.warn(
            "Skipping addUserToSchool/addTeacherToClass: unsupported request type"
          );
        }
      } else {
        console.warn(
          "Skipping addUserToSchool/addTeacherToClass: schoolId or requestData.user missing"
        );
      }

      // 3. Navigate
      history.push(
        `${PAGES.SIDEBAR_PAGE}${PAGES.REQUEST_LIST}?tab=${REQUEST_TABS.APPROVED}`
      );
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  // Handlers for Reject Dialog
  const handleRemoveClick = () => {};
  if (loading || !requestData)
    return (
      <div className="centered">
        <Typography>Loading...</Typography>
      </div>
    );

  const { school = {}, requestedBy = {}, request_type } = requestData;

  // Use classInfo.name if available, otherwise fallback to classInfo.standard
  const fullRequestClassName =
    requestData.classInfo?.name || `${requestData.classInfo?.standard || ""}`;

  const { grade: parsedGrade, section: parsedSection } =
    OpsUtil.parseClassName(fullRequestClassName);
  console.groupEnd();

  const navBreadcrumbs = (
    <div className="principal-teacher-pending-breadcrumbs">
      <span
        onClick={() => history.push(PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST)}
        className="principal-teacher-pending-link"
      >
        {t("Requests")}
      </span>
      <span> &gt; </span>
      <span>{t("Pending ")}</span>
      <span> &gt; </span>
      <span className="principal-teacher-pending-active">
        {t("Request ID - ")} {id}
      </span>
    </div>
  );

  return (
    <div className="principal-teacher-pending-details-layout">
      <Typography variant="h4" className="principal-teacher-pending-page-title">
        {t("Request ID - ")} {id}
      </Typography>
      {navBreadcrumbs}

      <Grid
        container
        spacing={3}
        className="principal-teacher-pending-main-content-row"
        alignItems="flex-start"
      >
        {/* Left Side Cards */}
        <Grid item xs={12} md={5} lg={4.5}>
          <Paper
            className="principal-teacher-pending-details-card"
            elevation={0}
          >
            <Typography
              variant="subtitle1"
              className="principal-teacher-pending-section-title"
            >
              {t("Request From")}
            </Typography>
            <Divider />
            <div className="principal-teacher-pending-first-pending-row">
              <span>{t("Name")}</span> <span>{requestedBy.name || "-"}</span>
            </div>
            <div className="principal-teacher-pending-first-pending-row">
              <span>{t("Phone Number")}</span>{" "}
              <span>{requestedBy.phone_number || "-"}</span>
            </div>
            <div className="principal-teacher-pending-first-pending-row">
              <span>{t("Email ID")}</span>{" "}
              <span>{requestedBy.email || "-"}</span>
            </div>
          </Paper>

          <Paper
            className="principal-teacher-pending-details-card"
            elevation={0}
          >
            <Typography
              variant="subtitle1"
              className="principal-teacher-pending-section-title"
            >
              {t("Request Details")}
            </Typography>
            <Divider />
            {isEditing ? (
              <>
                <div className="principal-teacher-pending-first-pending-row">
                  <span> {t("Role")}</span>
                  <span>
                    <OpsCustomDropdown
                      value={editableRequestType}
                      placeholder={request_type}
                      options={roleOptions}
                      onChange={(val) => {
                        setEditableRequestType(val as RequestTypes);
                        // Update requestData immediately
                        setRequestData((prev: any) => ({
                          ...prev,
                          request_type: val,
                        }));
                      }}
                    />
                  </span>
                </div>

                <div className="principal-teacher-pending-first-pending-row">
                  <span> {t("Grade")}</span>
                  <span>
                    <OpsCustomDropdown
                      placeholder={`${parsedGrade > 0 ? parsedGrade : "-"}${parsedSection ? parsedSection : ""}`}
                      value={selectedGradeId}
                      options={gradeOptions}
                      onChange={(val: string) => {
                        setSelectedGradeId(val);
                        // Update requestData immediately
                        setRequestData((prev: any) => ({
                          ...prev,
                          class_id: val,
                        }));
                      }}
                    />
                  </span>
                </div>
              </>
            ) : (
              // non-editing view
              <>
                <div className="principal-teacher-pending-first-pending-row">
                  <span>{t("Role")}</span>
                  <span>{request_type || "-"}</span>
                </div>

                <div className="principal-teacher-pending-first-pending-row">
                  <span>{t("Grade")}</span>
                  <span>
                    {parsedGrade > 0 ? parsedGrade : "-"}
                    {parsedSection ? parsedSection : ""}
                  </span>
                </div>
              </>
            )}
          </Paper>
        </Grid>

        {/* Right Side Table */}
        <Grid item xs={12} md={7} lg={7.5}>
          <Paper
            className="principal-teacher-pending-details-card"
            elevation={0}
          >
            <Typography
              variant="subtitle1"
              className="principal-teacher-pending-section-title"
            >
              {t("School Details")}
            </Typography>
            <Divider />
            <div className="principal-teacher-pending-row">
              <span>{t("School Name")}</span> <span>{school.name || "-"}</span>
            </div>
            <div className="principal-teacher-pending-row">
              <span>{t("School ID (UDISE)")}</span>{" "}
              <span>{school.udise || "-"}</span>
            </div>
            <Divider style={{ margin: "1vw 0" }} />
            <div
              style={{
                display: "flex",
                justifyContent: "principal-teacher-pending-space-between",
              }}
            >
              <div
                className="principal-teacher-pending-field-stack"
                style={{ flex: 1, marginRight: "1rem" }}
              >
                <div className="principal-teacher-pending-label">
                  {t("City")}
                </div>
                <div>{school.group2 || "N/A"}</div>
              </div>
              <div
                className="principal-teacher-pending-field-stack"
                style={{ flex: 1 }}
              >
                <div className="principal-teacher-pending-label">
                  {t("State")}
                </div>
                <div>{school.group1 || "N/A"}</div>
              </div>
            </div>
            <div className="principal-teacher-pending-field-stack">
              <div className="principal-teacher-pending-label">
                {t("District")}
              </div>
              <div>{school.group3 || "N/A"}</div>
            </div>
          </Paper>

          <div className="principal-teacher-pending-action-buttons-row">
            {isEditing ? (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  size="large"
                  style={{ minWidth: 140, fontWeight: 700, fontSize: "1.1rem" }}
                  onClick={() => setIsEditing(false)}
                >
                  {t("Cancel")}
                </Button>

                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  style={{ minWidth: 140, fontWeight: 700, fontSize: "1.1rem" }}
                  onClick={handleApproveClick}
                >
                  {t("Approve")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  style={{ minWidth: 140, fontWeight: 700, fontSize: "1.1rem" }}
                  onClick={editClicked}
                >
                  {t("Edit")}
                </Button>

                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  style={{ minWidth: 140, fontWeight: 700, fontSize: "1.1rem" }}
                  onClick={handleRemoveClick}
                >
                  {t("Reject")}
                </Button>

                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  style={{ minWidth: 140, fontWeight: 700, fontSize: "1.1rem" }}
                  onClick={handleApproveClick}
                >
                  {t("Approve")}
                </Button>
              </>
            )}
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

export default PrincipalTeacherPendingRequest;
