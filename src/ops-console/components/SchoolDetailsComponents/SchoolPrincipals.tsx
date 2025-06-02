import React, { useState, useMemo, useCallback, useEffect } from "react";
import DataTableBody, { Column } from "../DataTableBody";
import DataTablePagination from "../DataTablePagination";
import { Typography, Box } from "@mui/material";
import { t } from "i18next";
import "./SchoolPrincipals.css";

export interface Principal {
  id: string;
  name: string | null;
  gender: string | null;
  phoneNumber: string | null;
  email: string | null;
}

interface SchoolPrincipalsProps {
  data: {
    principals: Principal[];
  };
  isMobile: boolean;
}

const ROWS_PER_PAGE = 7;

const SchoolPrincipals: React.FC<SchoolPrincipalsProps> = ({
  data,
  isMobile,
}) => {
  const [orderBy, setOrderBy] = useState<string | null>("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);

  const handleSort = useCallback(
    (key: string) => {
      const isAsc = orderBy === key && order === "asc";
      setOrder(isAsc ? "desc" : "asc");
      setOrderBy(key);
    },
    [order, orderBy]
  );

  const allFilteredPrincipals = useMemo(() => {
    const principalsFromProps = data?.principals || [];
    return principalsFromProps.map((principal) => ({
      ...principal,
      id: principal.id,
      name: principal.name || "N/A",
      gender: principal.gender || "N/A",
      phoneNumber: principal.phoneNumber || "N/A",
      emailDisplay: principal.email || "N/A",
    }));
  }, [data?.principals]);

  useEffect(() => {
    const newPageCount = Math.ceil(
      allFilteredPrincipals.length / ROWS_PER_PAGE
    );
    setPageCount(Math.max(1, newPageCount));
    if (page > newPageCount && newPageCount > 0) {
      setPage(newPageCount);
    } else if (page > 1 && newPageCount === 0) {
      setPage(1);
    }
  }, [allFilteredPrincipals, page]);

  const principalsForCurrentPage = useMemo(() => {
    const startIndex = (page - 1) * ROWS_PER_PAGE;
    return allFilteredPrincipals.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [allFilteredPrincipals, page]);

  const columns: Column<Principal & { emailDisplay: string }>[] = [
    {
      key: "name",
      label: t("Principal Name"),
      renderCell: (principal) => (
        <Typography variant="body2" className="principal-name-data">
          {principal.name}
        </Typography>
      ),
    },
    { key: "gender", label: t("Gender") },
    { key: "phoneNumber", label: t("Phone Number") },
    {
      key: "email",
      label: t("Email"),
      renderCell: (principal) => (
        <Typography variant="body2" className="truncate-text">
          {principal.emailDisplay}
        </Typography>
      ),
    },
  ];

  const handlePageChange = (newPage: number) => {
    if (newPage !== page) setPage(newPage);
  };

  const isDataPresent = allFilteredPrincipals.length > 0;
  return (
    <div className="schoolPrincipals-pageContainer">
      {isDataPresent ? (
        <div className="schoolPrincipals-dataTableContainer">
          <DataTableBody
            columns={columns}
            rows={principalsForCurrentPage}
            orderBy={orderBy}
            order={order}
            onSort={handleSort}
          />
          {allFilteredPrincipals.length > 0 && (
            <div className="schoolPrincipals-school-list-pagination">
              <DataTablePagination
                page={page}
                pageCount={pageCount}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      ) : (
        <Box className="schoolPrincipals-emptyStateContainer">
          <Typography variant="h6" className="schoolPrincipals-emptyStateTitle">
            {t("Principals")}
          </Typography>
          <Typography className="schoolPrincipals-emptyStateMessage">
            {t("No principals data found for the selected school")}
          </Typography>
        </Box>
      )}
    </div>
  );
};

export default SchoolPrincipals;
