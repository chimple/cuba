import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileDetails from "./ProfileDetails";
import { useFeatureValue } from "@growthbook/growthbook-react";
import { ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";
import { MemoryRouter } from "react-router";
import { logProfileClick } from "../../analytics/profileClickUtil";
import {
  PROFILE_DETAILS_GROWTHBOOK_VARIATION,
  PAGES,
  DEFAULT_LANGUAGE_ID_EN,
} from "../../common/constants";

/* ---------------- MOCKS ---------------- */

jest.mock("@growthbook/growthbook-react");
jest.mock("../../utility/util");
jest.mock("../../services/Firebase", () => ({
  initializeFireBase: jest.fn(),
}));

// Comprehensive i18next mock
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn().mockResolvedValue(true),
      language: "en",
    },
  }),
  initReactI18next: { type: "3rdParty", init: jest.fn() },
}));

// Mock the global i18n instance if imported directly
jest.mock("i18next", () => ({
  changeLanguage: jest.fn().mockResolvedValue(true),
  language: "en",
  t: (key) => key,
  use: jest.fn().mockReturnThis(),
  init: jest.fn(),
}));
jest.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: jest.fn(() => false) },
}));
jest.mock("@capacitor/screen-orientation", () => ({
  ScreenOrientation: { lock: jest.fn() },
}));
jest.mock("../../analytics/profileClickUtil", () => ({
  logProfileClick: jest.fn(() => Promise.resolve()),
}));

/* ---------------- MOCK SETUP ---------------- */

const mockApi = {
  getAllLanguages: jest.fn(),
  getParentStudentProfiles: jest.fn(),
  createProfile: jest.fn(),
  updateStudent: jest.fn(),
  createAutoProfile: jest.fn(),
};

const mockAuth = {
  getCurrentUser: jest.fn(),
};

// LocalStorage Mock
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();

  jest.spyOn(ServiceConfig, "getI").mockReturnValue({
    apiHandler: mockApi,
    authHandler: mockAuth,
  } as any);

  mockApi.getAllLanguages.mockResolvedValue([
    { id: "1", name: "English", code: "en" },
  ]);

  mockApi.getParentStudentProfiles.mockResolvedValue([]);
  mockAuth.getCurrentUser.mockResolvedValue({ id: "user-1" });

  (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);
  (Util.fetchCurrentClassAndSchool as jest.Mock).mockResolvedValue({
    className: "",
    schoolName: "",
  });
  (Util.ensureLidoCommonAudioForStudent as jest.Mock).mockResolvedValue(null);
  (Util.setCurrentStudent as jest.Mock).mockResolvedValue(null);
  (Util.logEvent as jest.Mock).mockImplementation(() => {});
  (logProfileClick as jest.Mock).mockResolvedValue(undefined);
});

