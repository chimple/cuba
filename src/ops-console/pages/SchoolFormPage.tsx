import React, { useEffect, useState } from "react";
import FormSection from "../components/SchoolRequestComponents/FormSection";
import SchoolNameHeaderComponent from "../components/SchoolDetailsComponents/SchoolNameHeaderComponent";
import { useHistory, useLocation, useParams } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import {
  useMediaQuery,
  useTheme,
  Box,
  Grid,
  Typography,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import ContactFormSection from "../components/SchoolRequestComponents/ContactFormSection";
import "./SchoolFormPage.css";
import { t } from "i18next";
import { PAGES, REQUEST_TABS, STATUS } from "../../common/constants";
import { ServiceConfig } from "../../services/ServiceConfig";
import { RoleType } from "../../interface/modelInterfaces";

const SchoolFormPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const [requestData, setRequestData] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [program, setProgram] = useState<any>(null);
  const [fieldCoordinator, setFieldCoordinator] = useState<any>(null);

  const [programs, setPrograms] = useState<any[]>([]);
  const [fieldCoordinators, setFieldCoordinators] = useState<any[]>([]);

  const api = ServiceConfig.getI().apiHandler;

  const [address, setAddress] = useState({
    state: "",
    city: "",
    district: "",
    address: "",
  });

  const [contacts, setContacts] = useState([
    {
      subheader: "Contact 1",
      required: true,
      fields: [
        {
          label: "Name",
          name: "name",
          value: "",
          required: true,
          disabled: true,
        },
        {
          label: "Phone Number",
          name: "phone",
          value: "",
          required: true,
          disabled: true,
        },
      ],
    },
    {
      subheader: "Contact 2",
      fields: [
        { label: "Name", name: "name", value: "" },
        { label: "Phone Number", name: "phone", value: "" },
      ],
    },
  ]);

  useEffect(() => {
    async function initialize() {
      setLoading(true);
      try {
        // --- request data ---
        const state = location.state as { request?: any } | undefined;
        if (state?.request && state.request.request_id === id) {
          setRequestData(state.request);
          setSchool(state.request.school);
          setUser(state.request.requestedBy);
        }

        // --- programs ---
        if (programs.length === 0) {
          const { data } = await api.getProgramsByRole();
          setPrograms(data || []);
          if ((data || []).length === 1) {
            setProgram(data[0]);
          }
        }

        // --- coordinators ---
        if (program?.id) {
          const fcRes = await api.getFieldCoordinatorsByProgram(program.id);
          setFieldCoordinators(fcRes.data || []);
          setFieldCoordinator(null);
        } else {
          setFieldCoordinators([]);
          setFieldCoordinator(null);
        }
      } catch (error) {
        console.error("Error initializing form:", error);
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, [id, api, location.state, program, programs.length]);

  useEffect(() => {
    // --- update contact[0] from user ---
    if (user) {
      setContacts((prev) => {
        const updated = [...prev];
        updated[0].fields = updated[0].fields.map((f) =>
          f.name === "name"
            ? { ...f, value: user.name || "" }
            : f.name === "phone"
            ? { ...f, value: user.phone || "" }
            : f
        );
        return updated;
      });
    }

    // --- update address from school ---
    if (school) {
      setAddress({
        state: school.group1 || "",
        city: school.group2 || "",
        district: school.group3 || "",
        address: school.address || "",
      });
    }
  }, [user, school]);

  function handleContactChange(
    contactIndex: number,
    fieldName: string,
    value: string
  ) {
    setContacts((prev) => {
      const updated = [...prev];
      updated[contactIndex].fields = updated[contactIndex].fields.map((f) =>
        f.name === fieldName ? { ...f, value } : f
      );
      return updated;
    });
  }

  function handleAddressChange(name: string, value: string) {
    setAddress((prev) => ({ ...prev, [name]: value }));
  }
  const isSaveDisabled = () => {
    return (
      !address.state?.trim() ||
      !address.city?.trim() ||
      !address.district?.trim() ||
      !program ||
      !fieldCoordinator
    );
  };

  async function handleApprove() {
    try {
      // Convert contacts state to JSON
      let keyContacts = contacts.map((c) => {
        const obj: any = {};
        c.fields.forEach((f) => {
          obj[f.name] = f.value?.trim() || null;
        });
        return obj;
      });

      // 🔹 remove empty contacts (e.g. Contact 2 with no values)
      keyContacts = keyContacts.filter((c) =>
        Object.values(c).some((v) => v !== null && v !== "")
      );

      await Promise.all([
        api.updateSchoolStatus(
          requestData.school.id,
          STATUS.ACTIVE,
          {
            state: address.state,
            city: address.city,
            district: address.district,
            address: address.address,
          },
          keyContacts
        ),
        api.addUserToSchool(
          school.id,
          fieldCoordinator,
          RoleType.FIELD_COORDINATOR
        ),
        api.addUserToSchool(school.id, user, RoleType.PRINCIPAL),
        api.respondToSchoolRequest(
          requestData.id,
          requestData.respondedBy.id,
          STATUS.APPROVED
        ),
      ]);

      history.push(`${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}`);
    } catch (error) {
      console.error("Error saving school:", error);
    }
  }

  const dropdownMenuProps = {
    disablePortal: true,
    PaperProps: {
      style: {
        maxHeight: 300,
      },
    },
    anchorOrigin: {
      vertical: "top",
      horizontal: "center",
    },
    transformOrigin: {
      vertical: "bottom",
      horizontal: "center",
    },
    getContentAnchorEl: null,
  };

  return (
    <div className="school-form-main-container">
      <div className="school-form-header">
        {school && <SchoolNameHeaderComponent schoolName={school.name} />}
      </div>

      <div className="school-form-secondary-header">
        <Breadcrumb
          crumbs={[
            {
              label: "Pending",
              onClick: () =>
                history.push(`${PAGES.SIDEBAR_PAGE}${PAGES.REQUEST_LIST}`),
            },
            {
              label: "Request ID - " + id,
              onClick: () => history.goBack(),
            },
            {
              label: "Add School",
            },
          ]}
        />
      </div>
      {school && (
        <div className="school-form-container">
          <FormSection
            title={t("School Details")}
            fields={[
              {
                label: t("School Name"),
                name: "schoolName",
                value: school.name,
                required: true,
                editable: false,
              },
              {
                label: t("School ID") + " (UDISE)",
                name: "udise",
                value: school.udise,
                required: true,
                editable: false,
              },
            ]}
          />

          <FormSection
            title={t("Address & Location")}
            fields={[
              {
                label: t("State"),
                name: "state",
                value: address.state,
                required: true,
                editable: false,
                onChange: handleAddressChange,
              },
              {
                label: t("City"),
                name: "city",
                value: address.city,
                required: true,
                editable: false,
                onChange: handleAddressChange,
              },
              {
                label: t("District"),
                name: "district",
                value: address.district,
                required: true,
                editable: false,
                onChange: handleAddressChange,
              },
              {
                label: t("Address"),
                name: "address",
                value: address.address,
                editable: false,
                onChange: handleAddressChange,
              },
            ]}
          />

          <ContactFormSection
            title={t("Key Contacts")}
            fields={contacts}
            onChange={handleContactChange}
          />

          {/* Program + fieldCoordinator Dropdowns inline */}
          <Box className="school-form-dropdown-container">
            <Typography variant="h6" className="school-form-dropdown-title">
              {t("Program Details")}
            </Typography>
            <Grid container spacing={3}>
              {/* Program Dropdown */}
              <Grid size={{ xs: 12, md: 3.5 }}>
                <FormControl
                  fullWidth
                  size="small"
                  className="school-form-dropdown-form-control"
                >
                  <Typography className="school-form-dropdown-label">
                    {t("Program Name")}{" "}
                    <span className="school-form-dropdown-required">*</span>
                  </Typography>
                  <Select
                    value={program?.id || ""}
                    onChange={(e) => {
                      const selectedProgram = programs.find(
                        (p) => p.id === e.target.value
                      );
                      setProgram(selectedProgram || null);
                    }}
                    displayEmpty
                    renderValue={() =>
                      program?.name ? (
                        program.name
                      ) : (
                        <span className="school-form-dropdown-placeholder">
                          {t("Select Program")}
                        </span>
                      )
                    }
                    MenuProps={dropdownMenuProps as any}
                  >
                    {programs.map((p) => (
                      <MenuItem key={p.id ?? p.name} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* fieldCoordinator Dropdown */}
              <Grid size={{ xs: 12, md: 3.5 }}>
                <FormControl
                  fullWidth
                  size="small"
                  className="school-form-dropdown-form-control"
                >
                  <Typography className="school-form-dropdown-label">
                    {t("Field Coordinator")}{" "}
                    <span className="school-form-dropdown-required">*</span>
                  </Typography>
                  <Select
                    value={fieldCoordinator || ""}
                    onChange={(e) => {
                      const selectedFc = fieldCoordinators.find(
                        (fc) => fc.id === e.target.value
                      );
                      setFieldCoordinator(selectedFc || null);
                    }}
                    displayEmpty
                    renderValue={() =>
                      fieldCoordinator?.name ? (
                        fieldCoordinator.name
                      ) : (
                        <span className="school-form-dropdown-placeholder">
                          {t("Select Field Coordinator")}
                        </span>
                      )
                    }
                    MenuProps={dropdownMenuProps as any}
                  >
                    {fieldCoordinators.map((fc) => (
                      <MenuItem key={fc.id ?? fc.name} value={fc.id}>
                        {fc.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          <div className="user-details-button-row">
            <>
              <button
                className="user-details-cancel-btn"
                onClick={() => history.goBack()}
              >
                {t("Cancel")}
              </button>
              <button
                className="user-details-save-btn"
                onClick={handleApprove}
                disabled={isSaveDisabled()}
              >
                {t("Save")}
              </button>
            </>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolFormPage;
