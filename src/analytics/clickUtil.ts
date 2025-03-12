import { Util } from "../utility/util";
import { EVENTS } from "../common/constants";
import { RoleType } from "../interface/modelInterfaces";

const storedStudent: {
  id?: string;
  name?: string;
  gender?: string;
  username?: string;
  phone?: string;
} = {};

const handleClick = (event: MouseEvent | TouchEvent) => {
  const student = Util.getCurrentStudent();
  if (student) {
    storedStudent.id = student.docId;
    storedStudent.name = student.name ?? undefined;
    storedStudent.gender = student.gender ?? undefined;
    storedStudent.username = student.username ?? undefined;
    storedStudent.phone = student.username ?? undefined;
  }

  let path = event.composedPath();
  let target = path[0] as HTMLElement;
  while (target && target.parentElement && !target.textContent?.trim()) {
    target = target.parentElement as HTMLElement;
  }

  let textContent =
    target.innerText?.trim() || target.getAttribute("aria-label") || "";
  textContent = textContent.replace(/\s+/g, " ");

  const findRelevantParent = (
    element: HTMLElement | null
  ): { id?: string; className?: string } => {
    while (element) {
      if (element.id) return { id: element.id };
      const frameworkClassPattern =
        /^(menu-|css-|Mui|chakra|ant-|tailwind|random-|class-|\d)/i;
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
    user_id: storedStudent.id || student?.docId,
    user_name: storedStudent.name || student?.name,
    user_gender: storedStudent.gender || student?.gender,
    user_username: storedStudent.username || student?.username,
    phone_number: storedStudent.phone || student?.username,
    user_type: RoleType.STUDENT,
    click_value: textContent || "No click value found",
    click_identifier: id || className || "No ID or Classname found",
    page_name: window.location.pathname.replace("/", ""),
    page_path: window.location.pathname,
    complete_path: window.location.href,
    action_type: event.type,
  };

  console.log("Clicked Logging Event Data:", eventData);
  Util.logEvent(EVENTS.CLICKS_ANALYTICS, eventData);
};

// Attach event listener on script load
document.addEventListener("click", handleClick);

// Export a cleanup function if needed
export const ClickDetector = () => {
  document.removeEventListener("click", handleClick);
};
