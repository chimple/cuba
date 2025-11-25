import React, { useState } from "react";
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
import { RoleType } from "../../interface/modelInterfaces";

export type UserSchoolClassParams = {
  name?: string;
  phoneNumber?: string;
  email?: string;
  schoolId?: string;
  role?: RoleType.TEACHER | RoleType.PRINCIPAL;
  classId?: string;
};

export type UserSchoolClassResult = {
  user: any;
  schoolUser: any | null;
  classUser: any | null;
  isNewUser: boolean;
};

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const roles = [
  { label: "Program Manager", value: "program_manager" },
  { label: "Field Coordinator", value: "field_coordinator" },
];

export const normalizePhone10 = (raw: string): string => {
  let digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length > 10) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length > 10) digits = digits.slice(1);
  if (digits.length > 10) digits = digits.slice(-10);
  return digits;
};

const NewUserPage: React.FC = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    role: "",
  });

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
  const [errorDialog, setErrorDialog] = useState({ open: false, message: "" });

  const handleInputChange =
    (field: "name" | "email") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setForm((prev) => {
        if (field === "email") {
          return value
            ? { ...prev, email: value, phone: "" }
            : { ...prev, email: value };
        }
        return { ...prev, [field]: value };
      });
    };

  const handlePhoneChange = (value: string) => {
    setForm((prev) => {
      if (!prev.email) {
        return { ...prev, phone: value };
      }
      return { ...prev, phone: "" };
    });
  };

  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    setForm((prev) => ({ ...prev, role: event.target.value as string }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, phone, role } = form;

    if (!name.trim() || !role.trim()) {
      setShowAlert(true);
      return;
    }

    const hasEmail = !!email.trim();
    const chosenEmail = hasEmail ? email.trim().toLowerCase() : "";
    const normalizedPhone10 = normalizePhone10(phone);
    const hasPhone = !hasEmail && !!normalizedPhone10;

    if (!hasEmail && !hasPhone) {
      setShowAlert(true);
      return;
    }

    if (hasEmail) {
      if (!emailRegex.test(chosenEmail)) {
        setValidationDialog({
          open: true,
          message: "Please enter a valid email address.",
        });
        return;
      }
    } else {
      if (normalizedPhone10.length !== 10) {
        setValidationDialog({
          open: true,
          message: "Phone number must be 10 digits.",
        });
        return;
      }
    }

    const payload = {
      name: name.trim(),
      role: role.trim(),
      email: hasEmail ? chosenEmail : "",
      phone: hasEmail ? "" : normalizedPhone10,
    };

    const { success, message } = await api.createOrAddUserOps(payload);

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
      const safeError = (message as string) ?? "unknown-error";
      setErrorDialog({
        open: true,
        message: errorMsgMap[safeError] || "Failed to add user.",
      });
      return;
    }

    const displayMsg =
      successMsgMap[message as keyof typeof successMsgMap] ||
      (message as string) ||
      "";
    setSuccessDialog({ open: true, message: displayMsg });
  };

  const handleCancel = () => history.goBack();

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
                value={form.phone}
                onChange={handlePhoneChange}
                disableCountryGuess
                className="new-user-page-phone-input"
                inputClassName="w-full"
                disabled={!!form.email}
                inputProps={{
                  onKeyDown: (e) => {
                    const input = e.currentTarget as HTMLInputElement;
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
