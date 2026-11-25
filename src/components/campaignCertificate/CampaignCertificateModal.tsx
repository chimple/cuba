import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import Confetti from 'react-confetti';
import { t } from 'i18next';
import { EVENTS } from '../../common/constants';
import { TRACKABLE_IDS, getTrackableProps } from '../../analytics/trackable';
import { AudioUtil } from '../../utility/AudioUtil';
import { Util } from '../../utility/util';
import CampaignCertificateArtwork from './CampaignCertificateArtwork';
import { logCampaignCertificateEvent } from './campaignCertificateAnalytics';
import {
  dataUrlToFile,
  scheduleNativeSharePreviewRelease,
} from './campaignCertificateSharePreview';
import type {
  CampaignCertificateData,
  CampaignCertificateLabels,
} from './campaignCertificate.types';
import './CampaignCertificateModal.css';

const ASSET_ROOT = '/assets/campaignCompetition';
const POPUP_SOUND = '/assets/audios/common/generic_sound_effect.mp3';
const CHEER_SOUND = '/assets/audios/common/crowd_cheer.mp3';
const CHEER_DELAY_MS = 2000;
const VOICEOVER_DELAY_MS = 4000;
const SHARE_PREVIEW_DELAY_MS = 1200;

const voiceovers: Record<string, string> = {
  en: `${ASSET_ROOT}/Competition English v3.mp3`,
  hi: `${ASSET_ROOT}/Competition Hindi v3.mp3`,
  kn: `${ASSET_ROOT}/Competition Kannada v3.mp3`,
  mr: `${ASSET_ROOT}/Competition Marathi v3.mp3`,
  pt: `${ASSET_ROOT}/Competition reward Portuguese v3.mp3`,
};

const translated = (key: string, defaultValue: string) =>
  String(t(key, { defaultValue }) || defaultValue);

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
  const cheerTimerRef = useRef<number | null>(null);
  const voiceTimerRef = useRef<number | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareCapture, setShowShareCapture] = useState(false);
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

    cheerTimerRef.current = window.setTimeout(() => {
      void cheerAudio.play().catch(() => undefined);
    }, CHEER_DELAY_MS);
    voiceTimerRef.current = window.setTimeout(() => {
      void AudioUtil.playAudioOrTts({ audioUrl: voiceoverUrl });
    }, VOICEOVER_DELAY_MS);

    return () => {
      if (cheerTimerRef.current !== null) {
        window.clearTimeout(cheerTimerRef.current);
      }
      if (voiceTimerRef.current !== null) {
        window.clearTimeout(voiceTimerRef.current);
      }
      popupAudio.pause();
      cheerAudio.pause();
      void AudioUtil.stopAudioUrlOrTtsPlayback();
    };
  }, [voiceoverUrl]);

  const replayVoiceover = () => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    void AudioUtil.playAudioOrTts({ audioUrl: voiceoverUrl });
  };

  const close = () => !isSharing && onClose();

  const share = async () => {
    if (isSharing) return;
    if (cheerTimerRef.current !== null) {
      window.clearTimeout(cheerTimerRef.current);
      cheerTimerRef.current = null;
    }
    if (voiceTimerRef.current !== null) {
      window.clearTimeout(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    popupAudioRef.current?.pause();
    cheerAudioRef.current?.pause();
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    setIsSharing(true);
    setShowShareCapture(true);
    void logCampaignCertificateEvent(
      EVENTS.CAMPAIGN_CERTIFICATE_SHARE_CLICKED,
      certificate,
    );

    let isNativeShare = false;
    try {
      await new Promise<void>((resolve) =>
        window.setTimeout(resolve, SHARE_PREVIEW_DELAY_MS),
      );
      if (!captureRef.current) {
        throw new Error('Certificate share preview is unavailable');
      }
      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      isNativeShare = scheduleNativeSharePreviewRelease(onClose);
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
      if (!isNativeShare) {
        onClose();
      }
    }
  };

  return (
    <div
      id="campaign-certificate-overlay"
      className="campaign-certificate-overlay"
      role="presentation"
    >
      <Confetti
        className="campaign-certificate-confetti"
        width={window.innerWidth}
        height={window.innerHeight}
        numberOfPieces={320}
        recycle={false}
      />
      {!showShareCapture && (
        <div
          id="campaign-certificate-dialog"
          className="campaign-certificate-dialog"
          role="dialog"
          aria-modal="true"
          aria-label={translated(
            'Campaign certificate',
            'Campaign certificate',
          )}
        >
          <div
            id="campaign-certificate-audio"
            className="campaign-certificate-audio"
          >
            <button
              type="button"
              className="campaign-certificate-audio-button"
              id="campaign-certificate-audio-button"
              onClick={replayVoiceover}
              aria-label={translated('Replay audio', 'Replay audio')}
            >
              <img
                src="/assets/icons/SpeakerIcon.svg"
                alt=""
                aria-hidden="true"
              />
            </button>
          </div>
          <button
            type="button"
            className="campaign-certificate-close"
            id="campaign-certificate-close"
            onClick={close}
            disabled={isSharing}
            aria-label={translated('Close', 'Close')}
          />
          <div
            id="campaign-certificate-share-preview"
            className="campaign-certificate-share-preview"
          >
            <CampaignCertificateArtwork
              certificate={certificate}
              labels={labels}
            />
          </div>
          <button
            type="button"
            className="campaign-certificate-share"
            id="campaign-certificate-share"
            onClick={share}
            disabled={isSharing}
            {...getTrackableProps(TRACKABLE_IDS.CAMPAIGN_CERTIFICATE_SHARE)}
          >
            <img
              src="/assets/icons/ShareNetwork.svg"
              alt=""
              aria-hidden="true"
            />
            {labels?.share ?? translated('Share', 'Share')}
          </button>
        </div>
      )}
      {showShareCapture && (
        <div
          id="campaign-certificate-share-capture-overlay"
          className="campaign-certificate-share-capture-overlay"
          role="presentation"
        >
          <div
            id="campaign-certificate-share-stage"
            className="campaign-certificate-share-stage"
          >
            <img
              id="campaign-certificate-share-star-left"
              className="campaign-certificate-share-star campaign-certificate-share-star-left campaign-certificate-share-star--visible"
              data-testid="campaign-certificate-share-star"
              src="/assets/icons/StickerBookStar.svg"
              alt=""
              aria-hidden="true"
            />
            <div
              ref={captureRef}
              id="campaign-certificate-share-capture"
              className="campaign-certificate-share-capture"
            >
              <CampaignCertificateArtwork
                certificate={certificate}
                labels={labels}
              />
            </div>
            <img
              id="campaign-certificate-share-star-right"
              className="campaign-certificate-share-star campaign-certificate-share-star-right campaign-certificate-share-star--visible"
              data-testid="campaign-certificate-share-star"
              src="/assets/icons/StickerBookStar.svg"
              alt=""
              aria-hidden="true"
            />
            <div
              id="campaign-certificate-share-flash"
              className="campaign-certificate-share-flash campaign-certificate-share-flash--active"
              aria-hidden="true"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignCertificateModal;