describe("ProfileDetails Component", () => {
  // Helper to handle the common text queries which might be keys or strings
  const getSaveBtn = () => screen.getByText(/SAVE/i);
  const getFullNameLabel = () => screen.findByText(/Full Name/i);

  test("renders full name input", async () => {
    (useFeatureValue as jest.Mock).mockReturnValue(
      PROFILE_DETAILS_GROWTHBOOK_VARIATION.CONTROL,
    );

    render(
      <MemoryRouter>
        <ProfileDetails />
      </MemoryRouter>,
    );

    expect(await getFullNameLabel()).toBeInTheDocument();
  });

  test("save button disabled initially", async () => {
    (useFeatureValue as jest.Mock).mockReturnValue(
      PROFILE_DETAILS_GROWTHBOOK_VARIATION.CONTROL,
    );

    render(
      <MemoryRouter>
        <ProfileDetails />
      </MemoryRouter>,
    );

    const saveBtn = await screen.findByText(/SAVE/i);
    expect(saveBtn).toBeDisabled();
  });

  test("save enabled when name entered in NAME_REQUIRED mode", async () => {
    (useFeatureValue as jest.Mock).mockReturnValue(
      PROFILE_DETAILS_GROWTHBOOK_VARIATION.VARIANT_2,
    );

    render(
      <MemoryRouter>
        <ProfileDetails />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/Name Surname/i);
    await userEvent.type(input, "John");

    await waitFor(() => {
      expect(getSaveBtn()).not.toBeDisabled();
    });
  });

  test("skip button visible in ALL_OPTIONAL mode", async () => {
    (useFeatureValue as jest.Mock).mockReturnValue(
      PROFILE_DETAILS_GROWTHBOOK_VARIATION.VARIANT_3,
    );

    render(
      <MemoryRouter>
        <ProfileDetails />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/SKIP FOR NOW/i)).toBeInTheDocument();
  });

  test("createProfile called on save (create mode)", async () => {
    (useFeatureValue as jest.Mock).mockReturnValue(
      PROFILE_DETAILS_GROWTHBOOK_VARIATION.VARIANT_2,
    );
    mockApi.createProfile.mockResolvedValue({ id: "student-1" });

    render(
      <MemoryRouter>
        <ProfileDetails />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/Name Surname/i);
    await userEvent.type(input, "Alice");

    const saveBtn = getSaveBtn();
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockApi.createProfile).toHaveBeenCalled();
    });
  });

  test("updateStudent called in edit mode", async () => {
    (useFeatureValue as jest.Mock).mockReturnValue(
      PROFILE_DETAILS_GROWTHBOOK_VARIATION.VARIANT_2,
    );

    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: "student-1",
      name: "Old Name",
      age: 5,
      gender: "BOY",
      language_id: "1",
      avatar: "avatar1",
    });

    mockApi.updateStudent.mockResolvedValue({ id: "student-1" });

    render(
      <MemoryRouter initialEntries={[PAGES.EDIT_STUDENT]}>
        <ProfileDetails />
      </MemoryRouter>,
    );

    const input = await screen.findByDisplayValue("Old Name");
    await userEvent.clear(input);
    await userEvent.type(input, "New Name");

    await userEvent.click(getSaveBtn());

    await waitFor(() => {
      expect(mockApi.updateStudent).toHaveBeenCalled();
    });
  });

  test("skip creates auto profile when no student exists", async () => {
    (useFeatureValue as jest.Mock).mockReturnValue(
      PROFILE_DETAILS_GROWTHBOOK_VARIATION.VARIANT_3,
    );
    mockApi.createAutoProfile.mockResolvedValue({ id: "auto-1" });

    render(
      <MemoryRouter>
        <ProfileDetails />
      </MemoryRouter>,
    );

    const skipBtn = await screen.findByText(/SKIP FOR NOW/i);
    await userEvent.click(skipBtn);

    await waitFor(() => {
      expect(mockApi.createAutoProfile).toHaveBeenCalled();
    });
  });

  test("loading spinner visible while saving", async () => {
    (useFeatureValue as jest.Mock).mockReturnValue(
      PROFILE_DETAILS_GROWTHBOOK_VARIATION.VARIANT_2,
    );
    mockApi.createProfile.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <ProfileDetails />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByPlaceholderText(/Name Surname/i), "John");
    await userEvent.click(getSaveBtn());

    expect(await screen.findByAltText(/loading/i)).toBeInTheDocument();
  });
});

describe("ProfileDetails Component - additional coverage", () => {
  const nameRequiredEnableCases = [
    "A",
    "AB",
    "John",
    "Alice",
    "Maria",
    "Ravi",
    "Chen",
    "Fatima",
    "Noah",
    "Emma",
    "Omar",
    "Luca",
    "Mia",
    "Ivy",
    "Eli",
    "Zara",
    "Kian",
    "Ava",
    "Leo",
    "Nora",
  ];

  test.each(nameRequiredEnableCases)(
    "NAME_REQUIRED enables save for name: %s",
    async (name) => {
      (useFeatureValue as jest.Mock).mockReturnValue(
        PROFILE_DETAILS_GROWTHBOOK_VARIATION.VARIANT_2,
      );

      render(
        <MemoryRouter>
          <ProfileDetails />
        </MemoryRouter>,
      );

      const input = screen.getByPlaceholderText(/Name Surname/i);
      await userEvent.type(input, name);

      await waitFor(() => {
        expect(screen.getByText("SAVE")).not.toBeDisabled();
      });
    },
  );

  const controlStillDisabledCases = [
    "A",
    "AB",
    "John",
    "Alice",
    "Maria",
    "Ravi",
    "Chen",
    "Fatima",
    "Noah",
    "Emma",
    "Omar",
    "Luca",
    "Mia",
    "Ivy",
    "Eli",
  ];

  test.each(controlStillDisabledCases)(
    "ALL_REQUIRED keeps save disabled with only name: %s",
    async (name) => {
      (useFeatureValue as jest.Mock).mockReturnValue(
        PROFILE_DETAILS_GROWTHBOOK_VARIATION.CONTROL,
      );

      render(
        <MemoryRouter>
          <ProfileDetails />
        </MemoryRouter>,
      );

      const input = screen.getByPlaceholderText(/Name Surname/i);
      await userEvent.type(input, name);

      await waitFor(() => {
        expect(screen.getByText("SAVE")).toBeDisabled();
      });
    },
  );

  const trimCases = [
    { typed: " John ", expected: "John" },
    { typed: "  Alice  ", expected: "Alice" },
    { typed: " Ravi", expected: "Ravi" },
    { typed: "Chen ", expected: "Chen" },
    { typed: "   Mia", expected: "Mia" },
    { typed: "Noah   ", expected: "Noah" },
    { typed: "  Ava Lee  ", expected: "Ava Lee" },
    { typed: "   Zara Khan", expected: "Zara Khan" },
    { typed: "Leo Park   ", expected: "Leo Park" },
    { typed: "  Nora  Kim ", expected: "Nora  Kim" },
    { typed: "   ", expected: "" },
    { typed: "    A", expected: "A" },
    { typed: "B    ", expected: "B" },
    { typed: "  C  ", expected: "C" },
    { typed: "  D E  ", expected: "D E" },
  ];

  test.each(trimCases)(
    'createProfile gets trimmed name for input "$typed"',
    async ({ typed, expected }) => {
      (useFeatureValue as jest.Mock).mockReturnValue(
        PROFILE_DETAILS_GROWTHBOOK_VARIATION.VARIANT_2,
      );
      mockApi.createProfile.mockResolvedValue({ id: "student-1" });

      render(
        <MemoryRouter>
          <ProfileDetails />
        </MemoryRouter>,
      );

      const input = screen.getByPlaceholderText(/Name Surname/i);
      await userEvent.type(input, typed);
      await userEvent.click(screen.getByText("SAVE"));

      await waitFor(() => {
        expect(mockApi.createProfile).toHaveBeenCalled();
      });

      expect(mockApi.createProfile).toHaveBeenCalledWith(
        expected,
        undefined,
        undefined,
        expect.any(String),
        undefined,
        undefined,
        undefined,
        DEFAULT_LANGUAGE_ID_EN,
      );
    },
  );
});

