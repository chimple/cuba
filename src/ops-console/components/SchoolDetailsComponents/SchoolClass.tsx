import React, { useMemo, useRef, useEffect, useState } from "react";
import DataTableBody from "../DataTableBody";
import {
  Button as MuiButton,
  Typography,
  Box,
  useMediaQuery,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import EditOutlined from "@mui/icons-material/EditOutlined";
import PersonAddAlt1Outlined from "@mui/icons-material/PersonAddAlt1Outlined";
import ChatBubbleOutlineOutlined from "@mui/icons-material/ChatBubbleOutlineOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import "./SchoolClass.css";
import ActionMenu from "./ActionMenu";
import { ServiceConfig } from "../../../services/ServiceConfig";
import ClassDetailsPage from "./ClassDetailsPage";
import { t } from "i18next";
import ClassForm from "../ClassForm";
import { ClassWithDetails, SchoolStats } from "../../pages/SchoolDetailsPage";
import { TableTypes, AGE_OPTIONS, GENDER } from "../../../common/constants";
import FormCard, { FieldConfig, MessageConfig } from "./FormCard";
import { normalizePhone10 } from "../../pages/NewUserPageOps";

export type SchoolDetailsData = {
  schoolData?: SchoolData;
  programData?: any;
  programManagers?: any[];
  principals?: any[];
  totalPrincipalCount?: number;
  coordinators?: any[];
  totalCoordinatorCount?: number;
  teachers?: any[];
  students?: any[];
  totalTeacherCount?: number;
  totalStudentCount?: number;
  schoolStats?: SchoolStats;
  classData?: ClassRow[];
  totalClassCount?: number;
};

export type SchoolData = TableTypes<"school"> & {
  whatsapp_bot_number?: string | null;
};

export type ClassRow = ClassWithDetails & {
  code?: string | number | null;
  grade?: number | string;
  section?: string;
  whatsapp_connected?: boolean;
};

type TableRowData = {
  id: string;
  _raw: ClassRow;
  code: string | { render: React.ReactNode };
  class: { render: React.ReactNode };
  subjects: string;
  curriculum: string;
  studentCount: number | undefined;
  actions: { render: React.ReactNode };
  whatsapp?: { render: React.ReactNode };
};

type ColumnDef = {
  key: keyof TableRowData;
  label: string;
  align?: "left" | "right" | "center" | "justify" | "inherit";
  sortable?: boolean;
  width?: string | number;
};

interface Props {
  data: SchoolDetailsData;
  schoolId: string;
  isMobile?: boolean;
  onGenerateCode?: (classId: string) => void;
  refreshClasses?: () => void;
}
const StatusChip: React.FC<{
   status: "connected" | "disconnected" | "not_connected" | "loading";
}> = ({ status }) => {
  const isConnected = status === "connected";

  return (
    <span
      role="status"
      className={`schoolclass-wa-chip ${
  status === "connected"
    ? "schoolclass-wa-chip--ok"
    : status === "disconnected"
    ? "schoolclass-wa-chip--warn"
    : status === "loading"
    ? "schoolclass-wa-chip--loading"
    : "schoolclass-wa-chip--na"
}`}
    >
      {isConnected && (
        <ChatBubbleOutlineOutlined
          fontSize="small"
          className="schoolclass-wa-chip__icon"
        />
      )}

     {status === "connected"
  ? t("Connected")
  : status === "disconnected"
  ? t("Disconnected")
  : status === "loading"
  ? t("Loading...")
  : t("Not Connected")}
    </span>
  );
};

const SchoolClasses: React.FC<Props> = ({
  data,
  schoolId,
  isMobile,
  onGenerateCode,
  refreshClasses,
}) => {
  const isSmall = useMediaQuery("(max-width: 768px)");
  const api = ServiceConfig.getI().apiHandler;
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("edit");
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null);
  const [waMetaLoading, setWaMetaLoading] = useState(true);


  // Add Student Modal State
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [studentErrorMessage, setStudentErrorMessage] = useState<
    MessageConfig | undefined
  >();
  const [isStudentSubmitting, setIsStudentSubmitting] = useState(false);
  const [classForStudent, setClassForStudent] = useState<ClassRow | null>(null);

  const allDataRef = useRef<SchoolDetailsData>(data);
  useEffect(() => {
    allDataRef.current = data;
  }, [data]);

  const getAll = (): SchoolDetailsData => allDataRef.current;
  const safeClasses: ClassRow[] = Array.isArray(getAll()?.classData)
    ? getAll().classData!
    : [];

  const bot = getAll()?.schoolData?.whatsapp_bot_number;
  const hasWhatsAppBot = typeof bot === "string" && /^\d{12}$/.test(bot.trim());
  const hasValue = (v: string) => v != null && String(v).trim() !== "";
  const [phoneDetails, setPhoneDetails] = useState<any>(null);
  const [codes, setCodes] = useState<Record<string, string | null>>({});
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});

