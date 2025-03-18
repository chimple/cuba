import { Util } from "../utility/util";
import { EVENTS, MODES, PAGES } from "../common/constants";
import { RoleType } from "../interface/modelInterfaces";
import { ServiceConfig } from "../services/ServiceConfig";

let storedStudent: {
  id?: string;
  name?: string;
  username?: string;
  phone?: string;
  type?: string;
} = {};

const handleClick = async (event: MouseEvent) => {
  if (PAGES.DISPLAY_STUDENT === window.location.pathname) {
    const usr = await ServiceConfig.getI().authHandler.getCurrentUser();
    storedStudent.id = usr?.docId || storedStudent.id || "null";
    storedStudent.name = usr?.name || storedStudent.name || "null";
    storedStudent.username = usr?.username || storedStudent.username || "null";
    storedStudent.phone = usr?.username || storedStudent.username || "null";
    storedStudent.type = RoleType.PARENT;
  } else {
    const student = Util.getCurrentStudent();
    storedStudent.id = student?.docId || storedStudent.id || "null";
    storedStudent.name = student?.name || storedStudent.name || "null";
    storedStudent.username =
      student?.username || storedStudent.username || "null";
    storedStudent.phone = student?.username || storedStudent.username || "null";
    storedStudent.type = RoleType.STUDENT;
  }

  let target = event.target as HTMLElement;
  const getTextContent = (element: HTMLElement): any => {
    let textContent;
    textContent =
      target.innerText?.trim() || target.getAttribute("aria-label")?.trim();
    if (!textContent) {
      if (PAGES.EDIT_STUDENT === window.location.pathname) {
        textContent = target
          .getAttribute("src")
          ?.trim()
          .split("/")
          .pop()
          ?.split(".")[0];
        return textContent;
      }
      while (target && target !== document.body) {
        textContent = target.innerText?.trim();
        if (textContent) break;
        target = target.parentElement as HTMLElement;
      }
      textContent =
        target.innerText?.replace(/\s+/g, " ").trim() ||
        target.getAttribute("aria-label");
    }
    return textContent;
  };
  const textContent = getTextContent(target);

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
    user_username: storedStudent.username,
    user_phone: storedStudent.phone,
    user_type: storedStudent.type,
    click_value: textContent || "null",
    click_identifier: id || className || "null",
    page_name: window.location.pathname.replace("/", ""),
    page_path: window.location.pathname,
    complete_path: window.location.href,
    action_type: event.type,
  };

  console.log("Clicked Logging Event Data:", eventData);
  Util.logEvent(EVENTS.CLICKS_ANALYTICS, eventData);
};

export const initializeClickListener = () => {
  document.addEventListener("click", handleClick);

  return () => {
    document.removeEventListener("click", handleClick);
  };
};