describe("ProfileDetails Component - 50 more test cases", () => {
  const additionalNameRequiredEnableCases = [
    "Liam",
    "Olivia",
    "Noah",
    "Amelia",
    "Mason",
    "Sophia",
    "Ethan",
    "Isabella",
    "James",
    "Charlotte",
    "Benjamin",
    "Harper",
    "Lucas",
    "Evelyn",
    "Henry",
    "Abigail",
    "Alexander",
    "Emily",
    "Michael",
    "Elizabeth",
    "Daniel",
    "Sofia",
    "Jacob",
    "Avery",
    "Sebastian",
    "Jack",
    "Ella",
    "Owen",
    "Scarlett",
    "Wyatt",
    "Victoria",
    "Gabriel",
    "Hannah",
    "Julian",
    "Paisley",
  ];

  test.each(additionalNameRequiredEnableCases)(
    "NAME_REQUIRED enables save for additional name: %s",
    async (name) => {
      (useFeatureValue as jest.Mock).mockReturnValue(
        PROFILE_DETAILS_GROWTHBOOK_VARIATION.VARIANT_2,
      );

      render(
        <MemoryRouter>
          <ProfileDetails />
        </MemoryRouter>,
      );

      const input = screen.getByPlaceholderText(/Name Surname/i);
      await userEvent.type(input, name);

      await waitFor(() => {
        expect(screen.getByText("SAVE")).not.toBeDisabled();
      });
    },
  );

  const additionalTrimmedCreateCases = [
    { typed: " Liam ", expected: "Liam" },
    { typed: "  Olivia", expected: "Olivia" },
    { typed: "Noah  ", expected: "Noah" },
    { typed: " Amelia ", expected: "Amelia" },
    { typed: "  Mason  ", expected: "Mason" },
    { typed: "Sophia ", expected: "Sophia" },
    { typed: " Ethan", expected: "Ethan" },
    { typed: "Isabella  ", expected: "Isabella" },
    { typed: " James ", expected: "James" },
    { typed: "  Charlotte ", expected: "Charlotte" },
    { typed: "Benjamin  ", expected: "Benjamin" },
    { typed: " Harper", expected: "Harper" },
    { typed: " Lucas ", expected: "Lucas" },
    { typed: "  Evelyn", expected: "Evelyn" },
    { typed: "Henry  ", expected: "Henry" },
    { typed: " Abigail ", expected: "Abigail" },
    { typed: "  Alexander ", expected: "Alexander" },
    { typed: "Emily ", expected: "Emily" },
    { typed: " Michael", expected: "Michael" },
    { typed: "Elizabeth  ", expected: "Elizabeth" },
    { typed: " Daniel ", expected: "Daniel" },
    { typed: "  Sofia", expected: "Sofia" },
    { typed: "Jacob  ", expected: "Jacob" },
    { typed: " Avery ", expected: "Avery" },
    { typed: "  Sebastian  ", expected: "Sebastian" },
    { typed: " Jack ", expected: "Jack" },
    { typed: "  Ella", expected: "Ella" },
    { typed: "Owen  ", expected: "Owen" },
    { typed: " Scarlett ", expected: "Scarlett" },
    { typed: "  Wyatt  ", expected: "Wyatt" },
    { typed: "Victoria ", expected: "Victoria" },
    { typed: " Gabriel", expected: "Gabriel" },
    { typed: "Hannah  ", expected: "Hannah" },
    { typed: " Julian ", expected: "Julian" },
    { typed: "  Paisley  ", expected: "Paisley" },
  ];

  test.each(additionalTrimmedCreateCases)(
    'createProfile receives trimmed additional name for input "$typed"',
    async ({ typed, expected }) => {
      (useFeatureValue as jest.Mock).mockReturnValue(
        PROFILE_DETAILS_GROWTHBOOK_VARIATION.VARIANT_2,
      );
      mockApi.createProfile.mockResolvedValue({ id: "student-1" });

      render(
        <MemoryRouter>
          <ProfileDetails />
        </MemoryRouter>,
      );

      const input = screen.getByPlaceholderText(/Name Surname/i);
      await userEvent.type(input, typed);
      await userEvent.click(screen.getByText("SAVE"));

      await waitFor(() => {
        expect(mockApi.createProfile).toHaveBeenCalled();
      });

      expect(mockApi.createProfile).toHaveBeenCalledWith(
        expected,
        undefined,
        undefined,
        expect.any(String),
        undefined,
        undefined,
        undefined,
        DEFAULT_LANGUAGE_ID_EN,
      );
    },
  );
});

