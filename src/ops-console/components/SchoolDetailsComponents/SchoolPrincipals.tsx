import React, { useState, useMemo, useCallback, useEffect } from "react";
import DataTableBody, { Column } from "../DataTableBody";
import DataTablePagination from "../DataTablePagination";
import { Typography, Box, CircularProgress } from "@mui/material";
import { t } from "i18next";
import "./SchoolPrincipals.css";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { PrincipalInfo } from "../../../common/constants";

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
}) => {
  const [principals, setPrincipals] = useState<PrincipalInfo[]>(
    data.principals || []
  );
  const [totalCount, setTotalCount] = useState<number>(
    data.totalPrincipalCount || 0
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState<string | null>("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

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
    let sorted = [...principals];
    if (orderBy) {
      sorted.sort((a, b) => {
        const valA = a[orderBy as keyof PrincipalInfo] ?? "";
        const valB = b[orderBy as keyof PrincipalInfo] ?? "";
        if (valA < valB) return order === "asc" ? -1 : 1;
        if (valA > valB) return order === "asc" ? 1 : -1;
        return 0;
      });
    }
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
        </Box>
      )}
    </div>
  );
};

export default SchoolPrincipals;
