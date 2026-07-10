import axios from "axios";
import { RoleType } from "../../interface/modelInterfaces";
import { USER_ROLE } from "../../common/constants";

const RAPID_API_KEY = process.env.REACT_APP_RAPIDAPI_KEY;

// Internal API call to RapidAPI for WhatsApp validation
async function validateWhatsappNumbers(phoneNumbers: string[]): Promise<any[]> {
  try {
    const response = await axios.post(
      "https://whatsapp-number-validator3.p.rapidapi.com/WhatsappNumberHasItBulkWithToken",
      {
        phone_numbers: phoneNumbers,
      },
      {
        headers: {
          "x-rapidapi-key": RAPID_API_KEY,
          "x-rapidapi-host": "whatsapp-number-validator3.p.rapidapi.com",
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error validating WhatsApp numbers:", error);
    throw error;
  }
}

// Main function to validate WhatsApp numbers in batches
export const checkWhatsappNumbers = async (numbers: string[]) => {
  // ✅ Parse stored user roles as an array of strings
  const currentUserRoles: string[] = JSON.parse(localStorage.getItem(USER_ROLE) ?? "[]");

  // ✅ Allow access only to certain roles
  const allowedRoles = [
    RoleType.PROGRAM_MANAGER,
    RoleType.FIELD_COORDINATOR,
    RoleType.OPERATIONAL_DIRECTOR,
  ];

  const hasPermission = allowedRoles.some((role) => currentUserRoles.includes(role));

  if (!hasPermission) {
    console.error("You don't have permission to validate WhatsApp numbers.");
    return [];
  }

  // ✅ Perform validation in batches of 10 with 1s delay
  const results: { number: string; status: string; onWhatsapp: boolean }[] = [];

  for (let i = 0; i < numbers.length; i += 10) {
    const batch = numbers.slice(i, i + 10);

    try {
      const data = await validateWhatsappNumbers(batch);

      for (const item of data) {
        results.push({
          number: item.phone_number,
          status: item.status,
          onWhatsapp: item.status === "valid",
        });
      }
    } catch (error) {
      console.error("Batch validation failed:", error);
    }

    // ✅ Delay 1s between batches to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
};
