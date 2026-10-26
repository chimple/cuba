import { t } from 'i18next';

export function ReportsNoReportFound({
  startDate,
  endDate,
  isExternalUser,
  onLibraryClick,
}: {
  startDate: Date;
  endDate: Date;
  isExternalUser: boolean;
  onLibraryClick?: () => void;
}) {
  return (
    <div className="no-report-found">
      <div>
        {t("Sorry, Couldn't find any matches for the Date Range ")}'
        {startDate.getDate()}/{startDate.getMonth() + 1} - {endDate.getDate()}/
        {endDate.getMonth() + 1}'<br />
        <div>
          {t('If you would like to assign assignments, please go to the')}{' '}
        </div>
        {!isExternalUser && (
          <div onClick={onLibraryClick} className="library-button">
            {t('Library')}
          </div>
        )}
      </div>
    </div>
  );
}
