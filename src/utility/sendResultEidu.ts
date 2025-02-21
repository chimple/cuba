import { registerPlugin } from "@capacitor/core";

interface PortPluginInterface {
  sendEiduResult(options: { 
    resultType: string;
    score?: number | null;
    duration: number;
    additionalData?: string | null;
    errorDetails?: string;
    items?: any[];
  }): Promise<void>;
}

const PortPlugin = registerPlugin<PortPluginInterface>("Port");

export const sendEiduResultToJava = async (
  resultType: "SUCCESS" | "ABORT" | "TIMEOUT_INACTIVITY" | "TIME_UP" | "ERROR",
  score: number | null,
  duration: number,
  additionalData: string | null,
  items: any[] = [],
  errorDetails?: string
) => {
  try {
    const response = await PortPlugin.sendEiduResult({ 
      resultType, 
      score, 
      duration, 
      additionalData, 
      items,
      errorDetails
    });

    console.log("EIDU result sent successfully:", response);
  } catch (error) {
    console.error("Error sending EIDU result:", error);
  }
};
