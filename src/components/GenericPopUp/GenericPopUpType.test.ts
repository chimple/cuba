import { PopupConfig, TriggerType } from "./GenericPopUpType";

describe("GenericPopUpType contracts", () => {
  // Covers: supports all configured trigger type values
  it("supports all configured trigger type values", () => {
    const supported: TriggerType[] = [
      "APP_OPEN",
      "GAME_COMPLETE",
      "TIME_ELAPSED",
    ];

    expect(supported).toEqual(
      expect.arrayContaining(["APP_OPEN", "GAME_COMPLETE", "TIME_ELAPSED"]),
    );
  });

  // Covers the payload contract shape expected by PopupManager (required top-level and nested fields).
  // Covers: validates canonical popup config contract consumed by popup manager
  it("validates canonical popup config contract consumed by popup manager", () => {
    const config: PopupConfig = {
      id: "popup-1",
      isActive: true,
      priority: 1,
      screen_name: "home",
      triggers: {
        type: "APP_OPEN",
        value: 1,
      },
      schedule: {
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        maxViewsPerDay: 2,
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-12-31T23:59:59.000Z",
      },
      content: {
        en: {
          thumbnailImageUrl: "/thumb.png",
          backgroundImageUrl: "/bg.png",
          heading: "Heading",
          subHeading: "Sub heading",
          details: ["A", "B"],
          buttonText: "Go",
        },
      },
      action: {
        type: "DEEP_LINK",
        target: "SUBJECTS",
      },
    };

    expect(config.id).toBe("popup-1");
    expect(config.triggers.type).toBe("APP_OPEN");
    expect(config.schedule.maxViewsPerDay).toBe(2);
    expect(config.content.en.buttonText).toBe("Go");
    expect(config.action?.target).toBe("SUBJECTS");
  });
});
