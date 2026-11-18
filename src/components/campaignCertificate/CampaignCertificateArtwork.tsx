import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  CampaignCertificateData,
  CampaignCertificateLabels,
} from './campaignCertificate.types';

const ASSET_ROOT = '/assets/campaignCompetition';
const CERTIFICATE_WIDTH = 466;
const CERTIFICATE_HEIGHT = 326;

const rankAssets = {
  1: `${ASSET_ROOT}/Campaign rank1 t2.svg`,
  2: `${ASSET_ROOT}/Campaign rank2 t2.svg`,
  3: `${ASSET_ROOT}/Campaign rank3 t.svg`,
  progress: `${ASSET_ROOT}/Campaign progress t.svg`,
} as const;

const rankMessages = {
  1: 'Congratulations on getting first rank!',
  2: 'Congratulations on getting second rank!',
  3: 'Congratulations on getting third rank!',
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

const compactText = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

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
    const encouragement =
      labels.encouragement ??
      translated(
        t,
        'Keep learning and exploring. We are proud of you!',
        'Keep learning and exploring. We are proud of you!',
      );

    return (
      <div ref={ref} className="campaign-certificate-artwork">
        <svg
          className="campaign-certificate-svg"
          viewBox={`0 0 ${CERTIFICATE_WIDTH} ${CERTIFICATE_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={translated(
            t,
            'Campaign reward: {{rank}}',
            `Campaign reward: ${certificate.rank}`,
            { rank: certificate.rank },
          )}
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>
            {translated(
              t,
              'Campaign reward: {{rank}}',
              `Campaign reward: ${certificate.rank}`,
              { rank: certificate.rank },
            )}
          </title>
          <rect
            width={CERTIFICATE_WIDTH}
            height={CERTIFICATE_HEIGHT}
            fill="#fff9d9"
          />
          <image
            href={`${ASSET_ROOT}/Border assets.svg`}
            width={CERTIFICATE_WIDTH}
            height={CERTIFICATE_HEIGHT}
            aria-hidden="true"
          />

          <g
            fill="#665800"
            fontFamily="Baloo 2, sans-serif"
            textAnchor="middle"
          >
            <text x="233" y="52" fontSize="16.667" fontWeight="700">
              {(
                labels.title ??
                translated(
                  t,
                  'Certificate of Recognition',
                  'Certificate of Recognition',
                )
              ).toUpperCase()}
            </text>
            <text x="233" y="73" fontSize="16.667" fontWeight="600">
              {compactText(certificate.campaignName.toUpperCase(), 42)}
            </text>
            {showStudentName && certificate.studentName && (
              <text x="233" y="89" fontSize="12" fontWeight="600">
                {compactText(certificate.studentName, 36)}
              </text>
            )}
            <image
              data-testid="campaign-certificate-rank"
              href={rankAssets[certificate.rank]}
              x="177"
              y={showStudentName ? '95' : '82'}
              width="112"
              height="112"
            />
            <text x="233" y="221" fontSize="14" fontWeight="600">
              {compactText(congratulations, 48)}
            </text>
            <line x1="119" y1="228" x2="347" y2="228" stroke="#dadada" />
            <text x="233" y="242" fontSize="14" fontWeight="600">
              {compactText(encouragement, 53)}
            </text>
            <line x1="119" y1="249" x2="347" y2="249" stroke="#dadada" />

            <text x="86" y="277" fontSize="14" fontWeight="600">
              {formatAwardDate(certificate.awardedAt)}
            </text>
            <line x1="48" y1="285" x2="124" y2="285" stroke="#dadada" />
          </g>
          <image
            href={`${ASSET_ROOT}/chimle learning.svg`}
            x="281"
            y="257"
            width="138"
            height="22"
            aria-label="Chimple Learning"
          />
        </svg>
      </div>
    );
  },
);

CampaignCertificateArtwork.displayName = 'CampaignCertificateArtwork';

export default CampaignCertificateArtwork;
