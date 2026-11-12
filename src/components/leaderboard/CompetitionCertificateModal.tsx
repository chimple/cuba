import { FC, useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Util } from '../../utility/util';
import { EVENTS } from '../../common/constants';
import { logCampaignCertificateEvent } from '../campaignCertificate/campaignCertificateAnalytics';
import type { CampaignCertificateData } from '../campaignCertificate/campaignCertificate.types';
import CampaignCertificateArtwork from '../campaignCertificate/CampaignCertificateArtwork';
import '../campaignCertificate/CampaignCertificateModal.css';
import './CompetitionCertificateModal.css';

type Props = {
  certificate: Omit<CampaignCertificateData, 'rank'> & { rank: 1 | 2 | 3 };
  onClose: () => void;
};

const dataUrlToFile = (dataUrl: string, campaignId: string) => {
  const [header, encoded] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const bytes = Uint8Array.from(window.atob(encoded), (character) =>
    character.charCodeAt(0),
  );

  return new File([bytes], `chimple-certificate-${campaignId}.png`, {
    type: mime,
  });
};

const CompetitionCertificateModal: FC<Props> = ({ certificate, onClose }) => {
  const captureRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const share = async () => {
    if (!captureRef.current || isSharing) return;

    setIsSharing(true);
    void logCampaignCertificateEvent(
      EVENTS.CAMPAIGN_CERTIFICATE_SHARE_CLICKED,
      certificate,
    );
    try {
      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      await Util.sendContentToAndroidOrWebShare(
        `I earned a certificate in ${certificate.campaignName}!`,
        'My Chimple Certificate',
        undefined,
        [dataUrlToFile(dataUrl, certificate.campaignId)],
        { rethrowOnError: true },
      );
      void logCampaignCertificateEvent(
        EVENTS.CAMPAIGN_CERTIFICATE_SHARE_SUCCESS,
        certificate,
      );
    } catch (error) {
      void logCampaignCertificateEvent(
        EVENTS.CAMPAIGN_CERTIFICATE_SHARE_FAILED,
        certificate,
        {
          error_message: error instanceof Error ? error.message : String(error),
        },
      );
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div
      className="competition-certificate-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="competition-certificate-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Competition certificate"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="competition-certificate-stage" ref={captureRef}>
          <img
            className="competition-certificate-star competition-certificate-star-left"
            src="/assets/campaignCompetition/Star 18.svg"
            alt=""
            aria-hidden="true"
          />
          <div
            className="competition-certificate-artwork-target"
            role="button"
            tabIndex={0}
            aria-label="Share competition certificate"
            onClick={() => void share()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                void share();
              }
            }}
          >
            <CampaignCertificateArtwork certificate={certificate} />
          </div>
          <img
            className="competition-certificate-star competition-certificate-star-right"
            src="/assets/campaignCompetition/Star 19.svg"
            alt=""
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
};

export const toCompetitionCertificateRank = (
  rank: number | string | null | undefined,
): 1 | 2 | 3 | null => {
  const numericRank = Number(rank ?? 0);
  return numericRank === 1 || numericRank === 2 || numericRank === 3
    ? numericRank
    : null;
};

export default CompetitionCertificateModal;
