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
}
