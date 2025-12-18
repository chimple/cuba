import { useEffect, useState } from "react";
import {
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  IconButton,
} from "@mui/material";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { ServiceConfig } from "../../services/ServiceConfig";
import { PAGES, REQUEST_TABS, RequestTypes } from "../../common/constants";
import "./PrincipalTeacherPendingRequest.css";
import { Constants } from "../../services/database";
import OpsCustomDropdown from "../components/OpsCustomDropdown";
import { OpsUtil } from "../OpsUtility/OpsUtil";
import { t } from "i18next";
import { BsFillBellFill } from "react-icons/bs";
import RejectRequestPopup from "../components/SchoolRequestComponents/RejectRequestPopup";

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
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const editClicked = async () => {
    const options = Object.values(RequestTypes)
      .filter((t) => t === RequestTypes.TEACHER || t === RequestTypes.PRINCIPAL)
      .map((type) => ({
        label: type.charAt(0).toUpperCase() + type.slice(1),
        value: type,
      }));
    setRoleOptions(options);
    if (requestData?.school?.id) {
      try {
        const response = await api.getClassesBySchoolId(requestData.school.id);
        const classes = Array.isArray(response) ? response : [response];
        const gradeOpts = classes.map((cls: any) => ({
          label: cls.name,
          value: cls.id,
        }));

        setGradeOptions(gradeOpts);
      } catch (err) {
        console.error("Error fetching classes for school:", err);
      }
    }

    setIsEditing(true);
  };

  useEffect(() => {
    async function fetchRequest() {
      setLoading(true);
      try {
        const state = location.state as { request?: any } | undefined;
        if (state?.request && state.request.request_id === id) {
          setRequestData(state.request);
        } else {
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
      // ✅ Use edited values if in edit mode
      const role =
        isEditing && editableRequestType
          ? editableRequestType
          : requestData.request_type;

      const schoolId = requestData?.school?.id || undefined;

      const classId =
        isEditing &&
          (role === RequestTypes.TEACHER || role === RequestTypes.STUDENT)
          ? selectedGradeId
          : requestData?.class_id || undefined;

      const auth = ServiceConfig.getI().authHandler;
      const user = await auth.getCurrentUser();
      if (!user?.id) {
        throw new Error("No logged-in user found. Cannot approve request.");
      }
      const respondedBy = user?.id;

      if (schoolId && requestData) {
        if (role === RequestTypes.PRINCIPAL) {
          try {
            await api.addUserToSchool(schoolId, requestData.requestedBy, role);
          } catch (err) {
            console.error("Error adding user to school:", err);
          }
        } else if (role === RequestTypes.TEACHER) {
          try {
            await api.addTeacherToClass(schoolId, classId, requestData.requestedBy);
          } catch (err) {
            console.error("Error adding teacher to class:", err);
          }
        }
      }

      await api.approveOpsRequest(
        requestData.id,
        respondedBy,
        role,
        schoolId,
        classId
      );

      history.push(
        `${PAGES.SIDEBAR_PAGE}${PAGES.REQUEST_LIST}?tab=${REQUEST_TABS.APPROVED}`
      );
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  const handleRejectClick = async () => {
    const auth = ServiceConfig.getI().authHandler;
    const user = await auth.getCurrentUser();
    if (!user?.id) {
      console.error("No logged-in user found. Cannot reject request.");
      return;
    }
    const userId = user?.id;
    setCurrentUserId(userId ?? "");
    setShowRejectPopup(true);
  };

  if (loading || !requestData)
    return (
      <div className="centered">
        <Typography>Loading...</Typography>
      </div>
    );

  const { school = {}, requestedBy = {}, request_type } = requestData;

  const fullRequestClassName =
    requestData.classInfo?.name || `${requestData.classInfo?.standard || ""}`;

  const { grade: parsedGrade, section: parsedSection } =
    OpsUtil.parseClassName(fullRequestClassName);
  const navBreadcrumbs = (
    <div className="principal-teacher-pending-breadcrumbs">
      {/* Pending link */}
      <span
        onClick={() => history.push(PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST)}
        className="principal-teacher-pending-link"
      >
        {t("Pending")}
      </span>

      <span> &gt; </span>

      {/* Request ID breadcrumb */}
      <span
        onClick={() => {
          if (isEditing) {
            setIsEditing(false);
            setEditableRequestType("");
            setSelectedGradeId("");
          }
        }}
        className={
          isEditing
            ? "principal-teacher-pending-link"
            : "principal-teacher-pending-active"
        }
      >
        {t("Request ID - ")} {id}
      </span>

      {/* Edit breadcrumb only in edit mode */}
      {isEditing && (
        <>
          <span> &gt; </span>
          <span className="principal-teacher-pending-active">{t("Edit")}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="principal-teacher-pending-details-layout">
      <div className="principal-teacher-pending-page-header">
        <div className="principal-teacher-pending-page-title">
          {t("Request ID - ")} {id}
        </div>
        <div className="principal-teacher-pending-page-icon">
          <IconButton sx={{ color: "black" }}>
            <BsFillBellFill />
          </IconButton>
        </div>
      </div>
      {navBreadcrumbs}

      <Grid
        container
        spacing={3}
        className="principal-teacher-pending-main-content-row"
        alignItems="flex-start"
      >
        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
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
              <span className="principal-teacher-pending-first-pending-row-title">
                {t("Name")}
              </span>
              <span>{requestedBy.name || "-"}</span>
            </div>
            <div className="principal-teacher-pending-first-pending-row">
              <span className="principal-teacher-pending-first-pending-row-title">
                {t("Phone Number")}
              </span>{" "}
              <span>{requestedBy.phone || "-"}</span>
            </div>
            <div className="principal-teacher-pending-first-pending-row">
              <span className="principal-teacher-pending-first-pending-row-title">
                {t("Email ID")}
              </span>{" "}
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
                  <span>{t("Request Type")}</span>
                  <span>
                    <OpsCustomDropdown
                      value={editableRequestType}
                      placeholder={"Request Type"}
                      options={roleOptions}
                      onChange={(val) => {
                        setEditableRequestType(val as RequestTypes);
                        setRequestData((prev: any) => ({
                          ...prev,
                          request_type: val,
                        }));
                      }}
                    />
                  </span>
                </div>

                {(editableRequestType === RequestTypes.TEACHER ||
                  editableRequestType === RequestTypes.STUDENT) && (
                    <div className="principal-teacher-pending-first-pending-row">
                      <span className="principal-teacher-pending-first-pending-row-title">
                        {t("Grade")}
                      </span>
                      <span>
                        <OpsCustomDropdown
                          placeholder={"Select Grade"}
                          value={selectedGradeId}
                          options={gradeOptions}
                          onChange={(val: string) => {
                            setSelectedGradeId(val);
                            setRequestData((prev: any) => ({
                              ...prev,
                              class_id: val,
                            }));
                          }}
                        />
                      </span>
                    </div>
                  )}
              </>
            ) : (
              <>
                <div className="principal-teacher-pending-first-pending-row">
                  <span className="principal-teacher-pending-first-pending-row-title">
                    {t("Role")}
                  </span>
                  <span>{request_type || "-"}</span>
                </div>

                {(request_type === RequestTypes.TEACHER ||
                  request_type === RequestTypes.STUDENT) && (
                    <div className="principal-teacher-pending-first-pending-row">
                      <span className="principal-teacher-pending-first-pending-row-title">
                        {t("Grade")}
                      </span>
                      <span>
                        {parsedGrade > 0 ? parsedGrade : "-"}
                        {parsedSection ? parsedSection : ""}
                      </span>
                    </div>
                  )}
              </>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
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
                  {t("District")}
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
                {t("Country")}
              </div>
              <div>{school.country || "N/A"}</div>
            </div>
          </Paper>

          <div className="principal-teacher-pending-action-buttons-row">
            {isEditing ? (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  size="large"
                  style={{
                    minWidth: 110,
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    textTransform: "none",
                  }}
                  onClick={() => {
                    setIsEditing(false);
                    setEditableRequestType("");
                    setSelectedGradeId("");
                  }}
                >
                  {t("Cancel")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  style={{
                    minWidth: 110,
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    textTransform: "none",
                  }}
                  onClick={editClicked}
                >
                  {t("Edit")}
                </Button>

                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  style={{
                    minWidth: 110,
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    textTransform: "none",
                  }}
                  onClick={handleRejectClick}
                >
                  {t("Reject")}
                </Button>
              </>
            )}

            {/* ✅ Single Approve button shared by both cases */}
            <Button
              variant="contained"
              color="success"
              size="large"
              disabled={
                (editableRequestType === RequestTypes.TEACHER ||
                  editableRequestType === RequestTypes.STUDENT) &&
                !selectedGradeId
              }
              style={{
                minWidth: 110,
                fontWeight: 700,
                fontSize: "1.1rem",
                textTransform: "none",
              }}
              onClick={handleApproveClick}
            >
              {t("Approve")}
            </Button>
          </div>
        </Grid>
      </Grid>

      {showRejectPopup && (
        <RejectRequestPopup
          requestData={{
            ...requestData,
            type: requestData.request_type,
            respondedBy: { id: currentUserId }
          }}
          onClose={() => setShowRejectPopup(false)}
        />
      )}
    </div>
  );
};

export default PrincipalTeacherPendingRequest;
