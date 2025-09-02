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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  RadioGroup,         // Added for radio buttons
  FormControlLabel,   // Added for radio buttons
  FormControl,        // Added for radio buttons
  FormLabel,          // Added for radio buttons
  TextField,          // Added for custom reason input
} from "@mui/material";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { ServiceConfig } from "../../services/ServiceConfig";
import { PAGES, REQUEST_TABS } from "../../common/constants";
import "./StudentPendingRequest.css";
import { Constants } from "../../services/database";

// Utility function for parsing class names (keep this as is)
function parseClassName(className: string): { grade: number; section: string } {
  console.log("--- parseClassName input:", className); // Changed log for clarity

  const cleanedName = className.trim();
  if (!cleanedName) {
    console.log("--- parseClassName: Empty class name, returning default.");
    return { grade: 0, section: "" };
  }

  let grade = 0;
  let section = "";

  const numericMatch = cleanedName.match(/^(\d+)$/);
  if (numericMatch) {
    grade = parseInt(numericMatch[1], 10);
    console.log(
      `--- parseClassName: Numeric match ("${cleanedName}") -> Grade: ${grade}, Section: "${section}".`
    );
    return { grade: isNaN(grade) ? 0 : grade, section: "" };
  }

  const alphanumericMatch = cleanedName.match(/(\d+)\s*(\w+)/i);
  if (alphanumericMatch) {
    grade = parseInt(alphanumericMatch[1], 10);
    section = alphanumericMatch[2];
    console.log(
      `--- parseClassName: Alphanumeric match ("${cleanedName}") -> Grade: ${grade}, Section: "${section}".`
    );
    return { grade: isNaN(grade) ? 0 : grade, section };
  }

  console.warn(
    `--- parseClassName: Could not parse grade from class name: "${cleanedName}". Assigning grade 0.`
  );
  return { grade: 0, section: cleanedName };
}

const StudentPendingRequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;

  const [requestData, setRequestData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false); // State for the approval dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false); // State for the rejection dialog
  const [rejectionReason, setRejectionReason] = useState<string | null>(null); // State for selected rejection reason
  const [customReason, setCustomReason] = useState<string>(""); // State for custom reason text
  const [reasonError, setReasonError] = useState(false); // State for validation error message

  const fetchStudents = useCallback(
    async (classId: string, page: number, size: number) => {
      setLoading(true);
      const response = await api.getStudentsAndParentsByClassId(
        classId,
        page,
        size
      );
      console.log("--- Fetched students response:", response);
      setStudents(response?.data || []);
      setTotalStudents(response?.total || 0);
      setLoading(false);
    },
    [api]
  );

  useEffect(() => {
    async function fetchRequest() {
      setLoading(true);
      try {
        const state = location.state as { request?: any } | undefined;
        if (state?.request && state.request.request_id === id) {
          console.log("--- RequestData from location state:", state.request);
          setRequestData(state.request);
        } else {
          // Fetch all types of requests to find it if not in state
          const [pendingRequests, approvedRequests, rejectedRequests] = await Promise.all([
            api.getOpsRequests(Constants.public.Enums.ops_request_status[0], 1, 1000),
            api.getOpsRequests(Constants.public.Enums.ops_request_status[2], 1, 1000),
            api.getOpsRequests(Constants.public.Enums.ops_request_status[1], 1, 1000),
          ]);
          
          const allRequests = [...(pendingRequests || []), ...(approvedRequests || []), ...(rejectedRequests || [])];
          const req = allRequests.find((r: any) => r.request_id === id);

          if (req) {
            console.log("--- RequestData from API call:", req);
            setRequestData(req);
          } else {
            console.log("--- Request not found for ID:", id);
            setRequestData(null);
          }
        }
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

  // Handlers for Approve Dialog
  const handleApproveClick = () => {
    setApproveDialogOpen(true);
  };

  const handleConfirmApprove = async () => {
    setApproveDialogOpen(false);
    if (!selectedStudent || !requestData?.request_id) {
      console.error("No student selected or request ID missing for approval.");
      return;
    }
    setLoading(true);
    try {
      // await api.approveStudentRequest(requestData.request_id, selectedStudent);
      console.log(`Request ${requestData.request_id} approved for student ${selectedStudent}`);
      history.push(
        `${PAGES.SIDEBAR_PAGE}${PAGES.REQUEST_LIST}?tab=${REQUEST_TABS.APPROVED}`
      );
    } catch (error) {
      console.error("Error approving request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelApprove = () => {
    setApproveDialogOpen(false);
  };

  // Handlers for Reject Dialog
  const handleRemoveClick = () => {
    setRejectionReason(null); // Reset reason when opening dialog
    setCustomReason(""); // Reset custom reason
    setReasonError(false); // Reset error state
    setRejectDialogOpen(true);
  };

  const handleReasonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRejectionReason(event.target.value);
    setReasonError(false); // Clear error when a reason is selected
  };

  const handleCustomReasonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomReason(event.target.value);
    setReasonError(false); // Clear error when typing in custom reason
  };

  const handleRejectConfirm = async () => {
    let finalReason = rejectionReason;
    if (rejectionReason === "Other") {
      finalReason = customReason.trim();
    }

    if (!finalReason) {
      setReasonError(true); // Show error if no reason is selected or custom reason is empty
      return;
    }

    setRejectDialogOpen(false); // Close dialog
    setLoading(true);
    try {
      // Assuming you have an API method for rejecting requests
      // await api.rejectStudentRequest(requestData.request_id, finalReason);
      // console.log(`Request ${requestData.request_id} rejected with reason: ${finalReason}`);
      history.push(
        `${PAGES.SIDEBAR_PAGE}${PAGES.REQUEST_LIST}?tab=${REQUEST_TABS.REJECTED}`
      );
    } catch (error) {
      console.error("Error rejecting request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectCancel = () => {
    setRejectDialogOpen(false);
    setReasonError(false); // Clear error on cancel
  };


  if (loading || !requestData)
    return (
      <div className="centered">
        <Typography>Loading...</Typography>
      </div>
    );

  const { school = {}, requestedBy = {}, request_type } = requestData;

  console.groupCollapsed("--- Debugging RequestData for Display ---");
  console.log("Raw requestData object:", requestData);
  console.log("requestData.classInfo?.standard:", requestData.classInfo?.standard);
  console.log("requestData.classInfo?.name:", requestData.classInfo?.name);

  // Use classInfo.name if available, otherwise fallback to classInfo.standard
  const fullRequestClassName =
    requestData.classInfo?.name || `${requestData.classInfo?.standard || ""}`;
  console.log(
    "Constructed fullRequestClassName:",
    fullRequestClassName
  );

  const { grade: parsedGrade, section: parsedSection } =
    parseClassName(fullRequestClassName);
  console.log(
    "Result of parsing fullRequestClassName: Grade:",
    parsedGrade,
    "Section:",
    parsedSection
  );
  console.groupEnd();

  const navBreadcrumbs = (
    <div className="breadcrumbs">
      <span
        onClick={() => history.push(PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST)}
        className="link"
      >
        Requests
      </span>
      <span> &gt; </span>
      <span>Pending</span>
      <span> &gt; </span>
      <span className="active">Request ID - {id}</span>
    </div>
  );

  return (
    <div className="pending-requests-details-layout">
      <Typography variant="h4" className="page-title">
        Request ID - {id}
      </Typography>
      {navBreadcrumbs}

      <Grid
        container
        spacing={3}
        className="pending-main-content-row"
        alignItems="flex-start"
      >
        {/* Left Side Cards */}
        <Grid item xs={12} md={5} lg={4.5}>
          <Paper className="pending-details-card" elevation={0}>
            <Typography variant="subtitle1" className="pending-section-title">
              Request From
            </Typography>
            <Divider />
            <div className="pending-row">
              <span>Name</span> <span>{requestedBy.name || "-"}</span>
            </div>
            <div className="pending-row">
              <span>Phone Number</span>{" "}
              <span>{requestedBy.phone_number || "-"}</span>
            </div>
            <div className="pending-row">
              <span>Email ID</span> <span>{requestedBy.email || "-"}</span>
            </div>
          </Paper>

          <Paper className="pending-details-card" elevation={0}>
            <Typography variant="subtitle1" className="pending-section-title">
              Request Details
            </Typography>
            <Divider />
            <div className="pending-row">
              <span>Role</span> <span>{request_type || "-"}</span>
            </div>
            <div className="pending-row">
              <span>Grade</span>{" "}
              <span>{parsedGrade > 0 ? parsedGrade : "-"}</span>
            </div>
            <div className="pending-row">
              <span>Class Section</span> <span>{parsedSection || "N/A"}</span>
            </div>
          </Paper>

          <Paper className="pending-details-card" elevation={0}>
            <Typography variant="subtitle1" className="pending-section-title">
              School Details
            </Typography>
            <Divider />
            <div className="pending-row">
              <span>School Name</span> <span>{school.name || "-"}</span>
            </div>
            <div className="pending-row">
              <span>School ID (UDISE)</span> <span>{school.udise || "-"}</span>
            </div>
            <Divider style={{ margin: "1vw 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div
                className="field-stack"
                style={{ flex: 1, marginRight: "1rem" }}
              >
                <div className="label">City</div>
                <div>{school.group2 || "N/A"}</div>
              </div>
              <div className="field-stack" style={{ flex: 1 }}>
                <div className="label">State</div>
                <div>{school.group1 || "N/A"}</div>
              </div>
            </div>
            <div className="field-stack">
              <div className="label">District</div>
              <div>{school.group3 || "N/A"}</div>
            </div>
          </Paper>
          <div className="pending-action-buttons-row">
            <Button
              variant="contained"
              color="error"
              size="large"
              style={{ minWidth: 140, fontWeight: 700, fontSize: "1.1rem" }}
              onClick={handleRemoveClick} // Call the handler for rejection
            >
              Remove
            </Button>
            <Button
              variant="contained"
              color="success"
              size="large"
              style={{ minWidth: 140, fontWeight: 700, fontSize: "1.1rem" }}
              onClick={handleApproveClick}
              disabled={!selectedStudent}
            >
              Approve
            </Button>
          </div>
        </Grid>

        {/* Right Side Table */}
        <Grid item xs={12} md={7} lg={7.5}>
          <Paper className="pending-students-table-card" elevation={0}>
            <Typography variant="subtitle1" className="pending-section-title">
              Students in Grade {parsedGrade > 0 ? parsedGrade : "-"} -{" "}
              {parsedSection || "N/A"}
            </Typography>
            <Typography
              className="total-students-count"
              style={{
                color: "#767676",
                fontSize: "1rem",
                fontWeight: 400,
                marginBottom: "1vw",
              }}
            >
              Total: {totalStudents} students
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell className="table-header-cell">
                      Student ID
                    </TableCell>
                    <TableCell className="table-header-cell">
                      Student Name
                    </TableCell>
                    <TableCell className="table-header-cell">Gender</TableCell>
                    <TableCell className="table-header-cell">Grade</TableCell>
                    <TableCell className="table-header-cell">
                      Phone Number
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((stu) => {
                    console.groupCollapsed(
                      `--- Debugging Student (ID: ${stu.user.id}) ClassData ---`
                    );
                    console.log("Raw student object:", stu);
                    console.log("stu.grade:", stu.grade);
                    console.log("stu.classSection:", stu.classSection);
                    const fullStudentClassName = `${stu.grade || ""}${
                      stu.classSection || ""
                    }`;
                    console.log(
                      "Constructed fullStudentClassName:",
                      fullStudentClassName
                    );
                    const {
                      grade: studentParsedGrade,
                      section: studentParsedSection,
                    } = parseClassName(fullStudentClassName);
                    console.log(
                      "Result of parsing fullStudentClassName: Grade:",
                      studentParsedGrade,
                      "Section:",
                      studentParsedSection
                    );
                    console.groupEnd();
                    return (
                      <TableRow key={stu.user.id}>
                        <TableCell>
                          <Radio
                            checked={selectedStudent === stu.user.id}
                            onChange={() => handleRadioChange(stu.user.id)}
                            value={stu.user.id}
                            color="primary"
                          />
                          {stu.user.student_id || "-"}
                        </TableCell>
                        <TableCell>{stu.user.name || "-"}</TableCell>
                        <TableCell>{stu.user.gender || "-"}</TableCell>
                        <TableCell>
                          {studentParsedGrade > 0 ? studentParsedGrade : "-"} -{" "}
                          {studentParsedSection || "N/A"}
                        </TableCell>
                        <TableCell>{stu.parent?.phone || "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalStudents}
              page={currentPage - 1}
              onPageChange={handlePageChange}
              rowsPerPage={pageSize}
              style={{
                borderTop: "1px solid #f0f0f0",
                marginTop: "1vw",
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Confirmation Dialog for APPROVAL */}
      <Dialog
        open={approveDialogOpen}
        onClose={handleCancelApprove}
        aria-labelledby="approve-dialog-title"
        aria-describedby="approve-dialog-description"
      >
        <DialogTitle id="approve-dialog-title">{"Confirm Approval"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="approve-dialog-description">
            Are you sure you want to approve this request and assign the selected student?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelApprove} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmApprove} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* REJECT Request Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={handleRejectCancel}
        aria-labelledby="reject-dialog-title"
        aria-describedby="reject-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="reject-dialog-title">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#E53E3E', fontSize: '1.5rem', marginRight: '0.5rem' }}>&#9888;</span> {/* Warning icon */}
            Reject Request - {id}
          </div>
        </DialogTitle>
        <DialogContent>
          {reasonError && (
            <div style={{ color: '#E53E3E', marginBottom: '1rem', border: '1px solid #FED7D7', padding: '0.5rem', borderRadius: '4px', backgroundColor: '#FFF5F5' }}>
              <Typography variant="body2" component="p">
                Please provide a reason for rejecting this request
              </Typography>
            </div>
          )}
          <FormControl component="fieldset" margin="normal">
            <FormLabel component="legend" style={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.87)' }}>Reason for Rejection</FormLabel>
            <RadioGroup
              aria-label="rejection-reason"
              name="rejection-reason"
              value={rejectionReason}
              onChange={handleReasonChange}
            >
              <FormControlLabel
                value="Verification Failed"
                control={<Radio />}
                label={
                  <>
                    Verification Failed
                    <Typography variant="body2" color="textSecondary" style={{ display: 'block' }}>
                      Unable to verify provided information
                    </Typography>
                  </>
                }
              />
              <FormControlLabel
                value="Wrong School Selected"
                control={<Radio />}
                label={
                  <>
                    Wrong School Selected
                    <Typography variant="body2" color="textSecondary" style={{ display: 'block' }}>
                      Incorrect school name was selected for this request
                    </Typography>
                  </>
                }
              />
              <FormControlLabel
                value="Other"
                control={<Radio />}
                label={
                  <>
                    Other
                    <Typography variant="body2" color="textSecondary" style={{ display: 'block' }}>
                      Please specify the reason in the custom field
                    </Typography>
                  </>
                }
              />
            </RadioGroup>
          </FormControl>
          {(rejectionReason === "Other" || reasonError && !rejectionReason) && ( // Show TextField if 'Other' is selected or if there's a reason error and no radio reason is selected
            <TextField
              margin="normal"
              label="Message to Admin"
              placeholder="Add any additional context or instructions..."
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={customReason}
              onChange={handleCustomReasonChange}
              error={reasonError && rejectionReason === "Other" && customReason.trim() === ""}
              helperText={reasonError && rejectionReason === "Other" && customReason.trim() === "" ? "Custom reason is required" : ""}
              sx={{mt: 2}}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px', justifyContent: 'space-between' }}>
          <Button
            onClick={handleRejectCancel}
            variant="outlined"
            size="large"
            sx={{ minWidth: 120, borderColor: '#D0D5DD', color: '#344054', '&:hover': {borderColor: '#b0b5bd', backgroundColor: '#f5f5f5'} }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRejectConfirm}
            variant="contained"
            size="large"
            color="error"
            sx={{ minWidth: 120, backgroundColor: '#EF4444', '&:hover': {backgroundColor: '#dc2626'} }}
          >
            Reject Request
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default StudentPendingRequestDetails;