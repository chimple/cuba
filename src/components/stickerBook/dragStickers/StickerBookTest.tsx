import { useEffect } from "react";
import { ServiceConfig } from "../../../services/ServiceConfig";

export default function StickerBookTest() {
  useEffect(() => {
    async function runTest() {
      console.log("===== STICKER BOOK TEST START =====");

      const api = ServiceConfig.getI().apiHandler;

      // 🔑 get current user
      const currentUser =
        await ServiceConfig.getI().authHandler.getCurrentUser();

      console.log("USER:", currentUser);

      if (!currentUser?.id) {
        console.log("❌ No user logged in");
        return;
      }

      const userId = currentUser.id;

      // =============================
      // 1️⃣ get all books
      // =============================
      const books = await api.getAllStickerBooks();
      console.log("ALL BOOKS:", books);

      if (!books.length) {
        console.log("❌ No sticker books in DB");
        return;
      }

      const firstBookId = books[0].id;

      // =============================
      // 2️⃣ get current book + progress
      // =============================
      const current =
        await api.getCurrentStickerBookWithProgress(userId);

      console.log("CURRENT BOOK + PROGRESS:", current);

      // =============================
      // 3️⃣ next winnable sticker
      // =============================
      const nextSticker =
        await api.getNextWinnableSticker(firstBookId);

      console.log("NEXT WINNABLE STICKER:", nextSticker);

      if (!nextSticker) {
        console.log("No sticker left to win");
        return;
      }

      // =============================
      // 4️⃣ update sticker won
      // =============================
      await api.updateStickerWon(firstBookId, nextSticker);

      console.log("Sticker added:", nextSticker);

      // =============================
      // 5️⃣ check again
      // =============================
      const after =
        await api.getCurrentStickerBookWithProgress(userId);

      console.log("AFTER UPDATE:", after);

      // =============================
      // 6️⃣ completed books
      // =============================
      const completed =
        await api.getUserWonStickerBooks(userId);

      console.log("COMPLETED BOOKS:", completed);

      console.log("===== TEST END =====");
    }

    runTest();
  }, []);

  return <div>StickerBook API Test → open console</div>;
}