import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import Confetti from 'react-confetti';
import { t } from 'i18next';
import { EVENTS } from '../../common/constants';
import { TRACKABLE_IDS, getTrackableProps } from '../../analytics/trackable';
import { AudioUtil } from '../../utility/AudioUtil';
import { Util } from '../../utility/util';
import AudioButton from '../common/AudioButton';
import CampaignCertificateArtwork from './CampaignCertificateArtwork';
import { logCampaignCertificateEvent } from './campaignCertificateAnalytics';
import type {
  CampaignCertificateData,
  CampaignCertificateLabels,
} from './campaignCertificate.types';
import './CampaignCertificateModal.css';

const ASSET_ROOT = '/assets/campaignCompetition';
const POPUP_SOUND = '/assets/audios/common/generic_sound_effect.mp3';
const CHEER_SOUND = '/assets/audios/common/crowd_cheer.mp3';
// Match BadgeCelebrationModal's non-overlapping celebration sequence.
const CHEER_DELAY_MS = 2000;
const VOICEOVER_DELAY_MS = 4000;
// StickerBookSaveModal reveals its stars for 700ms before taking the snapshot.
const SHARE_PREVIEW_DELAY_MS = 700;

const voiceovers: Record<string, string> = {
  en: `${ASSET_ROOT}/Competition English v3.mp3`,
  hi: `${ASSET_ROOT}/Competition Hindi v3.mp3`,
  kn: `${ASSET_ROOT}/Competition Kannada v3.mp3`,
  mr: `${ASSET_ROOT}/Competition Marathi v3.mp3`,
  pt: `${ASSET_ROOT}/Competition reward Portuguese v3.mp3`,
};

const translated = (key: string, defaultValue: string) =>
  String(t(key, { defaultValue }) || defaultValue);

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

type Props = {
  certificate: CampaignCertificateData;
  labels?: CampaignCertificateLabels;
  onClose: () => void;
  onCollected?: (certificate: CampaignCertificateData) => void | Promise<void>;
};

const CampaignCertificateModal = ({
  certificate,
  labels,
  onClose,
  onCollected,
}: Props) => {
  const captureRef = useRef<HTMLDivElement>(null);
  const popupAudioRef = useRef<HTMLAudioElement | null>(null);
  const cheerAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showStars, setShowStars] = useState(false);
  const language = (certificate.languageCode ?? 'en')
    .toLowerCase()
    .split('-')[0];
  const voiceoverUrl = voiceovers[language] ?? voiceovers.en;

  useEffect(() => {
    if (certificate.isNewlyEarned === true) {
      void logCampaignCertificateEvent(
        EVENTS.CAMPAIGN_CERTIFICATE_EARNED,
        certificate,
      );
    }
    void logCampaignCertificateEvent(
      EVENTS.CAMPAIGN_CERTIFICATE_POPUP_VIEWED,
      certificate,
    );
    void onCollected?.(certificate);
  }, [certificate, onCollected]);

  useEffect(() => {
    const popupAudio = new Audio(POPUP_SOUND);
    const cheerAudio = new Audio(CHEER_SOUND);
    popupAudioRef.current = popupAudio;
    cheerAudioRef.current = cheerAudio;
    void popupAudio.play().catch(() => undefined);

    const cheerTimer = window.setTimeout(() => {
      void cheerAudio.play().catch(() => undefined);
    }, CHEER_DELAY_MS);
    const voiceTimer = window.setTimeout(() => {
      void AudioUtil.playAudioOrTts({ audioUrl: voiceoverUrl });
    }, VOICEOVER_DELAY_MS);

    return () => {
      window.clearTimeout(cheerTimer);
      window.clearTimeout(voiceTimer);
      popupAudio.pause();
      cheerAudio.pause();
      void AudioUtil.stopAudioUrlOrTtsPlayback();
    };
  }, [voiceoverUrl]);

  const replayVoiceover = () => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    void AudioUtil.playAudioOrTts({ audioUrl: voiceoverUrl });
  };

  const close = () => {
    if (isSharing) return;
    onClose();
  };

  const share = async () => {
    if (!captureRef.current || isSharing) return;
    setIsSharing(true);
    setShowStars(true);
    void logCampaignCertificateEvent(
      EVENTS.CAMPAIGN_CERTIFICATE_SHARE_CLICKED,
      certificate,
    );

    try {
      await new Promise<void>((resolve) =>
        window.setTimeout(resolve, SHARE_PREVIEW_DELAY_MS),
      );
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
      setShowStars(false);
      setIsSharing(false);
    }
  };

  return (
    <div className="campaign-certificate-overlay" role="presentation">
      <Confetti
        className="campaign-certificate-confetti"
        width={window.innerWidth}
        height={window.innerHeight}
        numberOfPieces={320}
        recycle={false}
      />
      <div
        className="campaign-certificate-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={translated('Campaign certificate', 'Campaign certificate')}
      >
        <div className="campaign-certificate-audio">
          <AudioButton
            size="3.6rem"
            backgroundColor="#fff"
            onClick={replayVoiceover}
            ariaLabel={translated('Replay audio', 'Replay audio')}
          />
        </div>
        <button
          type="button"
          className="campaign-certificate-close"
          onClick={close}
          disabled={isSharing}
          aria-label={translated('Close', 'Close')}
        />
        <img
          className={`campaign-certificate-share-star campaign-certificate-share-star-left${
            showStars ? ' campaign-certificate-share-star--visible' : ''
          }`}
          data-testid="campaign-certificate-share-star"
          src="/assets/icons/StickerBookStar.svg"
          alt=""
          aria-hidden="true"
        />
        <img
          className={`campaign-certificate-share-star campaign-certificate-share-star-right${
            showStars ? ' campaign-certificate-share-star--visible' : ''
          }`}
          data-testid="campaign-certificate-share-star"
          src="/assets/icons/StickerBookStar.svg"
          alt=""
          aria-hidden="true"
        />
        <CampaignCertificateArtwork
          ref={captureRef}
          certificate={certificate}
          labels={labels}
        />
        <button
          type="button"
          className="campaign-certificate-share"
          onClick={share}
          disabled={isSharing}
          {...getTrackableProps(TRACKABLE_IDS.CAMPAIGN_CERTIFICATE_SHARE)}
        >
          <img src="/assets/icons/ShareNetwork.svg" alt="" aria-hidden="true" />
          {labels?.share ?? translated('Share', 'Share')}
        </button>
      </div>
    </div>
  );
};

export default CampaignCertificateModal;
