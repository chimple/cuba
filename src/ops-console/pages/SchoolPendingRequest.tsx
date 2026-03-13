import { Button, Grid, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams, useHistory, useLocation } from "react-router-dom";
import SchoolNameHeaderComponent from "../components/SchoolDetailsComponents/SchoolNameHeaderComponent";
import Breadcrumb from "../components/Breadcrumb";
import "./SchoolPendingRequest.css";
import { ServiceConfig } from "../../services/ServiceConfig";
import SchoolDetailsCard from "../components/SchoolRequestComponents/SchoolDetailsCard";
import RequestFromCard from "../components/SchoolRequestComponents/RequestFromCard";
import { PAGES } from "../../common/constants";
import RejectRequestPopup from "../components/SchoolRequestComponents/RejectRequestPopup";
import { t } from "i18next";

const SchoolPendingRequest: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [requestData, setRequestData] = useState<any>(null);
  const theme = useTheme();
  const api = ServiceConfig.getI().apiHandler;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectPopupOpen, setRejectPopupOpen] = useState(false);
  const auth = ServiceConfig.getI().authHandler;
  useEffect(() => {
    async function fetchRequest() {
      setLoading(true);
      try {
        const state = location.state as { request?: any } | undefined;
        if (state?.request && state.request.request_id === id) {
          const respondedBy = await auth.getCurrentUser();
          state.request.responded_by = respondedBy?.id;
          state.request.respondedBy = respondedBy;
          setRequestData(state.request);
          setUser(state.request.requestedBy);
        }
      } catch (error) {
        console.error("Error fetching request data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRequest();
  }, [id, api, location.state]);
  return (
    <div>
      {!loading && (
        <div className="school-request-container">
          {/* <div className="school-detail-gap" /> */}
          <div className="school-common-header">
            <SchoolNameHeaderComponent schoolName={"Request ID - " + id} />
          </div>

          <div className="school-common-secondary-header">
            <Breadcrumb
              crumbs={[
                {
                  label: "Pending",
                  onClick: () => history.goBack(),
                },
                {
                  label: "Request ID - " + id,
                },
              ]}
            />
          </div>
          <div className="school-detail-tertiary-gap" />
          <div className="school-request">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <SchoolDetailsCard requestData={requestData} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 5 }}>
                <RequestFromCard requestedBy={user} />
                <div className="request-action-buttons">
                  <Button
                    variant="contained"
                    color="error"
                    size="large"
                    style={{
                      minWidth: 130,
                      padding: "8px 50px",
                      fontWeight: 600,
                      fontSize: "16px",
                      textTransform: "none",
                    }}
                    onClick={() => {
                      setRejectPopupOpen(true);
                    }}
                  >
                    {t("Reject")}
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    style={{
                      minWidth: 140,
                      padding: "8px 30px",
                      fontWeight: 600,
                      fontSize: "16px",
                      textTransform: "none",
                      backgroundColor: "#1A71F6",
                    }}
                    onClick={() => {
                      history.push({
                        pathname: `${PAGES.SIDEBAR_PAGE}${PAGES.REQUEST_LIST}${PAGES.SCHOOL_PENDING_REQUEST}${PAGES.SCHOOL_FORM_PAGE}/${id}`,
                        state: { request: requestData },
                      });
                    }}
                  >
                    {t("Review & Add School")}
                  </Button>
                </div>
              </Grid>
            </Grid>
            {rejectPopupOpen && (
              <RejectRequestPopup
                requestData={requestData}
                onClose={() => setRejectPopupOpen(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolPendingRequest;
