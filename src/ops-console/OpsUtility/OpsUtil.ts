import {
  parsePhoneNumberFromString,
  CountryCode,
  PhoneNumber,
} from "libphonenumber-js";

export class OpsUtil {
  public static validateAndFormatPhoneNumber(
    phoneNumber: string,
    countryCode: CountryCode
  ): {
    valid: boolean;
    internationalFormat?: string;
    nationalFormat?: string;
    e164Format?: string;
    countryCode?: string;
    type?: string;
    nationalWithoutZero?: string;
    message?: string;
  } {
    const phone: PhoneNumber | undefined = parsePhoneNumberFromString(
      phoneNumber,
      countryCode
    );

    if (!phone || !phone.isValid()) {
      return { valid: false, message: "Invalid phone number" };
    }

    return {
      valid: true,
      internationalFormat: phone.formatInternational(),     //'+91 98765 43210'
      nationalFormat: phone.formatNational(),               // '098765 43210'
      e164Format: phone.format("E.164"),                    //'+919876543210'
      countryCode: phone.country,
      type: phone.getType(),
      nationalWithoutZero: phone.nationalNumber.replace(/^0/, ""),    //'9876543210'
    };
  }

  public static parseClassName(
    className: string
  ): { grade: number; section: string } {
    const cleanedName = className.trim();
    if (!cleanedName) {
      return { grade: 0, section: "" };
    }

    let grade = 0;
    let section = "";

    // Match only digits → e.g. "5"
    const numericMatch = cleanedName.match(/^(\d+)$/);
    if (numericMatch) {
      grade = parseInt(numericMatch[1], 10);
      return { grade: isNaN(grade) ? 0 : grade, section: "" };
    }

    // Match digits + optional letters → e.g. "10B" or "10 B"
    const alphanumericMatch = cleanedName.match(/(\d+)\s*(\w+)/i);
    if (alphanumericMatch) {
      grade = parseInt(alphanumericMatch[1], 10);
      section = alphanumericMatch[2];
      return { grade: isNaN(grade) ? 0 : grade, section };
    }

    // Fallback if nothing matches
    console.warn(
      `--- parseClassName: Could not parse grade from class name: "${cleanedName}". Assigning grade 0.`
    );
    return { grade: 0, section: cleanedName };
  }

  public static formatDT(dateString: string): string {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
