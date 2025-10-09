import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  Breadcrumbs,
  Link,
  Grid,
  useTheme,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import { BsFillBellFill } from "react-icons/bs";
import { BiSolidRightArrow } from "react-icons/bi";
import { useHistory } from "react-router-dom";
import "./NewUserPageOps.css";
import CommonDialogBox from "../../common/CommonDialogBox";
import { SupabaseApi } from "../../services/api/SupabaseApi";
import { PAGES } from "../../common/constants";
import { t } from "i18next";
import { ServiceConfig } from "../../services/ServiceConfig";
import { OpsUtil } from "../OpsUtility/OpsUtil";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

const validateEmailOrPhone = (value: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(value)) return true;
  const digitsOnly = value.replace(/\D/g, "");
  return /^\d{10}$/.test(digitsOnly);
};

const roles = [
  { label: "Program Manager", value: "program_manager" },
  { label: "Field Coordinator", value: "field_coordinator" },
];

const NewUserPage: React.FC = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    role: "",
  });
  const [tempPhone, setTempPhone] = useState<string>("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;

  const [showAlert, setShowAlert] = useState(false);
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    message: "",
  });
  const [validationDialog, setValidationDialog] = useState({
    open: false,
    message: "",
  });
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    message: "",
  });
  const handlePhoneChange = (fullNumber: string) => {
    setTempPhone(fullNumber);
  };
  const handleInputChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      let value = event.target.value;
      if (field === "phone") {
        value = value.replace(/\D/g, "");
      }
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    setForm((prev) => ({
      ...prev,
      role: event.target.value as string,
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, role } = form;

    if (!name.trim() || !role.trim()) {
      setShowAlert(true);
      return;
    }

    if (!email.trim() && !tempPhone.trim()) {
      setShowAlert(true);
      return;
    }

    if (email && !validateEmailOrPhone(email)) {
      setValidationDialog({
        open: true,
        message: "Please enter a valid email address.",
      });
      return;
    }

    let finalPhone = "";
    if (tempPhone) {
      let digitsOnly = tempPhone.replace(/\D/g, "");

      if (digitsOnly.startsWith("91") && digitsOnly.length > 10) {
        digitsOnly = digitsOnly.slice(2);
      } else {
        digitsOnly = digitsOnly;
      }

      if (digitsOnly.length < 10) {
        setValidationDialog({
          open: true,
          message: "Phone number must be 10 digits.",
        });
        return;
      }

      finalPhone = digitsOnly;
      if (!validateEmailOrPhone(finalPhone)) {
        setValidationDialog({
          open: true,
          message: "Please enter a valid phone number",
        });
        return;
      }
    }

    const payload = { ...form, phone: finalPhone };
    const { success, error, user_id, message } = await api.createOrAddUserOps(
      payload
    );

    const errorMsgMap: Record<string, string> = {
      "auth-create-failed":
        "Failed to create authentication credentials. Please try again.",
      "insert-user-failed":
        "User creation failed. Please check the details and try again.",
      "insert-role-failed":
        "Unable to assign role to the user. Contact support.",
      "unexpected-error":
        "An unexpected error occurred. Please try again later.",
      "unknown-error": "Something went wrong. Please try again.",
    };

    const successMsgMap: Record<string, string> = {
      "success-created": "User successfully created.",
      "success-added-to-special_users": "Role successfully added to user.",
      "success-user-already-exists": "User already exists with this role.",
    };

    const knownErrors = Object.keys(errorMsgMap);
    const isKnownError = !success || (message && knownErrors.includes(message));

    if (isKnownError) {
      const safeError = message ?? "unknown-error";
      setErrorDialog({
        open: true,
        message: errorMsgMap[safeError] || "Failed to add user.",
      });
      return;
    }

    const displayMsg =
      successMsgMap[message as keyof typeof successMsgMap] || message || "";
    setSuccessDialog({ open: true, message: displayMsg });
  };

  const handleCancel = () => {
    history.goBack();
  };

  return (
    <Box className="ops-new-user-page-container">
      <Box className="ops-new-user-header">
        <Typography
          variant={isMobile ? "h5" : "h4"}
          className="ops-new-user-header_title"
        >
          {t("New User")}
        </Typography>
        <Box className="ops-new-user-header_icon-container">
          <IconButton className="ops-new-user-header_icon">
            <BsFillBellFill size={isMobile ? 18 : 22} />
          </IconButton>
        </Box>
      </Box>

      <Box className="ops-new-user-content">
        <Breadcrumbs
          className="ops-new-user-breadcrumbs"
          separator={<BiSolidRightArrow size={11} />}
        >
          <Link
            underline="hover"
            color="inherit"
            onClick={() => history.goBack()}
          >
            {t("Users")}
          </Link>
          <Typography color="text.primary" fontWeight="bold">
            {t("New User")}
          </Typography>
        </Breadcrumbs>

        <form onSubmit={handleSubmit} autoComplete="off">
          <Grid
            container
            spacing={isMobile ? 1.5 : 2}
            className="ops-new-user-form_grid"
          >
            <Grid size={{ xs: 12 }} className="ops-new-user-form_group">
              <Typography className="ops-new-user-form_label">
                {t("Name")}
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={form.name}
                onChange={handleInputChange("name")}
              />
            </Grid>
            <Grid size={{ xs: 12 }} className="ops-new-user-form_group">
              <Typography className="ops-new-user-form_label">
                {t("Phone Number")}
              </Typography>

              <PhoneInput
                defaultCountry="in"
                value={tempPhone}
                disableCountryGuess
                onChange={handlePhoneChange}
                inputClassName="w-full"
                className="new-user-page-phone-input"
                inputProps={{
                  onKeyDown: (e) => {
                    const input = e.currentTarget;
                    const selectionStart = input.selectionStart ?? 0;

                    const prefixMatch = input.value.match(/^\+\d+\s*/);
                    const prefixLength = prefixMatch
                      ? prefixMatch[0].length
                      : 0;

                    if (
                      selectionStart <= prefixLength &&
                      ["Backspace", "Delete"].includes(e.key)
                    ) {
                      e.preventDefault();
                    }
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }} className="ops-new-user-form_group">
              <Typography className="ops-new-user-form_label">
                {t("Email ID")}
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={form.email}
                onChange={handleInputChange("email")}
              />
            </Grid>
            <Grid size={{ xs: 12 }} className="ops-new-user-form_group">
              <Typography className="ops-new-user-form_label">
                {t("Roles")}
              </Typography>
              <Select
                fullWidth
                size="small"
                displayEmpty
                value={form.role}
                onChange={handleRoleChange}
                renderValue={(selected) =>
                  selected
                    ? roles.find((r) => r.value === selected)?.label
                    : "Select Role"
                }
              >
                <MenuItem disabled value="">
                  {t("Select Role")}
                </MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
          </Grid>

          <Box className="ops-new-user-form-actions">
            <Button
              type="button"
              variant="text"
              onClick={handleCancel}
              className="ops-new-user-form-actions_button--cancel"
            >
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              variant="contained"
              className="ops-new-user-form-actions_button--save"
            >
              {t("Save")}
            </Button>
          </Box>
        </form>
      </Box>

      <CommonDialogBox
        showConfirmFlag={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header={t("Missing Contact Info!") ?? ""}
        message={
          t(
            "Please input proper name and role with least a phone number or email address."
          ) ?? ""
        }
        rightButtonText={t("OK") ?? ""}
        rightButtonHandler={() => setShowAlert(false)}
      />

      <CommonDialogBox
        showConfirmFlag={validationDialog.open}
        onDidDismiss={() => setValidationDialog({ open: false, message: "" })}
        header={t("Invalid Format") ?? ""}
        message={t(validationDialog.message)}
        rightButtonText={t("OK") ?? ""}
        rightButtonHandler={() =>
          setValidationDialog({ open: false, message: "" })
        }
      />

      <CommonDialogBox
        showConfirmFlag={successDialog.open}
        onDidDismiss={() => setSuccessDialog({ open: false, message: "" })}
        header={t("Success") ?? ""}
        message={t(successDialog.message)}
        rightButtonText={t("OK") ?? ""}
        rightButtonHandler={() => {
          setSuccessDialog({ open: false, message: "" });
          history.push(`${PAGES.SIDEBAR_PAGE}${PAGES.USERS}`);
        }}
      />

      <CommonDialogBox
        showConfirmFlag={errorDialog.open}
        onDidDismiss={() => setErrorDialog({ open: false, message: "" })}
        header={t("Error") ?? ""}
        message={t(errorDialog.message ?? "")}
        rightButtonText={t("OK") ?? ""}
        rightButtonHandler={() => setErrorDialog({ open: false, message: "" })}
      />
    </Box>
  );
};

export default NewUserPage;
