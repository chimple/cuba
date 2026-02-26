import React, { useState, useEffect } from "react";
import SearchAndFilter from "../SearchAndFilter";
import DataTablePagination from "../DataTablePagination";
import { ServiceConfig } from "../../../services/ServiceConfig";
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
  onSubmit: (student: StudentItem) => void;
}

const ROWS_PER_PAGE = 20;

const CardListModal: React.FC<CardListModalProps> = ({
  open,
  schoolId,
  classId,
  primaryStudentId,
  onClose,
  onSubmit,
}) => {
  const api = ServiceConfig.getI().apiHandler;
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const fetchStudents = async (currentPage: number, searchText: string) => {
    if (!open) return;
    setLoading(true);
    try {
      let res;

      if (searchText.trim()) {
        res = await api.searchStudentsInSchool(
          schoolId,
          searchText,
          currentPage,
          ROWS_PER_PAGE,
          classId
        );
      } else {
        res = await api.getStudentInfoBySchoolId(
          schoolId,
          currentPage,
          ROWS_PER_PAGE,
          classId
        );
      }
      setStudents(res.data || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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

  const primaryStudent = students.find(
    (s) => s.user?.id === primaryStudentId
  );
  const primaryName = primaryStudent?.user?.name || "";
  const primaryContact =
    primaryStudent?.parent?.phone ||
    primaryStudent?.user?.phone ||
    primaryStudent?.user?.email ||
    "";
  return (
    <div className="cardlist-modal-backdrop">
      <div className="cardlist-modal">
        <div className="cardlist-header">
          <div>
            <h2 className="cardlist-title">{t("Merge Student")}</h2>
            <p className="cardlist-subtitle">
              {t("Select which student profile to merge into")}{" "}
              <strong>
                {primaryName}
                {primaryContact ? ` (${primaryContact})` : ""}
              </strong>
            </p>
          </div>

          <button className="cardlist-close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="cardlist-search">
          <SearchAndFilter
            searchTerm={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            isFilter={false}
            forceOpenSearch
            variantType="standard"
          />
        </div>

        <div className="cardlist-warning">
          ⚠️
          {t(
            "This will combine both student records permanently. This action cannot be undone.",
          )}
        </div>

        <div className="cardlist-model-container">
          {loading ? (
            <div className="cardlist-loading">{t("Loading...")}</div>
          ) : processedStudents.length === 0 ? (
            <div className="cardlist-empty">{t("No students found")}</div>
          ) : (
            processedStudents.map((s) => {
              const selected = selectedId === s.user?.id;
              return (
                <label
                  key={s.user?.id}
                  className={`cardlist-card ${selected ? "cardlist-card-selected" : ""
                    }`}
                >
                  <input
                    type="radio"
                    checked={selected}
                    onChange={() => setSelectedId(s.user?.id!)}
                  />

                  <div className="cardlist-row">
                    <span className="col-id">
                      {s.user?.student_id || "N/A"}
                    </span>

                    <span className="col-name">
                      {s.user?.name || "N/A"}
                    </span>
                    <span className="col-gender">
                      {s.user?.gender
                        ? s.user.gender.toLowerCase() === "male"
                          ? "Male"
                          : s.user.gender.toLowerCase() === "female"
                            ? "Female"
                            : s.user.gender
                        : "N/A"}
                    </span>
                    <span className="col-phone">
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

        <div className="cardlist-merge-footer">
          {pageCount > 1 ? (
            <DataTablePagination
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          ) : (
            <div className="cardlist-pagination-placeholder" />
          )}
          <div>
            <button
              className="cardlist-merge-cancel-btn"
              onClick={onClose}
            >
              {t("Cancel")}
            </button>

            <button
              className="cardlist-merge-btn"
              disabled={!selectedStudent}
              onClick={() => selectedStudent && onSubmit(selectedStudent)}
            >
              {t("Merge")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CardListModal;
