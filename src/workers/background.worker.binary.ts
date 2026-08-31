import { PrepareBinaryFromBase64Payload } from './background.worker.types';

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

export const prepareBinaryFromBase64 = async (
  payload: PrepareBinaryFromBase64Payload,
): Promise<{
  byteLength: number;
  sha256Hex: string;
  arrayBuffer: ArrayBuffer;
}> => {
  const binary = atob(payload.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const algorithm = payload.algorithm ?? 'SHA-256';
  const hashBuffer = await crypto.subtle.digest(algorithm, bytes);
  return {
    byteLength: bytes.byteLength,
    sha256Hex: toHex(hashBuffer),
    arrayBuffer: bytes.buffer,
  };
};
