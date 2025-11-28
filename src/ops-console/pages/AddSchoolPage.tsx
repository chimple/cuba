import React, { useEffect, useState, useRef } from "react";
import FormSection from "../components/SchoolRequestComponents/FormSection";
import Breadcrumb from "../components/Breadcrumb";
import { Box, Grid, Typography, FormLabel, TextField } from "@mui/material";
import ContactFormSection from "../components/SchoolRequestComponents/ContactFormSection";
import "./AddSchoolPage.css";
import { t } from "i18next";
import { PAGES, STATUS } from "../../common/constants";
import { ServiceConfig } from "../../services/ServiceConfig";
import { useHistory, useLocation } from "react-router-dom";
import { RoleType } from "../../interface/modelInterfaces";
import DropdownField from "../components/DropdownField";

const DEFAULT_COUNTRY = "India";

const AddSchoolPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const editData: any = location.state;
  const api = ServiceConfig.getI().apiHandler;
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState("");
  const [udise, setUdise] = useState("");
  const [schoolModel, setSchoolModel] = useState("");

  const [program, setProgram] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [fieldCoordinator, setFieldCoordinator] = useState<any>(null);
  const [fieldCoordinators, setFieldCoordinators] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [lockDropdowns, setLockDropdowns] = useState(false);
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);

  const [isStatesLoading, setStatesLoading] = useState(false);
  const [isDistrictsLoading, setDistrictsLoading] = useState(false);
  const [isBlocksLoading, setBlocksLoading] = useState(false);

  const [address, setAddress] = useState({
    state: "",
    district: "",
    block: "",
    cluster: "",
    address: "",
    link: "",
  });

  const [contacts, setContacts] = useState([
    {
      subheader: t("Contact") + " 1",
      required: true,
      fields: [
        { label: t("Name"), name: "name", value: "", required: true },
        { label: t("Phone Number"), name: "phone", value: "", required: true },
      ],
    },
    {
      subheader: t("Contact") + " 2",
      fields: [
        { label: t("Name"), name: "name", value: "" },
        { label: t("Phone Number"), name: "phone", value: "" },
      ],
    },
  ]);

  useEffect(() => {
    if (!editData) return;

    const school = editData.schoolData;

    setSchoolName(school?.name || "");
    setUdise(school?.udise || "");
    setSchoolModel(school?.model || "");

    setAddress({
      state: school?.group1 || "",
      district: school?.group2 || "",
      block: school?.group3 || "",
      cluster: school?.group4 || "",
      address: school?.address || "",
      link: school?.location_link || "",
    });

    const rawKeyContacts = school?.key_contacts;
    let parsedKeyContacts = [];
    if (rawKeyContacts) {
      try {
        parsedKeyContacts = typeof rawKeyContacts === "string" ? JSON.parse(rawKeyContacts) : rawKeyContacts;
        if (!Array.isArray(parsedKeyContacts)) parsedKeyContacts = [];
      } catch (e) {
        parsedKeyContacts = [];
      }
    }

    if (parsedKeyContacts.length) {
      const contactsArray = [parsedKeyContacts[0] || {}, parsedKeyContacts[1] || {}];

      setContacts(
        contactsArray.map((c: any, i: number) => ({
          subheader: `Contact ${i + 1}`,
          required: i === 0,
          fields: [
            {
              label: t("Name"),
              name: "name",
              value: c.name || "",
              required: i === 0,
            },
            {
              label: t("Phone Number"),
              name: "phone",
              value: c.phone || "",
              required: i === 0,
            },
          ],
        }))
      );
    }

    setProgram(editData.programData);

    async function fetch() {
      const fcs = await api.getFieldCoordinatorsForSchools([school.id]);
      const fc = fcs[0]?.users[0] || null;
      setFieldCoordinator(fc);

      // Only lock if both exist at the beginning
      if (editData.programData && fc) {
        setLockDropdowns(true);
      }
    }
    fetch();
  }, [editData]);

  const handleAddressChange = (name: string, value: string) => {
    setAddress((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "state") {
        updated.district = "";
        updated.block = "";
        updated.cluster = "";
      }
      if (name === "district") {
        updated.block = "";
        updated.cluster = "";
      }
      if (name === "block") {
        updated.cluster = "";
      }
      return updated;
    });
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
      !contacts[0].fields[1].value ||
      errorMessage !== ""
    );
  };
  const handleUdiseChange = async (value: string) => {
    value = value.replace(/\D/g, "").slice(0, 11);
    setUdise(value);
    setErrorMessage("");

    if (value.length === 11) {
      try {
        const res = await api.getSchoolDataByUdise(value);
        if (res && res.id && !editData) {
          setErrorMessage("A school with this UDISE code already exists.");
          console.log("Existing school data:", res, res.id);
          return;
        }
        if (res) {
          if (res.school_name) setSchoolName(res.school_name);

          setAddress((prev) => ({
            ...prev,
            state: res.state || prev.state,
            district: res.district || prev.district,
            block: res.block || prev.block,
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
      } catch {
        setFieldCoordinators([]);
      } finally {
        if (!editData) setFieldCoordinator(null);
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
      if (editData) {
        await api.updateSchoolProfile(
          editData.schoolData,
          schoolName,
          address.state,
          address.district,
          address.block,
          null,
          address.cluster,
          program.id,
          udise,
          address.address
        );
        await api.insertSchoolDetails(
          editData.schoolData.id,
          schoolModel,
          address.link,
          keyContacts
        );
        if (!lockDropdowns) {
          await api.addUserToSchool(
            editData.schoolData.id,
            fieldCoordinator,
            RoleType.FIELD_COORDINATOR
          );
        }
      } else {
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
          DEFAULT_COUNTRY,
          true,
          false
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
      }

      history.push(`${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}`);
    } catch (err) {
      console.error("Save error:", err);
    }
  }

  return (
    <div className="add-school-main-container">
      <div className="add-school-secondary-header">
        <Breadcrumb
          crumbs={
            !editData
              ? [
                  {
                    label: t("Schools"),
                    onClick: () =>
                      history.push(`${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}`),
                  },
                  { label: t("Add School") },
                ]
              : [
                  {
                    label: "Schools",
                    onClick: () =>
                      history.push(`${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}`),
                  },
                  {
                    label: schoolName,
                    onClick: () => history.goBack(),
                  },
                  {
                    label: "Edit",
                  },
                ]
          }
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
                {t("School Name")} <span className="add-school-requird">*</span>
              </FormLabel>
              <TextField
                fullWidth
                size="small"
                value={schoolName}
                placeholder={t("School Name") ?? ""}
                onChange={(e) => setSchoolName(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4.5 }}>
              <FormLabel sx={{ color: "#111827" }}>
                {t("School ID (UDISE)")}{" "}
                <span className="add-school-requird">*</span>
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
                placeholder={t("Enter 11 digit UDISE code") ?? ""}
                onChange={(e) => handleUdiseChange(e.target.value)}
              />
              {errorMessage && (
                <div className="class-form-error">{errorMessage}</div>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <DropdownField
                label={t("School") + " " + t("Model")}
                required
                value={schoolModel}
                onChange={setSchoolModel}
                placeholder={t("Select Model") ?? ""}
                options={[
                  { label: t("At Home"), value: "at_home" },
                  { label: t("At School"), value: "at_school" },
                  { label: t("Hybrid"), value: "hybrid" },
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
                {t("Cluster")}
              </FormLabel>
              <TextField
                fullWidth
                placeholder={t("Enter Cluster") ?? ""}
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
                {t("Location link")}
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
                disabled={lockDropdowns}
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
                disabled={lockDropdowns}
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
