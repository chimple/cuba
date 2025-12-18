import React, { useEffect, useState } from "react";
import CampaignPopup from "./CampaignPopup";
import { useGrowthBook } from "@growthbook/growthbook-react";
import { schoolUtil } from "../../utility/schoolUtil";
import { Util } from "../../utility/util";

type CampaignPopupConfig = {
  enabled: boolean;
  allowedDays: number[] | null; // null = show every day
};

const CampaignPopupGating: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);
  const growthbook = useGrowthBook();

  useEffect(() => {
    if (!growthbook) return;

    const student = Util.getCurrentStudent();
    if (!student?.id) return;

    const school = schoolUtil.getCurrentClass();
    if (!school?.school_id) return;

    // 1️⃣ Set GrowthBook attributes (for targeting)
    growthbook.setAttributes({
      ...growthbook.getAttributes(),
      school_ids: school.school_id,
      student_id: student.id,
    });

    // 2️⃣ Read feature config from GrowthBook
    const config = growthbook.getFeatureValue<CampaignPopupConfig>(
      "campaign-popup",
      {
        enabled: false,
        allowedDays: null,
      }
    );

    if (!config.enabled) return;

    // 3️⃣ Day check
    const today = new Date();
    const day = today.getDay(); // 0 (Sun) - 6 (Sat)

    // If allowedDays is defined → restrict to those days
    if (Array.isArray(config.allowedDays)) {
      if (!config.allowedDays.includes(day)) return;
    }

    // 4️⃣ First-time-per-day check (IST-safe)
    const dateKey = today.toLocaleDateString("en-CA"); // yyyy-mm-dd
    const storageKey = `campaignLastShown_${student.id}_${dateKey}`;

    if (localStorage.getItem(storageKey)) return;

    // 5️⃣ Show popup
    setShowPopup(true);
    localStorage.setItem(storageKey, "true");
  }, [growthbook]);

  if (!showPopup) return null;

  return (
    <CampaignPopup
      isOpen={showPopup}
      onClose={() => setShowPopup(false)}
      onConfirm={() => setShowPopup(false)}
    />
  );
};

export default CampaignPopupGating;
