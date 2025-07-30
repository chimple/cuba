import { Util } from "../utility/util";
import { EVENTS } from "../common/constants";
import { RoleType } from "../interface/modelInterfaces";
import { SupabaseAuth } from "../services/auth/SupabaseAuth";

const storedStudent: {
  id?: string;
  name?: string;
  gender?: string;
  type?: string;
} = {};

const handleClick = async (event: MouseEvent) => {
  const student = await SupabaseAuth.i.getCurrentUser();
  storedStudent.id = student?.id || storedStudent.id || "null";
  storedStudent.name = student?.name || storedStudent.name || "null";
  storedStudent.gender = student?.gender || storedStudent.gender || "null";
  storedStudent.type = RoleType.STUDENT || "null";

  let target = event.target as HTMLElement;
  
  const findRelevantParent = (
    element: HTMLElement | null
  ): { id?: string; className?: string } => {
    while (element) {
      if (element.id) return { id: element.id };
      const frameworkClassPattern =
        /^(menu-|ion-|css-|Mui|chakra|ant-|tailwind|random-|class-|\d)/i;
      const filteredClasses = Array.from(element.classList).filter(
        (cls) => !frameworkClassPattern.test(cls)
      );

      if (filteredClasses.length > 0)
        return { className: filteredClasses.join(" ") };
      element = element.parentElement;
    }
    return {};
  };

  const { id, className } = findRelevantParent(target);

  const eventData = {
    user_id: storedStudent.id,
    user_name: storedStudent.name,
    user_gender: storedStudent.gender,
    user_type: storedStudent.type,
    click_identifier: id || className || "null",
    page_name: window.location.pathname.replace("/", ""),
    page_path: window.location.pathname,
    complete_path: window.location.href,
    action_type: event.type,
  };
  console.log("Profile Click Event Data:", eventData);
  Util.logEvent(EVENTS.PROFILE_CLICKS_ANALYTICS, eventData);
};

export const initializeProfileClickListener = () => {
  document.addEventListener("click", handleClick);

  return () => {
    document.removeEventListener("click", handleClick);
  };
};