import type { Preview } from "@storybook/react";
import i18n from "../src/i18n";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    globalTypes: {
      locale: {
        name: "Locale",
        description: "Internationalization locale",
        toolbar: {
          icon: "globe",
          items: [
            { value: "en", title: "English" },
            { value: "kn", title: "ಕನ್ನಡ" },
            { value: "hi", title: "हिन्दी" },
          ],
          showName: true,
        },
      },
    },
  },
};

i18n.on("languageChanged", (locale) => {
  const direction = i18n.dir(locale);
  document.dir = direction;
});

export default preview;
