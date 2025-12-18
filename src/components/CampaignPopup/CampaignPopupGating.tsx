import React, { useEffect, useState } from "react";
import CampaignPopup from "./CampaignPopup";
import { useGrowthBook } from "@growthbook/growthbook-react";
import { schoolUtil } from "../../utility/schoolUtil";
import { Util } from "../../utility/util";

type CampaignPopupConfig = {
  enabled: boolean;
  allowedDays: number[] | null; // null = show every day
  content: string;
};

type PopupContent = {
  title: string;
  subtitle: string;
  rowText: string;
  dateText: string;
  ctaText: string;
};

const CampaignPopupGating: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);
  const growthbook = useGrowthBook();
  const [popupContent, setPopupContent] = useState<PopupContent | null>(null);

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

    const config = growthbook.getFeatureValue<CampaignPopupConfig>(
      "campaign-popup",
      {
        enabled: false,
        allowedDays: null,
        content: "",
      }
    );

    if (!config.enabled) return;

    // ✅ Parse content
    const [
      title = "",
      subtitle = "",
      rowText = "",
      dateText = "",
      ctaText = "",
    ] = config.content.split("||");

    setPopupContent({
      title,
      subtitle,
      rowText,
      dateText,
      ctaText,
    });

    const today = new Date();
    const day = today.getDay();

    if (Array.isArray(config.allowedDays)) {
      if (!config.allowedDays.includes(day)) return;
    }

    const dateKey = today.toLocaleDateString("en-CA");
    const storageKey = `campaignLastShown_${student.id}_${dateKey}`;

    if (localStorage.getItem(storageKey)) return;

    setShowPopup(true);
    localStorage.setItem(storageKey, "true");
  }, [growthbook]);

  if (!showPopup || !popupContent) return null;
  return (
    <CampaignPopup
      isOpen={showPopup}
      onClose={() => setShowPopup(false)}
      onConfirm={() => setShowPopup(false)}
      {...popupContent}
    />
  );
};

export default CampaignPopupGating;
