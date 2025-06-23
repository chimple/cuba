import axios from "axios";
import { RoleType } from "../../interface/modelInterfaces";
import { USER_ROLE } from "../../common/constants";

const RAPID_API_KEY = process.env.REACT_APP_RAPIDAPI_KEY;

async function validateWhatsappNumbers(phoneNumbers: string[]): Promise<any> {
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
    console.error("Error:", error);
    throw error;
  }
}

export const checkWhatsappNumbers = async (numbers: string[]) => {            //number shuould be E.164 ("919876543210") format
  const currentUserRole = JSON.parse(localStorage.getItem(USER_ROLE)!);

  if (
    currentUserRole === RoleType.PROGRAM_MANAGER ||
    currentUserRole === RoleType.FIELD_COORDINATOR ||
    currentUserRole === RoleType.OPERATIONAL_DIRECTOR
  ) {
    const results: { number: string; status: string; onWhatsapp: boolean }[] =
      [];

    for (let i = 0; i < numbers.length; i += 10) {
      const batch = numbers.slice(i, i + 10);
      const data = await validateWhatsappNumbers(batch);

      for (const item of data) {
        results.push({
          number: item.phone_number,
          status: item.status,
          onWhatsapp: item.status == "valid" ? true : false,
        });
      }
      await new Promise((res) => setTimeout(res, 1000));
    }
    return results;
  } else {
    console.error("You don't have permission to validate WhatsApp numbers.");
    return [];
  }
};
