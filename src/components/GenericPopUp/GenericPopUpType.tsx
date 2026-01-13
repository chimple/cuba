export type TriggerType = "APP_OPEN" | "GAME_COMPLETE" | "TIME_ELAPSED";

export interface PopupConfig {
  id: string;
  isActive: boolean;
  priority: number;

  screen_name?: string;

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
    thumbnailImageUrl: string;
    backgroundImageUrl?: string;

    heading: string;
    subHeading?: string;
    details?: string[];

    buttonText: string;
  }
>;


  action?: {
    type: "DEEP_LINK";
    target: string;
  };
}
