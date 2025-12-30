export type TriggerType = "APP_OPEN" | "GAME_COMPLETE" | "TIME_ELAPSED";

export interface PopupConfig {
  id: string;
  isActive: boolean;
  priority: number;

  triggers: {
    type: TriggerType;
    value: number;
  };

  schedule: {
    daysOfWeek: number[];
    maxViewsPerDay: number;
    startDate: string;
    endDate: string;
  };

  content: Record<
    string,
    {
      imageUrl: string;
      bodyText: string;
      buttonText: string;
    }
  >;

  action?: {
    type: "DEEP_LINK";
    target: string;
  };
}
