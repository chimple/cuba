import React, { useState, useEffect } from "react";
import SearchAndFilter from "../SearchAndFilter";
import DataTablePagination from "../DataTablePagination";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { CircularProgress } from "@mui/material";
import "./CardListModal.css";
import { t } from "i18next";

interface StudentItem {
  user?: {
    id: string;
    name?: string | null;
    student_id?: string | null;
    gender?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  phone?: string | null;
  parent?: { phone?: string | null } | null;
}

interface CardListModalProps {
  open: boolean;
  schoolId: string;
  classId: string;
  primaryStudentId?: string;
  onClose: () => void;
  onSubmit: (student: StudentItem) => void | Promise<void>;
  isSubmitting?: boolean;
}

const ROWS_PER_PAGE = 20;

const CardListModal: React.FC<CardListModalProps> = ({
  open,
  schoolId,
  classId,
  primaryStudentId,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const api = ServiceConfig.getI().apiHandler;
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const requestIdRef = React.useRef(0);
  const [primaryStudentData, setPrimaryStudentData] =
    useState<StudentItem | null>(null);
  const fetchStudents = async (currentPage: number, searchText: string) => {
    if (!open) return;
    const currentRequest = ++requestIdRef.current;
    setLoading(true);
    try {
      let res;
      if (searchText.trim()) {
        res = await api.searchStudentsInSchool(
          schoolId,
          searchText,
          currentPage,
          ROWS_PER_PAGE,
          classId,
        );
      } else {
        res = await api.getStudentInfoBySchoolId(
          schoolId,
          currentPage,
          ROWS_PER_PAGE,
          classId,
        );
      }
      // Ignore old responses
      if (currentRequest !== requestIdRef.current) return;
      if (!primaryStudentData && res.data) {
        const found = res.data.find(
          (s: any) => s.user?.id === primaryStudentId,
        );
        if (found) setPrimaryStudentData(found);
      }
      setStudents(res.data || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      if (currentRequest === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchStudents(1, "");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    fetchStudents(page, search);
  }, [page, search]);

  useEffect(() => {
    if (open) {
      setSearch("");
      setPage(1);
      setSelectedId(undefined);
    }
  }, [open]);

  const processedStudents = students
    .map((s: any) => {
      const user = s.user ?? s;
      const phone = s.parent?.phone ?? s.phone ?? user?.phone ?? "";
      return {
        ...s,
        user: {
          ...user,
          phone: String(phone).replace(/\D/g, ""),
        },
        parent: {
          phone: String(phone).replace(/\D/g, ""),
        },
      };
    })
    .filter((s) => s.user?.id !== primaryStudentId);
  const selectedStudent = processedStudents.find(
    (s) => s.user?.id === selectedId,
  );
  const pageCount = Math.ceil(total / ROWS_PER_PAGE);
  if (!open) return null;


const primaryName = primaryStudentData?.user?.name || "";
const primaryContact =
  primaryStudentData?.parent?.phone ||
  primaryStudentData?.user?.phone ||
  primaryStudentData?.user?.email ||
  "";
  return (
    <div id="cardlist-backdrop" className="cardlist-modal-backdrop">
      <div id="cardlist-modal" className="cardlist-modal">
        <div id="cardlist-header" className="cardlist-header">
          <div id="cardlist-header-content">
            <h2 id="cardlist-title" className="cardlist-title">
              {t("Merge Student")}
            </h2>

            <p id="cardlist-subtitle" className="cardlist-subtitle">
              {t("Select which student profile to merge into")}{" "}
              <strong id="cardlist-primary-student">
                {primaryName}
                {primaryContact ? ` (${primaryContact})` : ""}
              </strong>
            </p>
          </div>

          <button
            id="cardlist-close-button"
            className="cardlist-close-button"
            disabled={isSubmitting}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div id="cardlist-search" className="cardlist-search">
          <SearchAndFilter
            searchTerm={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            isFilter={false}
            forceOpenSearch
            variantType="standard"
          />
        </div>

        <div id="cardlist-warning" className="cardlist-warning">
          ⚠️
          {t(
            "This will combine both student records permanently. This action cannot be undone.",
          )}
        </div>

        <div id="cardlist-container" className="cardlist-model-container">
          {loading ? (
            <div id="cardlist-loading" className="cardlist-loading">
              {t("Loading...")}
            </div>
          ) : processedStudents.length === 0 ? (
            <div id="cardlist-empty" className="cardlist-empty">
              {t("No students found")}
            </div>
          ) : (
            processedStudents.map((s) => {
              const selected = selectedId === s.user?.id;
              return (
                <label
                  id="cardlist-label"
                  key={s.user?.id}
                  className={`cardlist-card ${
                    selected ? "cardlist-card-selected" : ""
                  }`}
                >
                  <input
                    id="cardlist-input"
                    type="radio"
                    checked={selected}
                    onChange={() => setSelectedId(s.user?.id!)}
                  />

                  <div id="cardlist-row" className="cardlist-row">
                    <span id="cardlist-col-id" className="cardlist-col-id">
                      {s.user?.student_id || "N/A"}
                    </span>

                    <span id="cardlist-col-name" className="cardlist-col-name">
                      {s.user?.name || "N/A"}
                    </span>

                    <span
                      id="cardlist-col-gender"
                      className="cardlist-col-gender"
                    >
                      {s.user?.gender
                        ? s.user.gender.toLowerCase() === "male"
                          ? "Male"
                          : s.user.gender.toLowerCase() === "female"
                            ? "Female"
                            : s.user.gender
                        : "N/A"}
                    </span>
                    <span
                      id="cardlist-col-phone"
                      className="cardlist-col-phone"
                    >
                      {s.parent?.phone ||
                        s.user?.phone ||
                        s.user?.email ||
                        "N/A"}
                    </span>
                  </div>
                </label>
              );
            })
          )}
        </div>
        <div id="cardlist-footer" className="cardlist-merge-footer">
          {pageCount > 1 ? (
            <DataTablePagination
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          ) : (
            <div
              id="cardlist-pagination-placeholder"
              className="cardlist-pagination-placeholder"
            />
          )}

          <div id="cardlist-footer-actions">
            <button
              id="cardlist-cancel-button"
              className="cardlist-merge-cancel-btn"
              disabled={isSubmitting}
              onClick={onClose}
            >
              {t("Cancel")}
            </button>

            <button
              id="cardlist-merge-button"
              className="cardlist-merge-btn"
              disabled={!selectedStudent || isSubmitting}
              onClick={() => selectedStudent && onSubmit(selectedStudent)}
            >
              {isSubmitting ? (
                <span className="cardlist-merge-btn-content">
                  <CircularProgress size={14} color="inherit" />
                  {t("Merging...")}
                </span>
              ) : (
                t("Merge")
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CardListModal;
