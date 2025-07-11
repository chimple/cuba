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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const [showAlert, setShowAlert] = useState(false);
  const [successDialog, setSuccessDialog] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: "" });

  const handleInputChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: event.target.value,
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
    const { name, email, phone, role } = form;
    if (!name.trim() || !role.trim()) {
      setShowAlert(true);
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setShowAlert(true);
      return;
    }
    const { success, error, user_id, message } =
      await api.createOrAddUserOps(form);
    const readableMsgMap: Record<string, string> = {
      "success-created": "User successfully created.",
      "success-added-to-special_users": "Role successfully added to user.",
      "success-user-already-exists": "User already exists with this role.",
    };
    const displayMsg =
      readableMsgMap[message as keyof typeof readableMsgMap]
    setSuccessDialog({ open: true, message: displayMsg });
    console.log("Returned message key:", message);

  };

  const handleCancel = () => {
    history.goBack();
  };

  return (
    <Box className="new-user-page-container">
      <Box className="new-user-header">
        <Typography
          variant={isMobile ? "h5" : "h4"}
          className="new-user-header_title"
        >
          {t("New User")}
        </Typography>
        <Box className="new-user-header_icon-container">
          <IconButton className="new-user-header_icon">
            <BsFillBellFill size={isMobile ? 18 : 22} />
          </IconButton>
        </Box>
      </Box>

      <Box className="new-user-content">
        <Breadcrumbs
          className="new-user-breadcrumbs"
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
            className="new-user-form_grid"
          >
            <Grid item xs={12} className="new-user-form_group">
              <Typography className="new-user-form_label">{t("Name")}</Typography>
              <TextField
                fullWidth
                size="small"
                value={form.name}
                onChange={handleInputChange("name")}
              />
            </Grid>
            <Grid item xs={12} className="new-user-form_group">
              <Typography className="new-user-form_label">
                {t("Phone Number")}
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={form.phone}
                onChange={handleInputChange("phone")}
              />
            </Grid>
            <Grid item xs={12} className="new-user-form_group">
              <Typography className="new-user-form_label">{t("Email ID")}</Typography>
              <TextField
                fullWidth
                size="small"
                value={form.email}
                onChange={handleInputChange("email")}
              />
            </Grid>
            <Grid item xs={12} className="new-user-form_group">
              <Typography className="new-user-form_label">{t("Roles")}</Typography>
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

          <Box className="new-user-form-actions">
            <Button
              type="button"
              variant="text"
              onClick={handleCancel}
              className="new-user-form-actions_button--cancel"
            >
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              variant="contained"
              className="new-user-form-actions_button--save"
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
        message={t("Please input proper name and role with least a phone number or email address.") ?? ""}
        rightButtonText={t("OK") ?? ""}
        rightButtonHandler={() => setShowAlert(false)}
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
    </Box>
  );
};

export default NewUserPage;
