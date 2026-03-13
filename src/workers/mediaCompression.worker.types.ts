export type VideoQuality = "high" | "medium" | "low";

export type CompressWorkerRequest =
  | {
      id: string;
      type: "COMPRESS_VIDEO";
      payload: {
        fileName: string;
        mimeType: string;
        buffer: ArrayBuffer;
        quality: VideoQuality;
      };
    }
  | {
      id: string;
      type: "COMPRESS_IMAGE_CANVAS";
      payload: {
        fileName: string;
        mimeType: string;
        buffer: ArrayBuffer;
        maxImageDimension: number;
        imageQuality: number;
      };
    }
  | {
      id: string;
      type: "COMPRESS_IMAGE_FFMPEG";
      payload: {
        fileName: string;
        mimeType: string;
        buffer: ArrayBuffer;
      };
    };

export type CompressWorkerProgressResponse = {
  id: string;
  ok: true;
  progress: number;
  phase: "loading" | "processing" | "finalizing";
};

export type CompressWorkerSuccessResponse = {
  id: string;
  ok: true;
  done: true;
  result: {
    fileName: string;
    mimeType: string;
    buffer: ArrayBuffer;
  };
};

export type CompressWorkerErrorResponse = {
  id: string;
  ok: false;
  error: string;
};

export type CompressWorkerResponse =
  | CompressWorkerProgressResponse
  | CompressWorkerSuccessResponse
  | CompressWorkerErrorResponse;

