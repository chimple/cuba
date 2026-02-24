import { useEffect } from "react";
import { ServiceConfig } from "../../../services/ServiceConfig";

export default function StickerBookTest() {
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    async function runTest() {
      console.log("===== TEST START =====");

      const books = await api.getStickerBooks();
      console.log("Books:", books);

      if (!books || books.length === 0) {
        console.log("No books found in DB");
        return;
      }

      const bookId = books[0].id;
      const userId = crypto.randomUUID();

      console.log("Adding sticker...");
      try{
      const addRes = await api.addCollectedSticker(
        userId,
        bookId,
        "snail"
      );
      console.log("Add result:", addRes);
    } catch (error) {
        console.error("Error adding sticker:", error);
    }
      console.log("Fetching progress...");
      const progress = await api.getUserProgress(userId, bookId);
      console.log("Progress:", progress);

      console.log("===== TEST END =====");
    }

    runTest();
  }, []);

  return <div>Open console → testing sticker APIs</div>;
}