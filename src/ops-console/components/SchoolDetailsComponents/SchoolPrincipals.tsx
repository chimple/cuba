import React, { useState, useMemo, useCallback, useEffect } from "react";
import DataTableBody, { Column } from "../DataTableBody";
import DataTablePagination from "../DataTablePagination";
import { Typography, Box, CircularProgress } from "@mui/material";
import { t } from "i18next";
import "./SchoolPrincipals.css";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { PrincipalInfo } from "../../../common/constants";
import { Button as MuiButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FormCard, { FieldConfig, MessageConfig } from "./FormCard";
import { RoleType } from "../../../interface/modelInterfaces";
import { emailRegex, normalizePhone10 } from "../../pages/NewUserPageOps";

interface DisplayPrincipal {
  id: string;
  name: string;
  gender: string;
  phoneNumber: string;
  emailDisplay: string;
}

interface SchoolPrincipalsProps {
  data: {
    principals?: PrincipalInfo[];
    totalPrincipalCount?: number;
  };
  isMobile: boolean;
  schoolId: string;
}

const ROWS_PER_PAGE = 20;

const SchoolPrincipals: React.FC<SchoolPrincipalsProps> = ({
  data,
  schoolId,
  isMobile,
}) => {
  const [principals, setPrincipals] = useState<PrincipalInfo[]>(
    data.principals || []
  );
  const [totalCount, setTotalCount] = useState<number>(
    data.totalPrincipalCount || 0
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState<string>("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [isAddPrincipalModalOpen, setIsAddPrincipalModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<MessageConfig | undefined>();
  const api = ServiceConfig.getI().apiHandler;

  const fetchPrincipals = useCallback(
    async (currentPage: number) => {
      setIsLoading(true);
      const api = ServiceConfig.getI().apiHandler;
      try {
        const response = await api.getPrincipalsForSchoolPaginated(
          schoolId,
          currentPage,
          ROWS_PER_PAGE
        );
        setPrincipals(response.data);
        setTotalCount(response.total);
      } catch (error) {
        console.error("Failed to fetch principals:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [schoolId]
  );

  useEffect(() => {
    if (page === 1) {
      setPrincipals(data.principals || []);
      setTotalCount(data.totalPrincipalCount || 0);
      return;
    }
    fetchPrincipals(page);
  }, [page, fetchPrincipals, data.principals, data.totalPrincipalCount]);

  const handlePageChange = (newPage: number) => setPage(newPage);
  const handleSort = useCallback(
    (key: string) => {
      const isAsc = orderBy === key && order === "asc";
      setOrder(isAsc ? "desc" : "asc");
      setOrderBy(key);
    },
    [order, orderBy]
  );

  const displayPrincipals = useMemo((): DisplayPrincipal[] => {
    let sorted = [...principals].sort((a, b) => {
      let aValue, bValue;
      switch (orderBy) {
        case "name":
          aValue = a.name || "";
          bValue = b.name || "";
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case "gender":
          aValue = a.gender || "";
          bValue = b.gender || "";
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case "phoneNumber":
          aValue = a.phone || "";
          bValue = b.phone || "";
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case "emailDisplay":
          aValue = a.email || "";
          bValue = b.email || "";
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        default:
          return 0;
      }
    });
    return sorted.map((p) => ({
      id: p.id,
      name: p.name || "N/A",
      gender: p.gender || "N/A",
      phoneNumber: p.phone || "N/A",
      emailDisplay: p.email || "N/A",
    }));
  }, [principals, order, orderBy]);

  const pageCount = Math.ceil(totalCount / ROWS_PER_PAGE);
  const isDataPresent = displayPrincipals.length > 0;
  const handleAddNewPrincipal = useCallback(() => {
    setErrorMessage(undefined);
    setIsAddPrincipalModalOpen(true);
  }, []);

  const handleCloseAddTeacherModal = () => {
    setIsAddPrincipalModalOpen(false);
    setErrorMessage(undefined);
  };

  const handlePrincipalSubmit = useCallback(
    async (values: Record<string, string>) => {
      try {
        const name = (values.name ?? "").toString().trim();
        const rawEmail = (values.email ?? "").toString().trim();
        const rawPhone = (values.phoneNumber ?? "").toString();
        if (!name) {
          setErrorMessage({
            text: "Principal name is required.",
            type: "error",
          });
          return;
        }
        const email = rawEmail.toLowerCase();
        const normalizedPhone = normalizePhone10(rawPhone);
        const hasEmail = !!email;
        const hasPhone = !hasEmail && !!normalizedPhone;
        if (!hasEmail && !hasPhone) {
          setErrorMessage({
            text: "Please provide either an email or a phone number.",
            type: "error",
          });
          return;
        }
        let finalEmail = "";
        let finalPhone = "";
        if (hasEmail) {
          if (!emailRegex.test(email)) {
            setErrorMessage({
              text: "Please enter a valid email address.",
              type: "error",
            });
            return;
          }
          finalEmail = email;
        } else {
          if (normalizedPhone.length !== 10) {
            setErrorMessage({
              text: "Phone number must be 10 digits.",
              type: "error",
            });
            return;
          }
          finalPhone = normalizedPhone;
        }
        await api.getOrcreateschooluser({
          name,
          phoneNumber: finalPhone || undefined,
          email: finalEmail || undefined,
          schoolId,
          role: RoleType.PRINCIPAL,
        });
        setIsAddPrincipalModalOpen(false);
        setPage(1);
        await fetchPrincipals(1);
      } catch (e) {
        console.error("Failed to add principal:", e);
      }
    },
    [schoolId, fetchPrincipals]
  );

  const teacherFormFields: FieldConfig[] = useMemo(
    () => [
      {
        name: "name",
        label: "Principal Name",
        kind: "text",
        required: true,
        placeholder: "Enter Principal name",
        column: 2,
      },
      {
        name: "phoneNumber",
        label: "Phone Number",
        kind: "phone",
        required: true,
        placeholder: "Enter phone number",
        column: 2,
      },
      {
        name: "email",
        label: "Email",
        kind: "email",
        placeholder: "Enter email address",
        column: 2,
      },
    ],
    []
  );

  const columns: Column<DisplayPrincipal>[] = [
    {
      key: "name",
      label: t("Principal Name"),
      renderCell: (p) => (
        <Typography variant="body2" className="principal-name-data">
          {p.name}
        </Typography>
      ),
    },
    { key: "gender", label: t("Gender") },
    { key: "phoneNumber", label: t("Phone Number") },
    {
      key: "emailDisplay",
      label: t("Email"),
      renderCell: (p) => (
        <Typography variant="body2" className="truncate-text">
          {p.emailDisplay}
        </Typography>
      ),
    },
  ];

  return (
    <div className="school-principals-page-container">
      <Box className="school-principals-headerActionsRow">
        <Box className="school-principals-titleArea">
          <Typography variant="h5" className="school-principals-titleHeading">
            {t("Principals")}
          </Typography>
          <Typography variant="body2" className="school-principals-totalText">
            {t("Total")}: {totalCount} {t("principals")}
          </Typography>
        </Box>
        <Box className="school-principals-actionsGroup">
          <MuiButton
            variant="outlined"
            onClick={handleAddNewPrincipal}
            className="school-principals-newTeacherButton-outlined"
          >
            <AddIcon className="school-principals-newTeacherButton-outlined-icon" />
            {!isMobile && t("New Principal")}
          </MuiButton>
        </Box>
      </Box>
      {isLoading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <CircularProgress />
        </Box>
      ) : isDataPresent ? (
        <>
          <div className="school-principals-data-table-container">
            <DataTableBody
              columns={columns}
              rows={displayPrincipals}
              orderBy={orderBy}
              order={order}
              onSort={handleSort}
              onRowClick={() => {}}
            />
          </div>
          {pageCount > 1 && (
            <div className="school-principals-footer">
              <DataTablePagination
                page={page}
                pageCount={pageCount}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <Box className="school-principals-empty-state-container">
          <Typography
            variant="h6"
            className="school-principals-empty-state-title"
          >
            {t("Principals")}
          </Typography>
          <Typography className="school-principals-empty-state-message">
            {t("No principals data found for the selected school")}
          </Typography>
          <MuiButton
            variant="text"
            onClick={handleAddNewPrincipal}
            className="school-principals-emptyStateAddButton"
            startIcon={
              <AddIcon className="school-principals-emptyStateAddButton-icon" />
            }
          >
            {t("Add Principal")}
          </MuiButton>
        </Box>
      )}

      <FormCard
        open={isAddPrincipalModalOpen}
        title={t("Add New Principal")}
        submitLabel={t("Add Principal")}
        fields={teacherFormFields}
        onClose={handleCloseAddTeacherModal}
        onSubmit={handlePrincipalSubmit}
        message={errorMessage}
      />
    </div>
  );
};

export default SchoolPrincipals;
