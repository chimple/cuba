import React, { useEffect, useState } from "react";
import WinterCampaignPopup from "./WinterCampaignPopup";
import { useGrowthBook } from "@growthbook/growthbook-react";
import { schoolUtil } from "../../utility/schoolUtil";
import { Util } from "../../utility/util";
import { CAMPAIGN_SEQUENCE_FINISHED } from "../../common/constants";

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

// Define the event name

const WinterCampaignPopupGating: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState<PopupContent | null>(null);
  const growthbook = useGrowthBook();

  // Helper to signal that the reward modal can now show
  const finishCampaignSequence = () => {
    (window as any).isCampaignSequenceDone = true; // Global flag for race conditions
    window.dispatchEvent(new CustomEvent(CAMPAIGN_SEQUENCE_FINISHED));
  };

  useEffect(() => {
    if (!growthbook) return;

    const student = Util.getCurrentStudent();
    if (!student?.id) {
      finishCampaignSequence(); // EXIT 1
      return;
    }

    const school = schoolUtil.getCurrentClass();
    if (!school?.school_id) {
      finishCampaignSequence(); // EXIT 2
      return;
    }

    growthbook.setAttributes({
      ...growthbook.getAttributes(),
      school_ids: school.school_id,
      student_id: student.id,
    });

    const config = growthbook.getFeatureValue<WinterCampaignPopupConfig>(
      "winter-campaign-popup",
      { enabled: false, allowedDays: null, content: "" }
    );

    if (!config.enabled) {
      finishCampaignSequence(); // EXIT 3
      return;
    }

    const today = new Date();
    const day = today.getDay();

    if (
      Array.isArray(config.allowedDays) &&
      !config.allowedDays.includes(day)
    ) {
      finishCampaignSequence(); // EXIT 4
      return;
    }

    const dateKey = today.toLocaleDateString("en-CA");
    const storageKey = `winterCampaignLastShown_${student.id}_${dateKey}`;
    if (localStorage.getItem(storageKey)) {
      finishCampaignSequence(); // EXIT 5
      return;
    }

    // If we reached here, WE SHOW THE POPUP
    const [
      title = "",
      subtitle = "",
      rowText = "",
      dateText = "",
      ctaText = "",
    ] = config.content.split("||");

    setPopupContent({ title, subtitle, rowText, dateText, ctaText });
    setShowPopup(true);
    localStorage.setItem(storageKey, "true");
  }, [growthbook]);

  const handleClose = () => {
    setShowPopup(false);
    finishCampaignSequence(); // EXIT 6 (User dismissed popup)
  };

  if (!showPopup || !popupContent) return null;

  return (
    <WinterCampaignPopup
      isOpen={showPopup}
      onClose={handleClose}
      onConfirm={handleClose}
      {...popupContent}
    />
  );
};

export default WinterCampaignPopupGating;
