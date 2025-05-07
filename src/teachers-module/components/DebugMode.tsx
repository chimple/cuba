import React, { useEffect, useRef, useState } from "react";
import "./DebugMode.css"; // Import external CSS
import { useHistory } from "react-router-dom";
import { DOWNLOADED_LESSON_ID } from "../../common/constants";
import { ServiceConfig } from "../../services/ServiceConfig";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Util } from "../../utility/util";
import { toPng } from "html-to-image";

const DebugPage: React.FC = () => {
  const history = useHistory();
  const [syncLogs, setSyncLogs] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const api = ServiceConfig.getI().apiHandler;
  const PortPlugin = registerPlugin<any>("Port");
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const [classData, setClassData] = useState<
    {
      studentId: string;
      studentName: string;
      classId?: string;
      className?: string;
      schoolId?: string;
      schoolName?: string;
    }[]
  >([]);

  const [totals, setTotals] = useState({
    parentId: "",
    parentName: "",
    rowsPushed: 0,
    rowsPulled: 0,
    dataTransferredMB: 0,
    rowsPending: 0,
    localDBSizeMB: 0,
    lessonsDownloaded: 0,
    lessonsSize: 0,
  });

  useEffect(() => {
    fetchData();
    init();
  }, []);

  async function init() {
    const debug = await api.getParentStudentProfiles();

    const studentData = debug.map((user) => ({
      id: user.id,
      name: user.name ?? "",
    }));

    const classDataMapped = await Promise.all(
      studentData.map(async (student) => {
        const class1 = await api.getClassByUserId(student.id);
        const school = await api.getSchoolById(class1?.school_id ?? "");

        return {
          studentId: student.id,
          studentName: student.name,
          classId: class1?.id,
          className: class1?.name,
          schoolId: class1?.school_id,
          schoolName: school?.name,
        };
      })
    );

    setClassData(classDataMapped);

    let localDBSizeMB = 0;
    if (Capacitor.isNativePlatform()) {
      const data = await PortPlugin.getLocalDatabaseSize();
      localDBSizeMB = data.dbSize / 1024 / 1024;
    }

    const lessonData = JSON.parse(
      localStorage.getItem("downloaded_lessons_size") || "{}"
    ) as { [lessonId: string]: { size: number } };

    const lessonsDownloaded = Object.keys(lessonData).length;
    const lessonsSizeInByte = Object.values(lessonData).reduce(
      (acc, lesson) => acc + lesson.size,
      0
    );
    const lessonsSize = lessonsSizeInByte / (1024 * 1024);

    const rowsPending = await api.countAllPendingChanges();

    setTotals((prev) => ({
      ...prev,
      rowsPending,
      localDBSizeMB,
      lessonsDownloaded,
      lessonsSize,
    }));
  }
  const fetchData = async () => {
    const authHandler = ServiceConfig.getI()?.authHandler;
    const currentUser = await authHandler?.getCurrentUser();
    const parentId = currentUser?.id;
    const parentName = currentUser?.name;

    if (parentId) {
      const result = await api.getDebugInfoLast30Days(parentId);
      setData(result);

      if (result.length > 0) {
        setColumns(Object.keys(result[0]));

        // Optional: sum if more than one day
        const totalPushed = result.reduce(
          (sum, row) => sum + (row.total_pushed || 0),
          0
        );
        const totalPulled = result.reduce(
          (sum, row) => sum + (row.total_pulled || 0),
          0
        );
        const totalTransferred = result.reduce(
          (sum, row) => sum + (row.total_transferred || 0),
          0
        );

        setTotals({
          parentId,
          parentName: parentName ?? "",
          rowsPushed: totalPushed,
          rowsPulled: totalPulled,
          dataTransferredMB: totalTransferred / 1024,
          rowsPending: totals.rowsPending,
          localDBSizeMB: totals.localDBSizeMB,
          lessonsDownloaded: totals.lessonsDownloaded,
          lessonsSize: totals.lessonsSize,
        });
      }
    }
  };
  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncLogs("");

    try {
      await api.syncDB();
      await fetchData();
      await init();
    } catch (err: any) {
      const errorMessage = err?.message || "An error occurred during sync.";
      setSyncLogs(`Sync failed: ${errorMessage}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearLessons = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Filesystem.rmdir({
        path: "/",
        directory: Directory.External,
        recursive: true,
      });

      localStorage.removeItem("downloaded_lessons_size");
      localStorage.removeItem(DOWNLOADED_LESSON_ID);

      console.log("All lesson files deleted successfully.");
      await init();
      return true;
    } catch (error) {
      console.error("Error deleting all lessons:", error);
      return false;
    }
  };

  function dataURLtoFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  }

  const handleCaptureScreenshot = async () => {
    if (ref.current === null) return;

    try {
      const dataUrl = await toPng(ref.current, { backgroundColor: "white" });

      if (!Capacitor.isNativePlatform()) {
        const file = dataURLtoFile(dataUrl, "debug-screenshot.png");

        await Util.sendContentToAndroidOrWebShare(
          "Debug info attached.",
          "Debug Screenshot",
          undefined,
          [file]
        );
        return;
      }

      // Strip the base64 header
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
      const fileName = `debug-screenshot-${Date.now()}.png`;

      // Save the file to app's cache directory
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      const fileUri = savedFile.uri; // e.g., file://...

      // console.log("File saved at:", fileUri);

      // Now share using plugin
      await PortPlugin.shareContentWithAndroidShare({
        text: "Debug info attached.",
        title: "Debug Screenshot",
        url: "",
        imageFile: {
          name: fileName,
          path: fileUri.replace("file://", ""), // Make sure it's a proper File path
        },
      });
    } catch (err) {
      console.error("Failed to capture or save screenshot:", err);
    }
  };

  return (
    <div className="debug-debug-page">
      <h1 className="debug-title"> Debug Mode</h1>
      <div className="debug-button-group">
        <button
          className="debug-btn debug-sync-btn"
          onClick={handleSyncNow}
          disabled={isSyncing}
        >
          {isSyncing ? "Syncing..." : "Sync Now"}
        </button>
        <button
          className="debug-btn debug-clear-btn"
          onClick={handleClearLessons}
        >
          Clear Downloaded Lessons
        </button>
        <button
          className="debug-btn debug-screenshot-btn"
          onClick={handleCaptureScreenshot}
        >
          Capture & Share Screenshot
        </button>
      </div>

      {syncLogs && (
        <div className="debug-card debug-log-card">
          <div className="debug-card-content">
            <strong>Sync Logs:</strong>
            <pre className="debug-log-text">{syncLogs}</pre>
          </div>
        </div>
      )}
      <div ref={ref}>
        <div className="debug-card">
          <div className="debug-card-content">
            <div className="debug-stat">
              <strong>Parent Id:</strong>
              <p>{totals.parentId}</p>
            </div>
            <div className="debug-stat">
              <strong>Parent Name:</strong>
              <p>{totals.parentName}</p>
            </div>
            <div className="debug-stat">
              <strong>Total Row Pulled</strong>
              <p>{totals.rowsPulled}</p>
            </div>
            <div className="debug-stat">
              <strong>Total Row Pushed</strong>
              <p>{totals.rowsPushed}</p>
            </div>
            <div className="debug-stat">
              <strong>Rows Pending Transfer:</strong>
              <p>{totals.rowsPending}</p>
            </div>
            <div className="debug-stat">
              <strong>Local Database Size:</strong>
              <p>{totals.localDBSizeMB.toFixed(2)} MB</p>
            </div>
            <div className="debug-stat">
              <strong>Lessons Downloaded:</strong>
              <p>
                {totals.lessonsDownloaded} ({totals.lessonsSize.toFixed(2)} MB)
              </p>
            </div>
          </div>

          {classData.length > 0 && (
            <div className="debug-stat">
              <strong>Student-Class-School Details:</strong>
              <ul className="debug-student-class-list">
                {classData.map((entry, index) => (
                  <li key={index} className="debug-student-class-entry">
                    <div className="debug-detail">
                      <strong>Student ID:</strong> {entry.studentId}
                    </div>
                    <div className="debug-detail">
                      <strong>Student Name:</strong> {entry.studentName}
                    </div>
                    <div className="debug-detail">
                      <strong>Class ID:</strong> {entry.classId || "N/A"}
                    </div>
                    <div className="debug-detail">
                      <strong>Class Name:</strong> {entry.className || "N/A"}
                    </div>
                    <div className="debug-detail">
                      <strong>School ID:</strong> {entry.schoolId || "N/A"}
                    </div>
                    <div className="debug-detail">
                      <strong>School Name:</strong> {entry.schoolName || "N/A"}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="debug-info-container">
          <h2>📊 30-Day Sync Summary</h2>
          {data.length > 0 ? (
            <table className="debug-info-table">
              <thead>
                <tr className="debug-info-row">
                  <th className="debug-info-header">Date</th>
                  <th className="debug-info-header">Pushed Rows</th>
                  <th className="debug-info-header">Pulled Rows</th>
                  <th className="debug-info-header">Data Transferred (KB)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="debug-info-row">
                    <td className="debug-info-cell">{row.date}</td>
                    <td className="debug-info-cell">{row.total_pushed}</td>
                    <td className="debug-info-cell">{row.total_pulled}</td>
                    <td className="debug-info-cell">
                      {(row.total_transferred / 1024 || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="debug-info-empty">ℹ️ No data for the last 10 days.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
