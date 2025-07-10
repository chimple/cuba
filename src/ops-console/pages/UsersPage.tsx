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
  CircularProgress,
  Skeleton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DataTableBody from "../components/DataTableBody";
import DataTablePagination from "../components/DataTablePagination";
import { SupabaseApi } from "../../services/api/SupabaseApi";
import { PAGES, USER_ROLE } from "../../common/constants";
import { t } from "i18next";
import { ServiceConfig } from "../../services/ServiceConfig";
import { RoleLabels, RoleType } from "../../interface/modelInterfaces";
import "./UsersPage.css";
import NewUserPage from "./NewUserPage";
import { useHistory } from "react-router-dom";

interface User {
  fullName: string;
  role: string;
}

interface UsersPageProps {
  initialUsers?: User[];
}

const columns = [
  { key: "fullName", label: "Full Name", width: "30%" },
  { key: "role", label: "Roles", width: "70%" },
];

const ROWS_PER_PAGE = 10;

const UsersPage: React.FC<UsersPageProps> = ({ initialUsers }) => {
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const [users, setUsers] = useState<User[]>(initialUsers ?? []);
  const [loading, setLoading] = useState(initialUsers ? false : true);
  const [showAddForm, setShowAddForm] = useState(false);
  const history = useHistory();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  useEffect(() => {
    if (initialUsers) {
      setUsers(initialUsers);
      setLoading(false);
      return;
    }
    const fetchUsers = async () => {
      setLoading(true);
      const api = ServiceConfig.getI().apiHandler;
      const result = await api.getManagersAndCoordinators();
      if (result && result.length > 0) {
        setUsers(
          result.map((u: any) => ({
            fullName: u.user?.name,
            role: RoleLabels[u.role as RoleType] || u.role,
          }))
        );
      } else {
        setUsers([]);
      }
      setLoading(false);
    };
    fetchUsers();
  }, [initialUsers]);

  const sortedUsers = [...(users || [])]
    .filter((u) => !!u.fullName)
    .sort((a, b) =>
      order === "asc"
        ? a.fullName.localeCompare(b.fullName)
        : b.fullName.localeCompare(a.fullName)
    );

  const filteredUsers = sortedUsers.filter((user) =>
    user.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const pageCount = Math.ceil(filteredUsers.length / ROWS_PER_PAGE);

  const paginatedUsers = filteredUsers.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [filteredUsers, pageCount, page]);

  const handleSort = () => {
    setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
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
              onChange={(e) => setSearch(e.target.value)}
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
              onClick={() =>
                history.push(
                  `${PAGES.SIDEBAR_PAGE}${PAGES.USERS}${PAGES.NEW_USERS}`
                )
              }
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
              onClick={() =>
                history.push(
                  `${PAGES.SIDEBAR_PAGE}${PAGES.USERS}${PAGES.NEW_USERS}`
                )
              }
            >
              {t("New User")}
            </Button>
            <TextField
              placeholder="Search"
              size="small"
              variant="outlined"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
        ) : paginatedUsers.length === 0 ? (
          <Box padding={4} textAlign="center">
            <Typography variant="h6" color="text.secondary">
              {t("No users found")}
            </Typography>
          </Box>
        ) : (
          <DataTableBody
            columns={columns}
            rows={paginatedUsers}
            orderBy={"fullName"}
            order={order}
            onSort={handleSort}
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
