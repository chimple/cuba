import './DebugMode.css';
import { useDebugMode } from '../hooks/useDebugMode';

const DebugPage = () => {
  const {
    classData,
    data,
    handleCaptureScreenshot,
    handleClearLessons,
    handleManualHotUpdate,
    handleSyncNow,
    hotUpdateMeta,
    hotUpdateState,
    isHotUpdating,
    isSyncing,
    ref,
    syncLogs,
    t,
    totals,
  } = useDebugMode();

  return (
    <div className="debug-debug-page">
      <div className="debug-scroll-wrapper">
        <div className="debug-button-group">
          <button
            className="debug-btn debug-sync-btn"
            onClick={handleSyncNow}
            disabled={isSyncing}
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
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
          <button
            className="debug-btn debugmode-debug-hotupdate-btn"
            onClick={handleManualHotUpdate}
            disabled={isHotUpdating || !hotUpdateMeta.isUpdateAvailable}
          >
            {isHotUpdating ? 'Updating App...' : 'Manual Hot Update'}
          </button>
        </div>
        {isHotUpdating && (
          <div className="debug-card">
            <strong>{t('Hot Update Progress')}</strong>
            <p>{hotUpdateState.progress}%</p>

            <div className="debugmode-progress-bar-container">
              <div
                className="debugmode-progress-bar-fill"
                style={{ width: `${hotUpdateState.progress}%` }}
              />
            </div>

            <p>
              {t('Status') + ' '}
              {hotUpdateState.status}
            </p>
          </div>
        )}

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
                  {totals.lessonsDownloaded} ({totals.lessonsSize.toFixed(2)}{' '}
                  MB)
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
                        <strong>Class ID:</strong> {entry.classId || 'N/A'}
                      </div>
                      <div className="debug-detail">
                        <strong>Class Name:</strong> {entry.className || 'N/A'}
                      </div>
                      <div className="debug-detail">
                        <strong>School ID:</strong> {entry.schoolId || 'N/A'}
                      </div>
                      <div className="debug-detail">
                        <strong>School Name:</strong>{' '}
                        {entry.schoolName || 'N/A'}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {/* 🔥 Hot Update Info Card */}
          <div className="debug-card">
            <div className="debug-card-content">
              <div className="debug-stat">
                <strong>Hot Update Channel:</strong>
                <p>{hotUpdateState.channel}</p>
              </div>
              <div className="debug-stat">
                <strong>Update Mode:</strong>
                <p>{hotUpdateState.isAuto ? 'Auto' : 'Manual'}</p>
              </div>
              <div className="debug-stat">
                <strong>App Version Name:</strong>
                <p>{hotUpdateMeta.versionName}</p>
              </div>

              <div className="debug-stat">
                <strong>App Version Code:</strong>
                <p>{hotUpdateMeta.versionCode}</p>
              </div>

              <div className="debug-stat">
                <strong>Update Available:</strong>
                <p>{String(hotUpdateMeta.isUpdateAvailable)}</p>
              </div>

              <div className="debug-stat">
                <strong>Status:</strong>
                <p>{hotUpdateState.status}</p>
              </div>

              <div className="debug-stat">
                <strong>Current Bundle ID:</strong>
                <p style={{ wordBreak: 'break-all' }}>
                  {hotUpdateMeta.currentBundleId}
                </p>
              </div>

              <div className="debug-stat">
                <strong>Latest Bundle ID:</strong>
                <p style={{ wordBreak: 'break-all' }}>
                  {hotUpdateMeta.latestBundleId}
                </p>
              </div>

              <div className="debug-stat">
                <strong>Last Checked:</strong>
                <p>{hotUpdateState.lastChecked}</p>
              </div>

              <div className="debug-stat">
                <strong>Last Update Applied:</strong>
                <p>{hotUpdateState.lastUpdated}</p>
              </div>

              {hotUpdateState.error && (
                <div className="debug-stat">
                  <strong>Hot Update Error:</strong>
                  <p style={{ color: 'red' }}>{hotUpdateState.error}</p>
                </div>
              )}
            </div>
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
              <p className="debug-info-empty">
                ℹ️ No data for the last 10 days.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;