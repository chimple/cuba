import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import { Box, Button, useTheme } from "@mui/material";
import { useHistory, useLocation, useParams } from "react-router";
import SchoolDetailsCard from "../components/SchoolRequestComponents/SchoolDetailsCard";
import RequestFromCard from "../components/SchoolRequestComponents/RequestFromCard";
import { ServiceConfig } from "../../services/ServiceConfig";
import SchoolNameHeaderComponent from "../components/SchoolDetailsComponents/SchoolNameHeaderComponent";
import Breadcrumb from "../components/Breadcrumb";
import ApprovedDetails from "../components/SchoolRequestComponents/ApprovedDetails";

const SchoolApprovedRequest: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [requestData, setRequestData] = useState<any>(null);
  const theme = useTheme();
  const api = ServiceConfig.getI().apiHandler;

  const [requestedBy, setRequestedBy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequest() {
      setLoading(true);
      try {
        const state = location.state as { request?: any } | undefined;
        if (state?.request && state.request.request_id === id) {
          setRequestData(state.request);
          setRequestedBy(state.request.requestedBy);
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
          <div className="school-common-header">
            <SchoolNameHeaderComponent schoolName={"Request ID - " + id} />
          </div>

          <div className="school-common-secondary-header">
            <Breadcrumb
              crumbs={[
                {
                  label: "Approved",
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
              <Grid size={{ xs: 12, md: 4 }} spacing={2}>
                <ApprovedDetails
                  approvedBy={requestData.respondedBy.name}
                  approvedOn={requestData.created_at}
                />
                <Box mt={2}>
                  <RequestFromCard requestedBy={requestedBy} />
                </Box>
              </Grid>
            </Grid>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolApprovedRequest;
