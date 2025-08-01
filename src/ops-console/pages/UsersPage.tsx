import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Skeleton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DataTableBody from "../components/DataTableBody";
import DataTablePagination from "../components/DataTablePagination";
import { SupabaseApi } from "../../services/api/SupabaseApi";
import { PAGES } from "../../common/constants";
import { t } from "i18next";
import { ServiceConfig } from "../../services/ServiceConfig";
import { RoleLabels, RoleType } from "../../interface/modelInterfaces";
import "./UsersPage.css";
import { useHistory, useLocation } from "react-router-dom";
import queryString from "query-string";

interface User {
  fullName: string;
  role: string;
}

const columns = [
  { key: "fullName", label: "Full Name", width: "30%" },
  { key: "role", label: "Roles", width: "70%" },
];

const ROWS_PER_PAGE = 8;

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return debouncedValue;
}

const UsersPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;

  // Extract query params
  const {
    page: qPage,
    search: qSearch,
    sortBy: qSortBy,
    sortOrder: qSortOrder,
  } = queryString.parse(location.search);

  const [page, setPage] = useState(Number(qPage) || 1);
  const [search, setSearch] = useState((qSearch as string) || "");
  const [sortBy, setSortBy] = useState<string | null>(
    (qSortBy as string) || null
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (qSortOrder as "asc" | "desc") || "asc"
  );

  const debouncedSearch = useDebouncedValue(search, 300);
  const [pageCount, setPageCount] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = queryString.stringify({
      page,
      search,
      sortBy,
      sortOrder,
    });
    history.replace({ search: query });
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const result = await api.getManagersAndCoordinators(
        page,
        debouncedSearch.length >= 3 ? debouncedSearch : "",
        ROWS_PER_PAGE,
        sortBy === "fullName" || !sortBy ? "name" : "name",
        sortOrder
      );

      if (result) {
        setUsers(
          result.data.map((u: any) => ({
            id: u.user?.id,
            user: u.user,
            userRole: u.role,
            fullName: u.user?.name,
            role: RoleLabels[u.role as RoleType] || u.role,
          }))
        );
        const totalPages = Math.ceil(result.totalCount / ROWS_PER_PAGE);
        setPageCount(totalPages);
        if (page > totalPages) setPage(1);
      } else {
        setUsers([]);
        setPageCount(0);
      }

      setLoading(false);
    };

    fetchUsers();
  }, [page, debouncedSearch, sortBy, sortOrder]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const navigateToNewUser = () => {
    history.push(`${PAGES.SIDEBAR_PAGE}${PAGES.USERS}${PAGES.NEW_USERS_OPS}`);
  };

  return (
    <div className="user-page-container">
      <Box className="user-page-header">
        <Box className="user-header-top">
          {isMobile ? (
            <>
              <Box sx={{ width: 40 }} />
              <Typography className="user-title-mobile">
                {t("Users")}
              </Typography>
              <IconButton className="user-icon-button">
                <NotificationsIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Typography className="user-title">{t("Users")}</Typography>
              <IconButton className="user-icon-button">
                <NotificationsIcon />
              </IconButton>
            </>
          )}
        </Box>

        {isMobile ? (
          <Box className="user-mobile-actions">
            <TextField
              placeholder="Search"
              size="small"
              variant="outlined"
              value={search}
              onChange={handleSearchChange}
              className="user-search-input"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "grey.600" }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              className="user-add-mobile"
              onClick={navigateToNewUser}
            >
              <AddIcon sx={{ fontSize: 25 }} />
            </Button>
          </Box>
        ) : (
          <Box className="user-desktop-actions">
            <Button
              variant="outlined"
              startIcon={<AddIcon sx={{ color: "#1976d2", fontSize: 25 }} />}
              className="user-add-desktop"
              onClick={navigateToNewUser}
            >
              {t("New User")}
            </Button>
            <TextField
              placeholder="Search"
              size="small"
              variant="outlined"
              value={search}
              onChange={handleSearchChange}
              className="user-search-desktop"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "grey.600" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}
      </Box>

      <div className="user-table">
        {loading ? (
          <Box padding={2}>
            {[...Array(10)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={40}
                sx={{ mb: 0 }}
              />
            ))}
          </Box>
        ) : users.length === 0 ? (
          <Box padding={4} textAlign="center">
            <Typography variant="h6" color="text.secondary">
              {t("No users found")}
            </Typography>
          </Box>
        ) : (
          <DataTableBody
            columns={columns}
            rows={users}
            orderBy={sortBy ? sortBy : null}
            order={sortOrder}
            onSort={(key) => {
              if (key === "fullName") {
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                setSortBy(key as keyof User);
              }
            }}
            detailPageRouteBase="users"
          />
        )}
      </div>

      <div className="user-page-pagination">
        <DataTablePagination
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default UsersPage;
