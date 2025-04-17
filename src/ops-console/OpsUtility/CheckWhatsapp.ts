import axios from "axios";

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

export const checkWhatsappNumbers = async (numbers: string[]) => {
  const results: { number: string; status: string; onWhatsapp: boolean }[] = [];

  for (let i = 0; i < numbers.length; i += 10) {
    const batch = numbers.slice(i, i + 10);
    const data = await validateWhatsappNumbers(batch);

    for (const item of data) {
      results.push({
        number: item.phone_number,
        status: item.status,
        onWhatsapp: (item.status == "valid") ? true : false,
      });
    }
    await new Promise((res) => setTimeout(res, 1000));
  }

  return results;
};
