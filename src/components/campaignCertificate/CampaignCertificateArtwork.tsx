import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  CampaignCertificateData,
  CampaignCertificateLabels,
} from './campaignCertificate.types';

const ASSET_ROOT = '/assets/campaignCompetition';

const rankAssets = {
  1: `${ASSET_ROOT}/Campaign rank1 t2.svg`,
  2: `${ASSET_ROOT}/Campaign rank2 t2.svg`,
  3: `${ASSET_ROOT}/Campaign rank3 t.svg`,
  participation: `${ASSET_ROOT}/Campaign participation t.svg`,
  progress: `${ASSET_ROOT}/Campaign progress t.svg`,
} as const;

const rankMessages = {
  1: 'Congratulations on getting first rank!',
  2: 'Congratulations on getting second rank!',
  3: 'Congratulations on getting third rank!',
  participation: 'Congratulations on completing the campaign!',
  progress: 'Congratulations on making great progress!',
} as const;

const formatAwardDate = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
};

const translated = (
  translate: (key: string, options?: Record<string, unknown>) => string,
  key: string,
  defaultValue: string,
  variables: Record<string, string | number> = {},
) => String(translate(key, { ...variables, defaultValue }) || defaultValue);

type Props = {
  certificate: CampaignCertificateData;
  labels?: CampaignCertificateLabels;
  showStudentName?: boolean;
};

const CampaignCertificateArtwork = forwardRef<HTMLDivElement, Props>(
  ({ certificate, labels = {}, showStudentName = false }, ref) => {
    const { t } = useTranslation();
    const congratulations =
      labels.congratulations ??
      translated(
        t,
        rankMessages[certificate.rank],
        rankMessages[certificate.rank],
      );

    return (
      <div ref={ref} className="campaign-certificate-artwork">
        <img
          className="campaign-certificate-border"
          src={`${ASSET_ROOT}/Border assets.svg`}
          alt=""
          aria-hidden="true"
        />
        <div className="campaign-certificate-copy">
          <h1>
            {labels.title ??
              translated(
                t,
                'Certificate of Recognition',
                'Certificate of Recognition',
              )}
          </h1>
          <h2>{certificate.campaignName}</h2>
          {showStudentName && certificate.studentName && (
            <p className="campaign-certificate-student-name">
              {certificate.studentName}
            </p>
          )}
          <img
            className="campaign-certificate-rank"
            src={rankAssets[certificate.rank]}
            alt={translated(
              t,
              'Campaign reward: {{rank}}',
              `Campaign reward: ${certificate.rank}`,
              { rank: certificate.rank },
            )}
          />
          <p className="campaign-certificate-congratulations">
            {congratulations}
          </p>
          <p className="campaign-certificate-encouragement">
            {labels.encouragement ??
              translated(
                t,
                'Keep learning and exploring. We are proud of you!',
                'Keep learning and exploring. We are proud of you!',
              )}
          </p>
          <div className="campaign-certificate-footer">
            <time>{formatAwardDate(certificate.awardedAt)}</time>
            <img
              src={`${ASSET_ROOT}/chimle learning.svg`}
              alt="Chimple Learning"
            />
          </div>
        </div>
      </div>
    );
  },
);

CampaignCertificateArtwork.displayName = 'CampaignCertificateArtwork';

export default CampaignCertificateArtwork;
