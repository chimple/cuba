import { Util } from "../utility/util";
import { EVENTS, PAGES } from "../common/constants";
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
  const getTextContent = (element: HTMLElement | null): string | undefined => {
    if (!element) return undefined;
    //Handle Checkboxes
    if (target?.matches('input[type="checkbox"]')) {
      const checkbox = element as HTMLInputElement;
      const isChecked = checkbox.checked;
      // Find associated label
      let labelText: string | undefined;
      let parentElement: HTMLElement | null = checkbox.parentElement;
      while (!labelText && parentElement && parentElement !== document.body) {
        labelText = parentElement.innerText?.trim();
        if (labelText) break;
        parentElement = parentElement.parentElement;
      }
      let textContent = `${labelText}_${isChecked}`;
      return textContent;
    }
    //Handle Texts
    let textContent;
    if (element) {
      const textIn = element.innerText?.trim();
      textContent = textIn;
    } else {
      console.log("Clicked entering");
      textContent = target.getAttribute("aria-label")?.trim();
    }
    if (!textContent) {
      let currentElement: HTMLElement | null = element;
      while (
        !textContent &&
        currentElement &&
        currentElement !== document.body
      ) {
        textContent =
          target.innerText?.replace(/\s+/g, " ").trim() ||
          target.getAttribute("aria-label");
        if (textContent) break;
        target = target.parentElement as HTMLElement;
      }
      if (PAGES.EDIT_STUDENT === window.location.pathname) {
        textContent = target
          .getAttribute("src")
          ?.trim()
          .split("/")
          .pop()
          ?.split(".")[0];
        return textContent;
      }
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
    user_gender: storedStudent.gender,
    user_type: storedStudent.type,
    click_value: textContent,
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
