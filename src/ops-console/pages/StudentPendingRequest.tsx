import React, { useEffect, useState, useCallback } from "react";
import {
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Radio,
  TablePagination,
} from "@mui/material";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { ServiceConfig } from "../../services/ServiceConfig";
import { DEFAULT_PAGE_SIZE, PAGES, REQUEST_TABS } from "../../common/constants";
import "./StudentPendingRequest.css";
import { Constants } from "../../services/database";
import { useTranslation } from "react-i18next";
import { OpsUtil } from "../OpsUtility/OpsUtil";
import RejectRequestPopup from "../components/SchoolRequestComponents/RejectRequestPopup";

const StudentPendingRequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;
  const { t } = useTranslation();

  const [requestData, setRequestData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [studentDetails, setStudentDetails] = useState<any>(null);

  const fetchStudents = useCallback(
    async (classId: string, page: number, size: number) => {
      setLoading(true);
      const response = await api.getStudentsAndParentsByClassId(
        classId,
        page,
        size
      );
      if (requestData?.requested_by) {
        const studentData = await api.getStudentAndParentByStudentId(
          requestData.requested_by
        );
        setStudentDetails(studentData);
      } else {
        console.warn(
          "requestData.requested_by was undefined when fetching student details."
        );
      }
      setStudents(response?.data || []);
      setTotalStudents(response?.total || 0);
      setLoading(false);
    },
    [api, requestData]
  );

  useEffect(() => {
    async function fetchRequest() {
      setLoading(true);
      try {
        const state = location.state as { request?: any } | undefined;
        const authHandler = ServiceConfig.getI().authHandler;
        const respondedBy = await authHandler.getCurrentUser();
        
        if (state?.request && state.request.request_id === id) {
          state.request.responded_by = respondedBy?.id;
          state.request.respondedBy = respondedBy;
          setRequestData(state.request);
        } else {
          const [pendingRequests, approvedRequests, rejectedRequests] =
            await Promise.all([
              api.getOpsRequests(
                Constants.public.Enums.ops_request_status[0],
                1,
                DEFAULT_PAGE_SIZE
              ),
              api.getOpsRequests(
                Constants.public.Enums.ops_request_status[2],
                1,
                DEFAULT_PAGE_SIZE
              ),
              api.getOpsRequests(
                Constants.public.Enums.ops_request_status[1],
                1,
                DEFAULT_PAGE_SIZE
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
          } else {
            setRequestData(null);
          }
        }
      } catch (error) {
        console.error("Error fetching request data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRequest();
  }, [id, api, location.state]);

  useEffect(() => {
    if (requestData?.class_id) {
      fetchStudents(requestData.class_id, currentPage, pageSize);
    }
  }, [requestData, currentPage, pageSize, fetchStudents]);

  const handleRadioChange = (studentId: string) =>
    setSelectedStudent(studentId);
  const handlePageChange = (event: unknown, newPage: number) =>
    setCurrentPage(newPage + 1);

  const handleConfirmApprove = async () => {
    const currentRequestId = requestData?.request_id;
    const currentSelectedStudent = selectedStudent;
    const newStudentUserId = requestData?.requestedBy?.id;
    // RespondedBy: whoever is logged in
    const auth = ServiceConfig.getI().authHandler;
    const user = await auth.getCurrentUser();
    if (!user?.id) {
      throw new Error("No logged-in user found. Cannot approve request.");
    }
    const respondedBy = user?.id;

    if (!currentRequestId) {
      console.error(t("Missing request ID for approval."));
      return;
    }

    setLoading(true);
    try {
      if (currentSelectedStudent && newStudentUserId) {
        // MERGE & APPROVE logic
        await api.mergeStudentRequest(
          currentRequestId,
          currentSelectedStudent,
          newStudentUserId,
          respondedBy
        );
      } else {
        const requestRole = requestData?.request_type; // e.g., 'student'
        await api.approveOpsRequest(currentRequestId, respondedBy, requestRole);
      }

      history.push(
        `${PAGES.SIDEBAR_PAGE}${PAGES.REQUEST_LIST}?tab=${REQUEST_TABS.APPROVED}`
      );
    } catch (error) {
      console.error(t("Error approving/merging request:"), error);
    } finally {
      setLoading(false);
    }
  };

  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const handleRemoveClick = () => {
    setShowRejectPopup(true);
  };

  if (loading || !requestData)
    return (
      <div className="student-pending-request-details-centered">
        <Typography>{t("Loading...")}</Typography>
      </div>
    );

  const { school = {}, requestedBy = {}, request_type } = requestData;
  const fullRequestClassName =
    requestData.classInfo?.name || `${requestData.classInfo?.standard || ""}`;

  const { grade: parsedGrade, section: parsedSection } =
    OpsUtil.parseClassName(fullRequestClassName);

  const navBreadcrumbs = (
    <div className="student-pending-request-details-breadcrumbs">
      <span
        onClick={() => history.push(PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST)}
        className="student-pending-request-details-link"
      >
        {t("Pending")}
      </span>
      <span> &gt; </span>
      <span className="student-pending-request-details-active">
        {t(`Request ID - ${id}`)}
      </span>
    </div>
  );

  // Filter out the requesting student from the students list
  const filteredStudents = students.filter(
    (stu) => stu.user.id !== requestData?.requested_by
  );
  // Also update the total students count for display
  const filteredTotalStudents =
    totalStudents - (students.length - filteredStudents.length);

  return (
    <>
      <div className="student-pending-request-details-layout">
        <Typography
        variant="h4"
        className="student-pending-request-details-page-title"
      >
        {t(`Request ID - ${id}`)}
      </Typography>
      {navBreadcrumbs}

      <Grid
        container
        spacing={3}
        className="student-pending-request-details-main-content-row"
        alignItems="flex-start"
      >
        {/* Left Side Cards */}
        <Grid size={{ xs: 12, md: 5, lg: 4.5 }}>
          <Paper className="student-pending-request-details-card" elevation={0}>
            <Typography
              variant="subtitle1"
              className="student-pending-request-details-section-title"
            >
              {t("Request From")}
            </Typography>
            <Divider />
            <div className="student-pending-request-details-row">
              <span>{t("Name")}</span>{" "}
              <span>{requestedBy.name || t("N/A")}</span>
            </div>
            <div className="student-pending-request-details-row">
              <span>{t("Phone Number")}</span>{" "}
              <span>{studentDetails?.parents?.[0]?.phone || t("N/A")}</span>
            </div>
            <div className="student-pending-request-details-row">
              <span>{t("Email ID")}</span>{" "}
              <span>{studentDetails?.parents?.[0]?.email || t("N/A")}</span>
            </div>
          </Paper>

          <Paper className="student-pending-request-details-card" elevation={0}>
            <Typography
              variant="subtitle1"
              className="student-pending-request-details-section-title"
            >
              {t("Request Details")}
            </Typography>
            <Divider />
            <div className="student-pending-request-details-row">
              <span>{t("Role")}</span> <span>{request_type || t("N/A")}</span>
            </div>
            <div className="student-pending-request-details-row">
              <span>{t("Grade")}</span>{" "}
              <span>{parsedGrade > 0 ? parsedGrade : t("N/A")}</span>
            </div>
            <div className="student-pending-request-details-row">
              <span>{t("Class Section")}</span>{" "}
              <span>{parsedSection || t("N/A")}</span>
            </div>
          </Paper>

          <Paper className="student-pending-request-details-card" elevation={0}>
            <Typography
              variant="subtitle1"
              className="student-pending-request-details-section-title"
            >
              {t("School Details")}
            </Typography>
            <Divider className="student-pending-request-details-divider-margin" />
            <div className="student-pending-request-details-row">
              <span>{t("School Name")}</span>{" "}
              <span>{school.name || t("N/A")}</span>
            </div>
            <div className="student-pending-request-details-row">
              <span>{t("School ID (UDISE)")}</span>{" "}
              <span>{school.udise || t("N/A")}</span>
            </div>
            <Divider className="student-pending-request-details-divider-margin" />
            <div className="student-pending-request-details-field-row">
              <div className="student-pending-request-details-field-stack student-pending-request-details-field-stack-margin">
                <div className="student-pending-request-details-label">
                  {t("Block")}
                </div>
                <div>{school.group3 || t("N/A")}</div>
              </div>
              <div className="student-pending-request-details-field-stack">
                <div className="student-pending-request-details-label">
                  {t("State")}
                </div>
                <div>{school.group1 || t("N/A")}</div>
              </div>
            </div>
            <div className="student-pending-request-details-field-stack">
              <div className="student-pending-request-details-label">
                {t("District")}
              </div>
              <div>{school.group2 || t("N/A")}</div>
            </div>
          </Paper>
          <div className="student-pending-request-details-action-buttons-row">
            <Button
              variant="contained"
              color="error"
              size="large"
              className="student-pending-request-details-remove-button"
              onClick={handleRemoveClick}
            >
              {t("Remove")}
            </Button>
            <Button
              variant="contained"
              color="success"
              size="large"
              className="student-pending-request-details-approve-button"
              onClick={handleConfirmApprove}
              disabled={loading || !requestData?.request_id}
            >
              {selectedStudent ? t("Merge & Approve") : t("Approve")}
            </Button>
          </div>
        </Grid>

        {/* Right Side Table */}
        <Grid size={{ xs: 12, md: 7, lg: 7.5 }}>
          <Paper
            className="student-pending-request-details-table-card"
            elevation={0}
          >
            <Typography
              variant="subtitle1"
              className="student-pending-request-details-section-title"
            >
              {t(
                `Students in Grade ${parsedGrade > 0 ? parsedGrade : "N/A"} - ${
                  parsedSection || "N/A"
                }`
              )}
            </Typography>
            <Typography className="student-pending-request-details-total-students-count">
              {t(`Total: ${filteredTotalStudents} students`)}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell className="student-pending-request-details-table-header-cell">
                      {t("Student ID")}
                    </TableCell>
                    <TableCell className="student-pending-request-details-table-header-cell">
                      {t("Student Name")}
                    </TableCell>
                    <TableCell className="student-pending-request-details-table-header-cell">
                      {t("Gender")}
                    </TableCell>
                    <TableCell className="student-pending-request-details-table-header-cell">
                      {t("Grade")}
                    </TableCell>
                    <TableCell className="student-pending-request-details-table-header-cell">
                      {t("Phone Number")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map((stu) => {
                    const fullStudentClassName = `${stu.grade || ""}${
                      stu.classSection || ""
                    }`;
                    const {
                      grade: studentParsedGrade,
                      section: studentParsedSection,
                    } = OpsUtil.parseClassName(fullStudentClassName);

                    return (
                      <TableRow key={stu.user.id}>
                        <TableCell>
                          <Radio
                            checked={selectedStudent === stu.user.id}
                            onChange={() => handleRadioChange(stu.user.id)}
                            value={stu.user.id}
                            color="primary"
                          />
                          {stu.user.student_id || t("N/A")}
                        </TableCell>
                        <TableCell>{stu.user.name || t("N/A")}</TableCell>
                        <TableCell>{stu.user.gender || t("N/A")}</TableCell>
                        <TableCell>
                          {t(
                            `${
                              studentParsedGrade > 0
                                ? studentParsedGrade
                                : "N/A"
                            } - ${studentParsedSection || "N/A"}`
                          )}
                        </TableCell>
                        <TableCell>{stu.parent?.phone || t("N/A")}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredTotalStudents}
              page={currentPage - 1}
              onPageChange={handlePageChange}
              rowsPerPage={pageSize}
              className="student-pending-request-details-table-pagination"
            />
          </Paper>
        </Grid>
      </Grid>
      </div>
      {showRejectPopup && (
        <RejectRequestPopup
          requestData={{
            ...requestData,
            school: requestData?.school || {},
          }}
          onClose={() => setShowRejectPopup(false)}
        />
      )}
    </>
  );
}

export default StudentPendingRequestDetails;
