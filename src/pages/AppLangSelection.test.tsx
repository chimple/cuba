import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { LANGUAGE, LANG, PAGES } from "../common/constants";

// --- Mocks ---

jest.mock("ionicons/icons", () => ({
  chevronForward: "chevron-forward-icon",
}));

const mockHistoryReplace = jest.fn();
jest.mock("react-router-dom", () => ({
  useHistory: () => ({
    replace: mockHistoryReplace,
  }),
}));

jest.mock("../i18n", () => ({
  __esModule: true,
  default: {
    changeLanguage: jest.fn().mockResolvedValue(undefined),
    t: jest.fn((str) => str),
  },
}));

jest.mock("../components/Loading", () => ({
  __esModule: true,
  default: (props) => {
    const R = require("react");
    return props.isLoading
      ? R.createElement("div", { "data-testid": "loading" }, "loading")
      : R.createElement("div", { "data-testid": "loaded" }, "not loading");
  },
}));

jest.mock("../components/common/NextButton", () => ({
  __esModule: true,
  default: (props) => {
    const R = require("react");
    return R.createElement(
      "button",
      { "data-testid": "next-btn", onClick: props.onClicked, disabled: props.disabled },
      "Next"
    );
  },
}));

jest.mock("../components/DropDown", () => ({
  __esModule: true,
  default: (props) => {
    const R = require("react");
    var options = (props.optionList || []).map(function (opt) {
      return R.createElement("option", { key: opt.id, value: opt.id }, opt.displayName);
    });
    return R.createElement(
      "select",
      {
        "data-testid": "dropdown",
        value: props.currentValue || "",
        onChange: function (e) { props.onValueChange(e.target.value || null); },
      },
      R.createElement("option", { value: "" }, "None"),
      ...options
    );
  },
}));

// Import after mocks
var AppLangSelection = require("./AppLangSelection").default;
var i18n = require("../i18n").default;

describe("AppLangSelection", function () {
  beforeEach(function () {
    jest.clearAllMocks();
    localStorage.clear();
    // Re-setup i18n mocks (resetMocks: true in craco config clears implementations)
    i18n.t.mockImplementation(function (str) { return str; });
    i18n.changeLanguage.mockResolvedValue(undefined);
  });

  it("renders content after loading completes", async function () {
    render(React.createElement(AppLangSelection));

    await waitFor(function () {
      expect(screen.getByTestId("loaded")).toBeInTheDocument();
    });

    expect(screen.getByText("Choose your language")).toBeInTheDocument();
    expect(screen.getByTestId("dropdown")).toBeInTheDocument();
    expect(screen.getByTestId("next-btn")).toBeInTheDocument();
  });

  it("renders all language options in the dropdown", async function () {
    render(React.createElement(AppLangSelection));

    await waitFor(function () {
      expect(screen.getByTestId("dropdown")).toBeInTheDocument();
    });

    var dropdown = screen.getByTestId("dropdown");
    var options = dropdown.querySelectorAll("option");
    // "None" + en, hi, kn, mr = 5
    expect(options.length).toBe(5);
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("loads existing language from localStorage on mount and calls i18n.changeLanguage", async function () {
    localStorage.setItem(LANGUAGE, LANG.HINDI);
    render(React.createElement(AppLangSelection));

    await waitFor(function () {
      expect(i18n.changeLanguage).toHaveBeenCalledWith(LANG.HINDI);
    });

    await waitFor(function () {
      var dropdown = screen.getByTestId("dropdown") as HTMLSelectElement;
      expect(dropdown.value).toBe(LANG.HINDI);
    });
  });

  it("does not call i18n.changeLanguage on mount when no language in localStorage", async function () {
    render(React.createElement(AppLangSelection));

    await waitFor(function () {
      expect(screen.getByTestId("loaded")).toBeInTheDocument();
    });

    expect(i18n.changeLanguage).not.toHaveBeenCalled();
  });

  it("handles dropdown value change to a valid language", async function () {
    render(React.createElement(AppLangSelection));

    await waitFor(function () {
      expect(screen.getByTestId("dropdown")).toBeInTheDocument();
    });

    var dropdown = screen.getByTestId("dropdown");

    fireEvent.change(dropdown, { target: { value: LANG.MARATHI } });

    await waitFor(function () {
      expect(localStorage.getItem(LANGUAGE)).toBe(LANG.MARATHI);
      expect(i18n.changeLanguage).toHaveBeenCalledWith(LANG.MARATHI);
    });
  });

  it("handles dropdown value change to empty (covers !selectedLang early return)", async function () {
    render(React.createElement(AppLangSelection));

    await waitFor(function () {
      expect(screen.getByTestId("dropdown")).toBeInTheDocument();
    });

    var dropdown = screen.getByTestId("dropdown");

    // First set a valid value
    fireEvent.change(dropdown, { target: { value: LANG.KANNADA } });
    await waitFor(function () {
      expect(localStorage.getItem(LANGUAGE)).toBe(LANG.KANNADA);
    });

    // Clear mocks to isolate the next action
    jest.clearAllMocks();
    localStorage.setItem(LANGUAGE, "test-value");

    // Select empty => onValueChange receives null => early return
    fireEvent.change(dropdown, { target: { value: "" } });

    await waitFor(function () {
      expect(localStorage.getItem(LANGUAGE)).toBe("test-value");
    });
    expect(i18n.changeLanguage).not.toHaveBeenCalled();
  });

  it("handles Next button click when language IS already set in localStorage", async function () {
    localStorage.setItem(LANGUAGE, LANG.HINDI);
    render(React.createElement(AppLangSelection));

    await waitFor(function () {
      expect(screen.getByTestId("next-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("next-btn"));

    await waitFor(function () {
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.LOGIN);
    });

    expect(localStorage.getItem(LANGUAGE)).toBe(LANG.HINDI);
  });

  it("handles Next button click when language is NOT set (falls back to English)", async function () {
    render(React.createElement(AppLangSelection));

    await waitFor(function () {
      expect(screen.getByTestId("next-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("next-btn"));

    await waitFor(function () {
      expect(localStorage.getItem(LANGUAGE)).toBe(LANG.ENGLISH);
      expect(i18n.changeLanguage).toHaveBeenCalledWith(LANG.ENGLISH);
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.LOGIN);
    });
  });

  it("renders the Chimple brand logo", async function () {
    render(React.createElement(AppLangSelection));

    await waitFor(function () {
      expect(screen.getByTestId("loaded")).toBeInTheDocument();
    });

    var logo = screen.getByAltText("Chimple Brand Logo");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "assets/icons/ChimpleBrandLogo.svg");
  });

  it("renders inside an IonPage", async function () {
    render(React.createElement(AppLangSelection));

    await waitFor(function () {
      expect(screen.getByTestId("ion-page")).toBeInTheDocument();
    });
  });

  it("changes dropdown value for each language option", async function () {
    render(React.createElement(AppLangSelection));

    await waitFor(function () {
      expect(screen.getByTestId("dropdown")).toBeInTheDocument();
    });

    var dropdown = screen.getByTestId("dropdown");
    var langs = [LANG.ENGLISH, LANG.HINDI, LANG.KANNADA, LANG.MARATHI];

    for (var idx = 0; idx < langs.length; idx++) {
      fireEvent.change(dropdown, { target: { value: langs[idx] } });
      await waitFor(function () {
        expect(localStorage.getItem(LANGUAGE)).toBe(langs[idx]);
        expect(i18n.changeLanguage).toHaveBeenCalledWith(langs[idx]);
      });
    }
  });
});