describe("ProfileDetails Component - add 27 more cases", () => {
  const extraEnableCases = [
    "Aria",
    "Mateo",
    "Layla",
    "Ezra",
    "Lily",
    "Isaac",
    "Nova",
    "Anthony",
    "Leah",
    "Samuel",
    "Aaliyah",
    "David",
    "Ruby",
    "Christopher",
  ];

  test.each(extraEnableCases)(
    "NAME_REQUIRED enables save for extra name: %s",
    async (name) => {
      (useFeatureValue as jest.Mock).mockReturnValue(
        PROFILE_DETAILS_GROWTHBOOK_VARIATION.VARIANT_2,
      );

      render(
        <MemoryRouter>
          <ProfileDetails />
        </MemoryRouter>,
      );

      const input = screen.getByPlaceholderText(/Name Surname/i);
      await userEvent.type(input, name);

      await waitFor(() => {
        expect(screen.getByText("SAVE")).not.toBeDisabled();
      });
    },
  );

  const extraTrimCases = [
    { typed: " Aria ", expected: "Aria" },
    { typed: "  Mateo", expected: "Mateo" },
    { typed: "Layla  ", expected: "Layla" },
    { typed: " Ezra ", expected: "Ezra" },
    { typed: "  Lily  ", expected: "Lily" },
    { typed: "Isaac ", expected: "Isaac" },
    { typed: " Nova", expected: "Nova" },
    { typed: "Anthony  ", expected: "Anthony" },
    { typed: " Leah ", expected: "Leah" },
    { typed: "  Samuel ", expected: "Samuel" },
    { typed: "Aaliyah  ", expected: "Aaliyah" },
    { typed: " David", expected: "David" },
    { typed: "  Ruby  ", expected: "Ruby" },
  ];

  test.each(extraTrimCases)(
    'createProfile receives trimmed extra name for input "$typed"',
    async ({ typed, expected }) => {
      (useFeatureValue as jest.Mock).mockReturnValue(
        PROFILE_DETAILS_GROWTHBOOK_VARIATION.VARIANT_2,
      );
      mockApi.createProfile.mockResolvedValue({ id: "student-1" });

      render(
        <MemoryRouter>
          <ProfileDetails />
        </MemoryRouter>,
      );

      const input = screen.getByPlaceholderText(/Name Surname/i);
      await userEvent.type(input, typed);
      await userEvent.click(screen.getByText("SAVE"));

      await waitFor(() => {
        expect(mockApi.createProfile).toHaveBeenCalled();
      });

      expect(mockApi.createProfile).toHaveBeenCalledWith(
        expected,
        undefined,
        undefined,
        expect.any(String),
        undefined,
        undefined,
        undefined,
        DEFAULT_LANGUAGE_ID_EN,
      );
    },
  );
});
