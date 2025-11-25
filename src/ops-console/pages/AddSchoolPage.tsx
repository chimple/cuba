import React, { useEffect, useState, useRef } from "react";
import FormSection from "../components/SchoolRequestComponents/FormSection";
import Breadcrumb from "../components/Breadcrumb";
import { Box, Grid, Typography, FormLabel, TextField } from "@mui/material";
import ContactFormSection from "../components/SchoolRequestComponents/ContactFormSection";
import "./AddSchoolPage.css";
import { t } from "i18next";
import { PAGES, STATUS } from "../../common/constants";
import { ServiceConfig } from "../../services/ServiceConfig";
import { useHistory } from "react-router-dom";
import { RoleType } from "../../interface/modelInterfaces";
import DropdownField from "../components/DropdownField";

const DEFAULT_COUNTRY = "India";

const AddSchoolPage: React.FC = () => {
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState("");
  const [udise, setUdise] = useState("");
  const [schoolModel, setSchoolModel] = useState("");

  const [program, setProgram] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [fieldCoordinator, setFieldCoordinator] = useState<any>(null);
  const [fieldCoordinators, setFieldCoordinators] = useState<any[]>([]);

  const [address, setAddress] = useState({
    state: "",
    city: "",
    district: "",
    address: "",
    cluster: "",
    block: "",
    link: "",
  });

  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);

  const [isStatesLoading, setStatesLoading] = useState(false);
  const [isDistrictsLoading, setDistrictsLoading] = useState(false);
  const [isBlocksLoading, setBlocksLoading] = useState(false);
  const [contacts, setContacts] = useState([
    {
      subheader: "Contact 1",
      required: true,
      fields: [
        { label: "Name", name: "name", value: "", required: true },
        { label: "Phone Number", name: "phone", value: "", required: true },
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

  const handleAddressChange = (name: string, value: string) => {
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (
    contactIndex: number,
    fieldName: string,
    value: string
  ) => {
    setContacts((prev) => {
      const updated = [...prev];
      updated[contactIndex].fields = updated[contactIndex].fields.map((f) =>
        f.name === fieldName ? { ...f, value } : f
      );
      return updated;
    });
  };

  const isSaveDisabled = () => {
    return (
      !schoolName ||
      !udise ||
      !schoolModel ||
      !address.state ||
      !address.district ||
      !program ||
      !fieldCoordinator ||
      !contacts[0].fields[0].value ||
      !contacts[0].fields[1].value
    );
  };
  const handleUdiseChange = async (value: string) => {
    value = value.replace(/\D/g, "").slice(0, 11);
    setUdise(value);

    if (value.length === 11) {
      try {
        const res = await api.getSchoolDataByUdise(value);
        if (res) {
          if (res.school_name) setSchoolName(res.school_name);

          setAddress((prev) => ({
            ...prev,
            state: res.state || prev.state,
            district: res.district || prev.district,
            block: res.block || prev.block,
            city: res.village || prev.city,
            cluster: res.cluster || prev.cluster,
          }));
        }
      } catch (err) {
        console.error("UDISE fetch error:", err);
      }
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        setStatesLoading(true);
        const data = await api.getGeoData({ p_country: DEFAULT_COUNTRY });
        setStates(Array.isArray(data) ? data : []);
      } catch {
        setStates([]);
      } finally {
        setStatesLoading(false);
      }
      try {
        const { data } = await api.getProgramsByRole();
        setPrograms(data || []);
        if (data?.length === 1) setProgram(data[0]);
      } catch {
        setPrograms([]);
      }

      setLoading(false);
    }

    init();
  }, [api]);

  useEffect(() => {
    if (!address.state) {
      setDistricts([]);
      return;
    }

    async function loadDistricts() {
      try {
        setDistrictsLoading(true);
        const data = await api.getGeoData({
          p_country: DEFAULT_COUNTRY,
          p_state: address.state,
        });
        setDistricts(Array.isArray(data) ? data : []);
      } catch {
        setDistricts([]);
      } finally {
        setDistrictsLoading(false);
      }
    }

    loadDistricts();
  }, [address.state]);

  useEffect(() => {
    if (!address.district) {
      setBlocks([]);
      return;
    }

    async function loadBlocks() {
      try {
        setBlocksLoading(true);
        const data = await api.getGeoData({
          p_country: DEFAULT_COUNTRY,
          p_state: address.state,
          p_district: address.district,
        });
        setBlocks(Array.isArray(data) ? data : []);
      } catch {
        setBlocks([]);
      } finally {
        setBlocksLoading(false);
      }
    }

    loadBlocks();
  }, [address.district]);

  useEffect(() => {
    if (!program?.id) {
      setFieldCoordinators([]);
      setFieldCoordinator(null);
      return;
    }

    async function loadCoordinators() {
      try {
        const fc = await api.getFieldCoordinatorsByProgram(program.id);
        setFieldCoordinators(fc.data || []);
        setFieldCoordinator(null);
      } catch {
        setFieldCoordinators([]);
        setFieldCoordinator(null);
      }
    }

    loadCoordinators();
  }, [program]);

  async function handleApprove() {
    let keyContacts = contacts
      .map((c) => {
        const obj: any = {};
        c.fields.forEach((f) => {
          obj[f.name] = f.value?.trim() || null;
        });
        return obj;
      })
      .filter((c) => Object.values(c).some((v) => v));

    try {
      const school = await api.createSchool(
        schoolName,
        address.state,
        address.district,
        address.block,
        address.cluster,
        null,
        program.id,
        udise,
        address.address,
        DEFAULT_COUNTRY
      );
      await api.insertSchoolDetails(
        school.id,
        schoolModel,
        address.link,
        keyContacts
      );

      await api.addUserToSchool(
        school.id,
        fieldCoordinator,
        RoleType.FIELD_COORDINATOR
      );

      history.push(`${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}`);
    } catch (err) {
      console.error("Save error:", err);
    }
  }

  return (
    <div className="add-school-main-container">
      <div className="add-school-secondary-header">
        <Breadcrumb
          crumbs={[
            {
              label: "Schools",
              onClick: () =>
                history.push(`${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}`),
            },
            { label: "Add School" },
          ]}
        />
      </div>

      <div className="add-school-container">
        <Box
          sx={{
            borderRadius: "8px",
            padding: "10px",
            marginBottom: "20px",
            backgroundColor: "#f9fbfd",
          }}
        >
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            sx={{ marginBottom: "16px", fontSize: "1rem", color: "#111827" }}
          >
            {t("School Details")}
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4.5 }}>
              <FormLabel sx={{ color: "#111827" }}>
                {t("School Name")} <span style={{ color: "red" }}>*</span>
              </FormLabel>
              <TextField
                fullWidth
                size="small"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4.5 }}>
              <FormLabel sx={{ color: "#111827" }}>
                {t("School UDISE")} <span style={{ color: "red" }}>*</span>
              </FormLabel>
              <TextField
                fullWidth
                size="small"
                value={udise}
                inputProps={{
                  maxLength: 11,
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                }}
                placeholder="Enter 11 digit udise code"
                onChange={(e) => handleUdiseChange(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <DropdownField
                label={t("School Model")}
                required
                value={schoolModel}
                onChange={setSchoolModel}
                placeholder={t("Select Model") ?? ""}
                options={[
                  { label: "At Home", value: "at_home" },
                  { label: "At School", value: "at_school" },
                  { label: "Hybrid", value: "hybrid" },
                ]}
                openDirection="down"
              />
            </Grid>
          </Grid>
        </Box>
        <Box
          sx={{
            borderRadius: "8px",
            padding: "10px",
            marginBottom: "20px",
            backgroundColor: "#f9fbfd",
          }}
        >
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            sx={{ marginBottom: "16px", fontSize: "1rem", color: "#111827" }}
          >
            {t("Address & Location")}
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <DropdownField
                label={t("State")}
                required
                value={address.state}
                onChange={(val) => handleAddressChange("state", val)}
                options={states}
                placeholder={t("Select State") ?? ""}
                loading={isStatesLoading}
                disabled={isStatesLoading}
                openDirection="down"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <DropdownField
                label={t("District")}
                required
                value={address.district}
                onChange={(val) => handleAddressChange("district", val)}
                options={districts}
                placeholder={t("Select District") ?? ""}
                disabled={!address.state}
                loading={isDistrictsLoading}
                openDirection="down"
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ marginTop: "8px" }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <DropdownField
                label={t("Block")}
                value={address.block}
                onChange={(val) => handleAddressChange("block", val)}
                options={blocks}
                placeholder={t("Select Block") ?? ""}
                disabled={!address.district}
                loading={isBlocksLoading}
                openDirection="down"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormLabel
                sx={{ fontSize: "1rem", color: "#111827", fontWeight: 500 }}
              >
                Cluster
              </FormLabel>
              <TextField
                fullWidth
                placeholder="Enter Cluster"
                value={address.cluster}
                onChange={(e) => handleAddressChange("cluster", e.target.value)}
                variant="outlined"
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormLabel
                sx={{ fontSize: "1rem", color: "#111827", fontWeight: 500 }}
              >
                Location link
              </FormLabel>
              <TextField
                fullWidth
                value={address.link}
                onChange={(e) => handleAddressChange("link", e.target.value)}
                variant="outlined"
                size="small"
              />
            </Grid>
          </Grid>
        </Box>

        <ContactFormSection
          title={t("Key Contacts")}
          fields={contacts}
          onChange={handleContactChange}
        />

        <Box className="add-school-dropdown-container">
          <Typography variant="h6" className="add-school-dropdown-title">
            {t("Program Details")}
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 3.5 }}>
              <DropdownField
                label={t("Program Name")}
                required
                value={program?.id || ""}
                onChange={(val) => {
                  const selected = programs.find((p) => p.id === val);
                  setProgram(selected || null);
                }}
                options={programs.map((p) => ({ label: p.name, value: p.id }))}
                placeholder={t("Select Program") ?? ""}
                openDirection="down"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3.5 }}>
              <DropdownField
                label={t("Field Coordinator")}
                required
                value={fieldCoordinator?.id || ""}
                onChange={(val) => {
                  const selected = fieldCoordinators.find((f) => f.id === val);
                  setFieldCoordinator(selected || null);
                }}
                options={fieldCoordinators.map((fc) => ({
                  label: fc.name,
                  value: fc.id,
                }))}
                placeholder={t("Select Field Coordinator") ?? ""}
                openDirection="down"
              />
            </Grid>
          </Grid>
        </Box>

        <div className="add-school-button-row">
          <button
            className="add-school-cancel-btn"
            onClick={() => history.goBack()}
          >
            {t("Cancel")}
          </button>

          <button
            className="add-school-save-btn"
            onClick={handleApprove}
            disabled={isSaveDisabled()}
          >
            {t("Save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSchoolPage;
