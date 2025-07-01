import { Util } from "../utility/util";
import { SupabaseAuth } from "../services/auth/SupabaseAuth";
import { RoleType } from "../interface/modelInterfaces";
import { EVENTS } from "../common/constants";

const storedStudent: {
  id?: string;
  name?: string;
  type?: string;
} = {};

const handleClick = async (event: MouseEvent) => {
  const student = await SupabaseAuth.i.getCurrentUser();
  storedStudent.id = student?.id || storedStudent.id || "null";
  storedStudent.name = student?.name || storedStudent.name || "null";
  storedStudent.type = RoleType.STUDENT || "null";

  const target = event.target as HTMLElement;

  const getTextContent = (element: HTMLElement | null): string => {
    if (!element) return "null";

    // Prefer label, innerText, or aria-label
    return (
      element.innerText?.trim() ||
      element.getAttribute("aria-label")?.trim() ||
      element.getAttribute("placeholder")?.trim() ||
      element.getAttribute("id")?.trim() ||
      "null"
    );
  };

  const getClickId = (element: HTMLElement | null): string => {
    while (element && element !== document.body) {
      const id = element.getAttribute("id");
      if (id && id.startsWith("click_on_")) return id;
      element = element.parentElement;
    }
    return "";
  };

  const textContent = getTextContent(target);
  const identifier = getClickId(target);

  const eventData = {
    component_name: "PersonalDetails",
    page_path: "/personaldetails",
    complete_path: window.location.href,
    user_id: storedStudent.id,
    user_name: storedStudent.name,
    user_type: storedStudent.type,
    click_value: textContent,
    click_identifier: identifier,
    action_type: event.type,
  };

  Util.logEvent(EVENTS.PROFILE_DETAILS_CLICK_ANALYTICS, eventData);
};

export const initializePersonalDetailsClickListener = () => {
  document.addEventListener("click", handleClick);

  return () => {
    document.removeEventListener("click", handleClick);
  };
};
