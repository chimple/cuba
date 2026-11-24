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
  progress: `${ASSET_ROOT}/Campaign participation t.svg`,
  participation: `${ASSET_ROOT}/Campaign participation t.svg`,
} as const;

const rankMessages = {
  1: 'Congratulations on winning Gold!',
  2: 'Congratulations on winning Silver!',
  3: 'Congratulations on winning Bronze!',
  progress: 'Congratulations on participating!',
  participation: 'Congratulations on participating!',
} as const;

const formatCampaignEndDate = (value: string | Date) => {
  if (typeof value === 'string') {
    const dateParts = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (dateParts) return `${dateParts[3]}-${dateParts[2]}-${dateParts[1]}`;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
};

const formatCampaignMonthYear = (value: string | Date, language = 'en') => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const locale = language.toLowerCase().split('-')[0];
  return new Intl.DateTimeFormat(locale, {
    month: locale === 'en' ? 'short' : 'long',
    year: 'numeric',
  }).format(date);
};

const translated = (
  translate: (key: string, options?: Record<string, unknown>) => string,
  key: string,
  defaultValue: string,
  variables: Record<string, string | number> = {},
) => String(translate(key, { ...variables, defaultValue }) || defaultValue);

const textFit = (value: string, maxLength: number, width = 363) =>
  value.length > maxLength
    ? { textLength: width, lengthAdjust: 'spacingAndGlyphs' as const }
    : {};

const compactText = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

type Props = {
  certificate: CampaignCertificateData;
  labels?: CampaignCertificateLabels;
  showStudentName?: boolean;
};

const CampaignCertificateArtwork = forwardRef<HTMLDivElement, Props>(
  ({ certificate, labels = {}, showStudentName = false }, ref) => {
    const { i18n, t } = useTranslation();
    const certificateLanguage = certificate.languageCode
      ?.toLowerCase()
      .split('-')[0];
    const certificateT =
      certificateLanguage && typeof i18n?.getFixedT === 'function'
        ? i18n.getFixedT(certificateLanguage)
        : t;
    const congratulations =
      labels.congratulations ??
      translated(
        certificateT,
        rankMessages[certificate.rank],
        rankMessages[certificate.rank],
      );
    const isParticipationCertificate = ['progress', 'participation'].includes(
      String(certificate.rank),
    );
    const encouragement =
      labels.encouragement ??
      translated(
        certificateT,
        isParticipationCertificate
          ? 'certificate_participation_encouragement'
          : 'certificate_recognition_encouragement',
        'Keep learning and exploring. We are proud of you!',
      );
    const title = (
      labels.title ??
      translated(
        certificateT,
        isParticipationCertificate
          ? 'Certificate of Participation'
          : 'Certificate of Recognition',
        isParticipationCertificate
          ? 'Certificate of Participation'
          : 'Certificate of Recognition',
      )
    ).toUpperCase();
    const campaignMonthYear = formatCampaignMonthYear(
      certificate.campaignEndDate,
      certificateLanguage,
    ).toUpperCase();
    const campaignTitle = /\d{4}\s*$/.test(certificate.campaignName)
      ? certificate.campaignName.toUpperCase()
      : [certificate.campaignName, campaignMonthYear]
          .filter(Boolean)
          .join(', ')
          .toUpperCase();

    return (
      <div ref={ref} className="campaign-certificate-artwork">
        <svg
          className="campaign-certificate-svg"
          viewBox={`0 0 ${CERTIFICATE_WIDTH} ${CERTIFICATE_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={translated(
            certificateT,
            'Campaign reward: {{rank}}',
            `Campaign reward: ${certificate.rank}`,
            { rank: certificate.rank },
          )}
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>
            {translated(
              certificateT,
              'Campaign reward: {{rank}}',
              `Campaign reward: ${certificate.rank}`,
              { rank: certificate.rank },
            )}
          </title>
          <rect
            width={CERTIFICATE_WIDTH}
            height={CERTIFICATE_HEIGHT}
            rx="16.232"
            fill="#fffad9"
          />
          <image
            href={`${ASSET_ROOT}/Border assets.svg`}
            x="2"
            y="10"
            width="462"
            height="314"
            aria-hidden="true"
          />

          <g
            fill="#665800"
            fontFamily="Baloo 2, sans-serif"
            textAnchor="middle"
          >
            <text
              x="233"
              y="52"
              fontSize="16.667"
              fontWeight="700"
              {...textFit(title, 28)}
            >
              {title}
            </text>
            <text
              x="233"
              y="73"
              fontSize="16.667"
              fontWeight="600"
              {...textFit(campaignTitle, 48)}
            >
              {compactText(campaignTitle, 54)}
            </text>
            {showStudentName && certificate.studentName && (
              <text
                x="233"
                y="89"
                fontSize="12"
                fontWeight="600"
                {...textFit(certificate.studentName, 36, 300)}
              >
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
            <text
              x="233"
              y="221"
              fontSize="14"
              fontWeight="600"
              {...textFit(congratulations, 48)}
            >
              {congratulations}
            </text>
            <line
              x1="51.5"
              y1="228"
              x2="414.5"
              y2="228"
              stroke="#dadada"
              strokeWidth="0.901"
            />
            <text
              x="233"
              y="242"
              fontSize="14"
              fontWeight="600"
              {...textFit(encouragement, 53)}
            >
              {encouragement}
            </text>
            <line
              x1="51.5"
              y1="249"
              x2="414.5"
              y2="249"
              stroke="#dadada"
              strokeWidth="0.901"
            />

            <text x="86" y="277" fontSize="14" fontWeight="600">
              {formatCampaignEndDate(certificate.campaignEndDate)}
            </text>
            <line
              x1="44"
              y1="285"
              x2="128"
              y2="285"
              stroke="#dadada"
              strokeWidth="0.901"
            />
          </g>
          <image
            href="/assets/icons/chimple learning logo for certificates.svg"
            x="281"
            y="260"
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
