import { useEffect } from "react";
import { ServiceConfig, APIMode } from "../../../services/ServiceConfig";


export default function StickerBookTest() {
  useEffect(() => {
    async function runTest() {
      console.log("===== TEST START =====");

      const api = ServiceConfig.getI().apiHandler;
      console.log("API CLASS:", api.constructor.name);

      // 1️⃣ get books
      const books = await api.getStickerBooks();
      console.log("Books:", books);

      if (!books.length) return;

      const bookId = books[0].id;

      // 2️⃣ get book by id
      const book = await api.getStickerBookById(bookId);
      console.log("Book by id:", book);

      // 3️⃣ get user
      const currentUser =
        await ServiceConfig.getI().authHandler.getCurrentUser();

      console.log("User:", currentUser);

      if (!currentUser?.id) return;

      const userId = currentUser.id;

      // 4️⃣ progress before
      const before = await api.getUserProgress(userId, bookId);
      console.log("Before:", before);

      // 5️⃣ add sticker
      const addRes = await api.addCollectedSticker(bookId, "snail");
      console.log("Add result:", addRes);

      // 6️⃣ progress after
      const after = await api.getUserProgress(userId, bookId);
      console.log("After:", after);

      console.log("===== TEST END =====");
    }

    runTest();
  }, []);

  return <div>Testing sticker APIs → open console</div>;
}