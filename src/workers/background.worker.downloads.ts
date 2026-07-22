import {
  DownloadRemoteAudioPayload,
  DownloadStickerBookSvgPayload,
} from './background.worker.types';

export const downloadStickerBookSvg = async (
  payload: DownloadStickerBookSvgPayload,
): Promise<{
  svgText: string;
}> => {
  const response = await fetch(payload.url);
  if (response.ok === false) {
    throw new Error(`Failed to download sticker book svg: ${response.status}`);
  }

  return {
    svgText: await response.text(),
  };
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

export const downloadRemoteAudio = async (
  payload: DownloadRemoteAudioPayload,
): Promise<{
  base64Data: string;
}> => {
  const response = await fetch(payload.url);
  if (response.ok === false) {
    throw new Error(`Failed to download remote audio: ${response.status}`);
  }

  const audioBuffer = await response.arrayBuffer();
  return {
    base64Data: bytesToBase64(new Uint8Array(audioBuffer)),
  };
};