useEffect(() => {
  if (!bot) return; // 🚨 wait until bot exists

  let cancelled = false;

  (async () => {
    try {
      const details = await api.getPhoneDetailsByBotNum(String(bot));
      if (!cancelled) setPhoneDetails(details);
    } catch (e) {
      console.error("getPhoneDetailsByBotNum failed", e);
    }

    if (!cancelled) setWaMetaLoading(false); // ✅ critical
  })();

  return () => {
    cancelled = true;
  };
}, [bot]); // ✅ MUST depend on bot

console.log("WhatsApp Phone Details value:", phoneDetails);


  useEffect(() => {
    let cancelled = false;
    (async () => {
      const seeded: Record<string, string | null> = {};
      for (const c of safeClasses) {
        const v = c.code == null ? null : String(c.code);
        if (v) seeded[c.id] = v;
      }
      const missingIds = safeClasses
        .map((c) => c.id)
        .filter((id) => !(id in seeded));
      if (missingIds.length === 0) {
        if (!cancelled)
          setCodes((prev) => ({
            ...missingIds.reduce(
              (m, id) => ({ ...m, [id]: prev[id] ?? null }),
              {}
            ),
            ...seeded,
            ...prev,
          }));
        return;
      }
      try {
        const lookups = await Promise.all(
          missingIds.map(async (id) => {
            try {
              const val = await api.getClassCodeById(id);
              return [id, val == null ? null : String(val)] as const;
            } catch {
              return [id, null] as const;
            }
          })
        );
        if (!cancelled) {
          const fetched: Record<string, string | null> = {};
          for (const [id, code] of lookups) fetched[id] = code;
          setCodes((prev) => ({ ...fetched, ...seeded, ...prev }));
        }
      } catch {
        if (!cancelled) setCodes((prev) => ({ ...seeded, ...prev }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [safeClasses]);

  const handleGenerateCode = async (classId: string) => {
    try {
      onGenerateCode?.(classId);
      setLoadingIds((s) => ({ ...s, [classId]: true }));
      const newCode = await api.createClassCode(classId);
      setCodes((prev) => ({ ...prev, [classId]: String(newCode) }));
    } catch (err) {
      console.error("Failed to create class code:", err);
    } finally {
      setLoadingIds((s) => ({ ...s, [classId]: false }));
    }
  };

  const isAtSchool = useMemo(() => {
    const raw = (data?.schoolData?.model ?? "").toString();
    const norm = raw
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
    return norm === "at_school";
  }, [data?.schoolData?.model]);

  const addStudentFields: FieldConfig[] = useMemo(() => {
    const fields: FieldConfig[] = [
      {
        name: "studentName",
        label: "Student Name",
        kind: "text" as const,
        required: true,
        placeholder: "Enter Student Name",
        column: 0 as const,
      },
      {
        name: "studentID",
        label: "Student ID",
        kind: "text" as const,
        placeholder: "Enter Student ID",
        column: 1 as const,
      },
      {
        name: "gender",
        label: "Gender",
        kind: "select" as const,
        required: true,
        column: 0 as const,
        options: [
          { label: t("GIRL"), value: GENDER.GIRL },
          { label: t("BOY"), value: GENDER.BOY },
          { label: t("UNSPECIFIED"), value: GENDER.OTHER },
        ],
      },
      {
        name: "ageGroup",
        label: "Age",
        kind: "select" as const,
        required: true,
        placeholder: "Select Age Group",
        column: 1 as const,
        options: [
          { value: AGE_OPTIONS.LESS_THAN_EQUAL_4, label: `≤${t("4 years")}` },
          { value: AGE_OPTIONS.FIVE, label: t("5 years") },
          { value: AGE_OPTIONS.SIX, label: t("6 years") },
          { value: AGE_OPTIONS.SEVEN, label: t("7 years") },
          { value: AGE_OPTIONS.EIGHT, label: t("8 years") },
          { value: AGE_OPTIONS.NINE, label: t("9 years") },
          {
            value: AGE_OPTIONS.GREATER_THAN_EQUAL_10,
            label: `≥${t("10 years")}`,
          },
        ],
      },
    ];
    if (!isAtSchool) {
      fields.push({
        name: "phone",
        label: "Phone Number",
        kind: "phone" as const,
        required: true,
        placeholder: "Enter phone number",
        column: 2 as const,
      });
    }
    return fields;
  }, [isAtSchool]);

  const handleCloseAddStudentModal = () => {
    setIsAddStudentModalOpen(false);
    setStudentErrorMessage(undefined);
    setIsStudentSubmitting(false);
    setClassForStudent(null);
  };

  const handleSubmitAddStudentModal = async (
    formValues: Record<string, string>
  ) => {
    if (!classForStudent) return;
    setIsStudentSubmitting(true);
    setStudentErrorMessage(undefined);

    const rawPhone = (formValues.phone ?? "").toString();
    let digits = rawPhone.replace(/\D/g, "");
    if (digits === "" || digits === "91") {
      digits = "";
    }
    if (digits.length === 12 && digits.startsWith("91"))
      digits = digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0"))
      digits = digits.slice(1);
    if (!isAtSchool) {
      if (digits.length !== 10) {
        setStudentErrorMessage({
          text: "Phone number must be 10 digits.",
          type: "error",
        });
        setIsStudentSubmitting(false);
        return;
      }
    } else {
      if (digits.length !== 0 && digits.length !== 10) {
        setStudentErrorMessage({
          text: "Phone number must be 10 digits when provided.",
          type: "error",
        });
        setIsStudentSubmitting(false);
        return;
      }
    }

    const normalizedPhone = digits.length === 10 ? digits : undefined;
    try {
      const payload: any = {
        phone: normalizedPhone,
        name: formValues.studentName || "",
        gender: formValues.gender || "",
        age: formValues.ageGroup || "",
        classId: classForStudent.id,
        schoolId: schoolId,
        studentID: formValues.studentID || "",
        atSchool: isAtSchool,
      };
      const result = await api.addStudentWithParentValidation(payload);
      if (result.success) {
        setStudentErrorMessage({
          text: "Student added successfully.",
          type: "success",
        });
        setTimeout(() => {
          setIsAddStudentModalOpen(false);
          setStudentErrorMessage(undefined);
        }, 2000);
        refreshClasses?.();
      } else {
        setStudentErrorMessage({ text: result.message, type: "error" });
      }
    } catch (error) {
      console.error("Error adding student:", error);
      setStudentErrorMessage({
        text: "An unexpected error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setIsStudentSubmitting(false);
    }
  };

  const rows = useMemo<TableRowData[]>(() => {
    return safeClasses.map((c) => {
      const classLabel = typeof c.name === "string" ? c.name.trim() : "";

      const subjectsDisplay = c.subjectsNames;
      const curriculumDisplay = c.curriculumNames;


      

      const isGroupConnected = hasValue(c.group_id ?? "");
      const isBotConnected = phoneDetails?.phone.wa_state === "CONNECTED";
      let waStatus: "connected" | "disconnected" | "not_connected" | "loading";

      if (waMetaLoading) {
        waStatus = "loading";                 // ✅ don't guess yet
      } else if (!isGroupConnected) {
        waStatus = "not_connected";
      } else if (isBotConnected) {
        waStatus = "connected";
      } else {
        waStatus = "disconnected";
      }


      const codeVal = codes[c.id] ?? null;
      const hasCode = typeof codeVal === "string" && codeVal.trim().length > 0;
      const isLoading = !!loadingIds[c.id];
      const codeCell = hasCode
        ? codeVal
        : {
            render: (
              <MuiButton
                variant="outlined"
                size="small"
                disabled={isLoading}
                sx={{
                  borderRadius: "9999px",
                  textTransform: "none",
                  px: 1.5,
                  py: 0.25,
                  height: 28,
                  fontWeight: 700,
                  boxShadow:
                    "0 1px 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateCode(c.id);
                }}
              >
                {isLoading ? t("Generating...") : t("Generate")}
              </MuiButton>
            ),
          };

      const baseRow: TableRowData = {
        id: c.id,
        _raw: c,
        code: codeCell,
        class: { render: <strong>{classLabel}</strong> },
        subjects: subjectsDisplay ?? "",
        curriculum: curriculumDisplay ?? "",
        studentCount: Number.isFinite(c.studentCount) ? c.studentCount : 0,
        actions: {
          render: (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ display: "flex", justifyContent: "center" }}
            >
              <ActionMenu
                items={[
                  {
                    name: t("Edit Class"),
                    icon: <EditOutlined fontSize="small" />,
                    onClick: () => {
                      setMode("edit");
                      setEditingClass(c);
                      setShowForm(true);
                    },
                  },
                  {
                    name: t("Add Student"),
                    icon: <PersonAddAlt1Outlined fontSize="small" />,
                    onClick: () => {
                      setClassForStudent(c);
                      setIsAddStudentModalOpen(true);
                    },
                  },
                  {
                    name: t("Setup WhatsApp Group"),
                    icon: <ChatBubbleOutlineOutlined fontSize="small" />,
                  },
                ]}
                renderTrigger={(open, isOpen) => (
                  <MuiButton
                    size="medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      open(e);
                    }}
                    endIcon={
                      isOpen ? (
                        <KeyboardArrowUpIcon
                          fontSize="medium"
                          sx={{ color: "black" }}
                        />
                      ) : (
                        <KeyboardArrowDownIcon
                          fontSize="medium"
                          sx={{ color: "black" }}
                        />
                      )
                    }
                    sx={{
                      minWidth: 0,
                      borderRadius: "8px",
                      textTransform: "none",
                    }}
                  />
                )}
              />
            </div>
          ),
        },
      };
      if (hasWhatsAppBot) {
        baseRow.whatsapp = {
          render: (
            <div className="schoolclass-cell-center">
              <StatusChip status={waStatus} />
            </div>
          ),
        };
      }

      return baseRow;
    });
  }, [ safeClasses,codes,loadingIds,hasWhatsAppBot,phoneDetails,waMetaLoading ]);

  const selectedRow = useMemo(
    () =>
      selectedClassId
        ? safeClasses.find((c) => c.id === selectedClassId) ?? null
        : null,
    [selectedClassId, safeClasses]
  );

  const selectedClassCode = useMemo(() => {
    if (!selectedClassId) return undefined;
    const fromCodes = codes[selectedClassId] ?? null;
    const fromRow = selectedRow?.code == null ? null : String(selectedRow.code);
    return (fromCodes || fromRow) ?? undefined;
  }, [selectedClassId, codes, selectedRow]);

  const selectedTotalStudents = useMemo(() => {
    if (!selectedRow) return undefined;
    return Number.isFinite(selectedRow.studentCount)
      ? Number(selectedRow.studentCount)
      : undefined;
  }, [selectedRow]);

  const columns = useMemo<ColumnDef[]>(() => {
    const cols: ColumnDef[] = [
      { key: "code", label: t("Class Code"), sortable: false },
      { key: "class", label: t("Class"), sortable: false },
      { key: "subjects", label: t("Subjects"), sortable: false },
      { key: "curriculum", label: t("Curriculum"), sortable: false },
      {
        key: "studentCount",
        label: t("Student Count"),
        sortable: false,
        align: "right",
      },
    ];
    if (hasWhatsAppBot) {
      cols.push({
        key: "whatsapp",
        label: t("WhatsApp Group"),
        align: "center",
        sortable: false,
      });
    }
    cols.push({
      key: "actions",
      label: t("Actions"),
      align: "right",
      sortable: false,
    });
    return cols;
  }, [hasWhatsAppBot]);

  const totalCount =
    typeof getAll()?.totalClassCount === "number"
      ? getAll().totalClassCount
      : safeClasses.length;

  return selectedClassId ? (
    <ClassDetailsPage
      data={data}
      schoolId={schoolId}
      classId={selectedClassId}
      classRow={selectedRow}
      classCodeOverride={selectedClassCode}
      totalStudentsOverride={selectedTotalStudents}
      onBack={() => setSelectedClassId(null)}
    />
  ) : (
    <div className="schoolclass-pageContainer">
      <Box className="schoolclass-headerActionsRow">
        <Box className="schoolclass-titleArea">
          <Typography variant="h5" className="schoolclass-titleHeading">
            {t("Classes")}
          </Typography>
          <Typography variant="body2" className="schoolclass-totalText">
            {t("Total: ")}
            {totalCount}
            {t(" classes")}
          </Typography>
        </Box>

        <Box className="schoolclass-actionsGroup">
          <MuiButton
            variant="outlined"
            onClick={() => {
              setMode("create");
              setShowForm(true);
            }}
            className="schoolclass-newStudentButton-outlined"
          >
            <AddIcon className="schoolclass-newStudentButton-outlined-icon" />
            {!isSmall && t("New Class")}
          </MuiButton>
        </Box>
      </Box>

      {showForm && (
        <ClassForm
          mode={mode}
          classData={editingClass}
          schoolId={schoolId}
          whatspAppBotNumber={data.schoolData?.whatsapp_bot_number || ""}
          onSaved={refreshClasses}
          onClose={() => setShowForm(false)}
        />
      )}

      <FormCard
        open={isAddStudentModalOpen}
        title={
          classForStudent
            ? `${t("Add New Student")} - ${classForStudent.name}`
            : t("Add New Student")
        }
        submitLabel={isStudentSubmitting ? t("Adding...") : t("Add Student")}
        fields={addStudentFields}
        onClose={handleCloseAddStudentModal}
        onSubmit={handleSubmitAddStudentModal}
        message={studentErrorMessage}
      />

      <div className="schoolclass-table-container">
        <DataTableBody
          columns={columns}
          rows={rows}
          orderBy={"curriculum" as const}
          order={"asc" as const}
          onSort={() => {}}
          onRowClick={(id) => setSelectedClassId(String(id))}
        />
      </div>
    </div>
  );
};

export default SchoolClasses;
