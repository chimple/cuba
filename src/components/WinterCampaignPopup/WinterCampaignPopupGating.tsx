import React, { useEffect, useState } from "react";
import WinterCampaignPopup from "./WinterCampaignPopup";
import { useGrowthBook } from "@growthbook/growthbook-react";
import { schoolUtil } from "../../utility/schoolUtil";
import { Util } from "../../utility/util";

type WinterCampaignPopupConfig = {
  enabled: boolean;
  allowedDays: number[] | null;
  content: string;
};

type PopupContent = {
  title: string;
  subtitle: string;
  rowText: string;
  dateText: string;
  ctaText: string;
};

const WinterCampaignPopupGating: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState<PopupContent | null>(null);
  const growthbook = useGrowthBook();

  useEffect(() => {
    if (!growthbook) return;

    const student = Util.getCurrentStudent();
    if (!student?.id) return;

    const school = schoolUtil.getCurrentClass();
    if (!school?.school_id) return;

    growthbook.setAttributes({
      ...growthbook.getAttributes(),
      school_ids: school.school_id,
      student_id: student.id,
    });

    const config = growthbook.getFeatureValue<WinterCampaignPopupConfig>(
      "winter-campaign-popup",
      {
        enabled: false,
        allowedDays: null,
        content: "",
      }
    );

    if (!config.enabled) return;

    const [
      title = "",
      subtitle = "",
      rowText = "",
      dateText = "",
      ctaText = "",
    ] = config.content.split("||");

    const today = new Date();
    const day = today.getDay();

    if (Array.isArray(config.allowedDays) && !config.allowedDays.includes(day))
      return;

    const dateKey = today.toLocaleDateString("en-CA");
    const storageKey = `winterCampaignLastShown_${student.id}_${dateKey}`;
    if (localStorage.getItem(storageKey)) return;

    setPopupContent({ title, subtitle, rowText, dateText, ctaText });
    setShowPopup(true);
    localStorage.setItem(storageKey, "true");
  }, [growthbook]);

  if (!showPopup || !popupContent) return null;

  return (
    <WinterCampaignPopup
      isOpen={showPopup}
      onClose={() => setShowPopup(false)}
      onConfirm={() => setShowPopup(false)}
      {...popupContent}
    />
  );
};

export default WinterCampaignPopupGating;
