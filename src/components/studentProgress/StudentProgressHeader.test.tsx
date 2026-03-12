import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fs from "fs";
import path from "path";
import StudentProgressHeader from "./StudentProgressHeader";
import { PAGES } from "../../common/constants";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockHistory = { push: jest.fn(), replace: jest.fn() };
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useHistory: () => mockHistory,
  };
});

const mockSetPathToBackButton = jest.fn();
jest.mock("../../utility/util", () => ({
  Util: {
    setPathToBackButton: (...args: any[]) => mockSetPathToBackButton(...args),
  },
}));

jest.mock("../common/BackButton", () => ({
  __esModule: true,
  default: ({ onClicked }: any) => (
    <button type="button" onClick={onClicked}>
      back
    </button>
  ),
}));

jest.mock("../parent/RectangularIconButton", () => ({
  __esModule: true,
  default: ({
    name,
    iconSrc,
    isButtonEnable,
    onHeaderIconClick,
    buttonWidth,
    buttonHeight,
  }: any) => (
    <button
      type="button"
      data-testid={`rect-btn-${name}`}
      data-enabled={String(isButtonEnable)}
      data-icon-src={iconSrc}
      data-width={String(buttonWidth)}
      data-height={String(buttonHeight)}
      onClick={onHeaderIconClick}
    >
      {name}
    </button>
  ),
}));

describe("StudentProgressHeader", () => {
  const headerIconList = [
    {
      displayName: "Math",
      iconSrc: "math.svg",
      header: "math-tab",
      course: { id: "course-1" } as any,
    },
    {
      displayName: "English",
      iconSrc: "english.svg",
      header: "eng-tab",
      course: { id: "course-2" } as any,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a back button and one header button per course", () => {
    render(
      <StudentProgressHeader
        currentHeader="math-tab"
        headerIconList={headerIconList}
        onHeaderIconClick={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "back" })).toBeInTheDocument();
    expect(screen.getByTestId("rect-btn-Math")).toBeInTheDocument();
    expect(screen.getByTestId("rect-btn-English")).toBeInTheDocument();
  });

  it("marks only the current header button as enabled", () => {
    render(
      <StudentProgressHeader
        currentHeader="math-tab"
        headerIconList={headerIconList}
        onHeaderIconClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("rect-btn-Math")).toHaveAttribute(
      "data-enabled",
      "true"
    );
    expect(screen.getByTestId("rect-btn-English")).toHaveAttribute(
      "data-enabled",
      "false"
    );
  });

  it("passes the fixed rectangular button sizing and icon source props", () => {
    render(
      <StudentProgressHeader
        currentHeader="math-tab"
        headerIconList={headerIconList}
        onHeaderIconClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("rect-btn-Math")).toHaveAttribute(
      "data-width",
      "18"
    );
    expect(screen.getByTestId("rect-btn-Math")).toHaveAttribute(
      "data-height",
      "8"
    );
    expect(screen.getByTestId("rect-btn-Math")).toHaveAttribute(
      "data-icon-src",
      "math.svg"
    );
  });

  it("passes the icon source props correctly for later header buttons too", () => {
    render(
      <StudentProgressHeader
        currentHeader="math-tab"
        headerIconList={headerIconList}
        onHeaderIconClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("rect-btn-English")).toHaveAttribute(
      "data-width",
      "18"
    );
    expect(screen.getByTestId("rect-btn-English")).toHaveAttribute(
      "data-height",
      "8"
    );
    expect(screen.getByTestId("rect-btn-English")).toHaveAttribute(
      "data-icon-src",
      "english.svg"
    );
  });

  it("calls onHeaderIconClick with the new header when a different tab is clicked", async () => {
    const user = userEvent.setup();
    const onHeaderIconClick = jest.fn();

    render(
      <StudentProgressHeader
        currentHeader="math-tab"
        headerIconList={headerIconList}
        onHeaderIconClick={onHeaderIconClick}
      />
    );

    await user.click(screen.getByTestId("rect-btn-English"));

    expect(onHeaderIconClick).toHaveBeenCalledTimes(1);
    expect(onHeaderIconClick).toHaveBeenCalledWith("eng-tab");
  });

  it("does not call onHeaderIconClick when the current tab is clicked again", async () => {
    const user = userEvent.setup();
    const onHeaderIconClick = jest.fn();

    render(
      <StudentProgressHeader
        currentHeader="math-tab"
        headerIconList={headerIconList}
        onHeaderIconClick={onHeaderIconClick}
      />
    );

    await user.click(screen.getByTestId("rect-btn-Math"));

    expect(onHeaderIconClick).not.toHaveBeenCalled();
  });

  it("calls Util.setPathToBackButton with the parent page and history on back click", async () => {
    const user = userEvent.setup();

    render(
      <StudentProgressHeader
        currentHeader="math-tab"
        headerIconList={headerIconList}
        onHeaderIconClick={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "back" }));

    expect(mockSetPathToBackButton).toHaveBeenCalledWith(
      PAGES.PARENT,
      expect.objectContaining(mockHistory)
    );
  });

  it("renders no header buttons when the header list is empty", () => {
    render(
      <StudentProgressHeader
        currentHeader="math-tab"
        headerIconList={[]}
        onHeaderIconClick={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "back" })).toBeInTheDocument();
    expect(screen.queryByTestId("rect-btn-Math")).not.toBeInTheDocument();
    expect(screen.queryByTestId("rect-btn-English")).not.toBeInTheDocument();
  });

  it("keeps the header container CSS layout contract", () => {
    const css = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/studentProgress/StudentProgressHeader.css"
      ),
      "utf8"
    );

    expect(css).toMatch(
      /#student-progress-header-icons\s*\{[\s\S]*display:\s*flex;/
    );
    expect(css).toMatch(
      /#student-progress-header-middle-icons\s*\{[\s\S]*width:\s*80vw;/
    );
  });

  it("renders header buttons in the same order as the headerIconList", () => {
    render(
      <StudentProgressHeader
        currentHeader="math-tab"
        headerIconList={headerIconList}
        onHeaderIconClick={jest.fn()}
      />
    );

    const buttons = screen.getAllByRole("button");

    expect(buttons[1]).toHaveTextContent("Math");
    expect(buttons[2]).toHaveTextContent("English");
  });

  it("treats an empty currentHeader as no active header", () => {
    render(
      <StudentProgressHeader
        currentHeader=""
        headerIconList={headerIconList}
        onHeaderIconClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("rect-btn-Math")).toHaveAttribute(
      "data-enabled",
      "false"
    );
    expect(screen.getByTestId("rect-btn-English")).toHaveAttribute(
      "data-enabled",
      "false"
    );
  });

  it("calls onHeaderIconClick for each different header the user selects", async () => {
    const user = userEvent.setup();
    const onHeaderIconClick = jest.fn();

    render(
      <StudentProgressHeader
        currentHeader=""
        headerIconList={headerIconList}
        onHeaderIconClick={onHeaderIconClick}
      />
    );

    await user.click(screen.getByTestId("rect-btn-Math"));
    await user.click(screen.getByTestId("rect-btn-English"));

    expect(onHeaderIconClick).toHaveBeenCalledTimes(2);
    expect(onHeaderIconClick).toHaveBeenNthCalledWith(1, "math-tab");
    expect(onHeaderIconClick).toHaveBeenNthCalledWith(2, "eng-tab");
  });

  it("handles duplicate display names by dispatching the clicked header value", async () => {
    const user = userEvent.setup();
    const onHeaderIconClick = jest.fn();
    const duplicateNameHeaders = [
      {
        displayName: "Language",
        iconSrc: "first.svg",
        header: "header-1",
        course: { id: "course-1" } as any,
      },
      {
        displayName: "Language",
        iconSrc: "second.svg",
        header: "header-2",
        course: { id: "course-2" } as any,
      },
    ];

    render(
      <StudentProgressHeader
        currentHeader="header-1"
        headerIconList={duplicateNameHeaders}
        onHeaderIconClick={onHeaderIconClick}
      />
    );

    await user.click(screen.getAllByRole("button", { name: "Language" })[1]);

    expect(onHeaderIconClick).toHaveBeenCalledTimes(1);
    expect(onHeaderIconClick).toHaveBeenCalledWith("header-2");
  });

  it("renders and enables a single header item when it is the current header", () => {
    render(
      <StudentProgressHeader
        currentHeader="solo-tab"
        headerIconList={[
          {
            displayName: "Solo",
            iconSrc: "solo.svg",
            header: "solo-tab",
            course: { id: "course-solo" } as any,
          },
        ]}
        onHeaderIconClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("rect-btn-Solo")).toHaveAttribute(
      "data-enabled",
      "true"
    );
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("forwards non-string header values unchanged to onHeaderIconClick", async () => {
    const user = userEvent.setup();
    const onHeaderIconClick = jest.fn();

    render(
      <StudentProgressHeader
        currentHeader="math-tab"
        headerIconList={[
          ...headerIconList,
          {
            displayName: "Numeric",
            iconSrc: "numeric.svg",
            header: 42 as any,
            course: { id: "course-3" } as any,
          },
        ]}
        onHeaderIconClick={onHeaderIconClick}
      />
    );

    await user.click(screen.getByTestId("rect-btn-Numeric"));

    expect(onHeaderIconClick).toHaveBeenCalledWith(42);
  });

  it("calls onHeaderIconClick on repeated clicks of the same non-active header", async () => {
    const user = userEvent.setup();
    const onHeaderIconClick = jest.fn();

    render(
      <StudentProgressHeader
        currentHeader="math-tab"
        headerIconList={headerIconList}
        onHeaderIconClick={onHeaderIconClick}
      />
    );

    await user.click(screen.getByTestId("rect-btn-English"));
    await user.click(screen.getByTestId("rect-btn-English"));

    expect(onHeaderIconClick).toHaveBeenCalledTimes(2);
    expect(onHeaderIconClick).toHaveBeenNthCalledWith(1, "eng-tab");
    expect(onHeaderIconClick).toHaveBeenNthCalledWith(2, "eng-tab");
  });

  it("marks the second header as enabled when currentHeader matches it", () => {
    render(
      <StudentProgressHeader
        currentHeader="eng-tab"
        headerIconList={headerIconList}
        onHeaderIconClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("rect-btn-Math")).toHaveAttribute(
      "data-enabled",
      "false"
    );
    expect(screen.getByTestId("rect-btn-English")).toHaveAttribute(
      "data-enabled",
      "true"
    );
  });

  it("does not call onHeaderIconClick when the second tab is already current", async () => {
    const user = userEvent.setup();
    const onHeaderIconClick = jest.fn();

    render(
      <StudentProgressHeader
        currentHeader="eng-tab"
        headerIconList={headerIconList}
        onHeaderIconClick={onHeaderIconClick}
      />
    );

    await user.click(screen.getByTestId("rect-btn-English"));

    expect(onHeaderIconClick).not.toHaveBeenCalled();
  });

  it("calls onHeaderIconClick with the first header when switching away from the second", async () => {
    const user = userEvent.setup();
    const onHeaderIconClick = jest.fn();

    render(
      <StudentProgressHeader
        currentHeader="eng-tab"
        headerIconList={headerIconList}
        onHeaderIconClick={onHeaderIconClick}
      />
    );

    await user.click(screen.getByTestId("rect-btn-Math"));

    expect(onHeaderIconClick).toHaveBeenCalledTimes(1);
    expect(onHeaderIconClick).toHaveBeenCalledWith("math-tab");
  });

  it("uses loose inequality for click suppression even when strict active styling stays false", async () => {
    const user = userEvent.setup();
    const onHeaderIconClick = jest.fn();

    render(
      <StudentProgressHeader
        currentHeader={42 as any}
        headerIconList={[
          {
            displayName: "Numeric String",
            iconSrc: "num-string.svg",
            header: "42" as any,
            course: { id: "course-1" } as any,
          },
        ]}
        onHeaderIconClick={onHeaderIconClick}
      />
    );

    await user.click(screen.getByTestId("rect-btn-Numeric String"));

    expect(onHeaderIconClick).not.toHaveBeenCalled();
    expect(screen.getByTestId("rect-btn-Numeric String")).toHaveAttribute(
      "data-enabled",
      "false"
    );
  });

  it("treats undefined currentHeader as no active header", () => {
    render(
      <StudentProgressHeader
        currentHeader={undefined as any}
        headerIconList={headerIconList}
        onHeaderIconClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("rect-btn-Math")).toHaveAttribute("data-enabled", "false");
    expect(screen.getByTestId("rect-btn-English")).toHaveAttribute("data-enabled", "false");
  });

  it("treats null currentHeader as no active header", () => {
    render(
      <StudentProgressHeader
        currentHeader={null as any}
        headerIconList={headerIconList}
        onHeaderIconClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("rect-btn-Math")).toHaveAttribute("data-enabled", "false");
    expect(screen.getByTestId("rect-btn-English")).toHaveAttribute("data-enabled", "false");
  });

  it("enables a boolean header when currentHeader is the same boolean", () => {
    render(
      <StudentProgressHeader
        currentHeader={true as any}
        headerIconList={[
          {
            displayName: "True Header",
            iconSrc: "true.svg",
            header: true as any,
            course: { id: "course-true" } as any,
          },
        ]}
        onHeaderIconClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("rect-btn-True Header")).toHaveAttribute(
      "data-enabled",
      "true"
    );
  });

  it("dispatches false when switching from a true boolean header", async () => {
    const user = userEvent.setup();
    const onHeaderIconClick = jest.fn();

    render(
      <StudentProgressHeader
        currentHeader={true as any}
        headerIconList={[
          {
            displayName: "True Header",
            iconSrc: "true.svg",
            header: true as any,
            course: { id: "course-true" } as any,
          },
          {
            displayName: "False Header",
            iconSrc: "false.svg",
            header: false as any,
            course: { id: "course-false" } as any,
          },
        ]}
        onHeaderIconClick={onHeaderIconClick}
      />
    );

    await user.click(screen.getByTestId("rect-btn-False Header"));

    expect(onHeaderIconClick).toHaveBeenCalledWith(false);
  });

  it("suppresses clicks when currentHeader is false and the header is 0", async () => {
    const user = userEvent.setup();
    const onHeaderIconClick = jest.fn();

    render(
      <StudentProgressHeader
        currentHeader={false as any}
        headerIconList={[
          {
            displayName: "Zero Header",
            iconSrc: "zero.svg",
            header: 0 as any,
            course: { id: "course-zero" } as any,
          },
        ]}
        onHeaderIconClick={onHeaderIconClick}
      />
    );

    await user.click(screen.getByTestId("rect-btn-Zero Header"));

    expect(onHeaderIconClick).not.toHaveBeenCalled();
    expect(screen.getByTestId("rect-btn-Zero Header")).toHaveAttribute(
      "data-enabled",
      "false"
    );
  });

  it("suppresses clicks when currentHeader is 0 and the header is the string 0", async () => {
    const user = userEvent.setup();
    const onHeaderIconClick = jest.fn();

    render(
      <StudentProgressHeader
        currentHeader={0 as any}
        headerIconList={[
          {
            displayName: "String Zero Header",
            iconSrc: "string-zero.svg",
            header: "0" as any,
            course: { id: "course-string-zero" } as any,
          },
        ]}
        onHeaderIconClick={onHeaderIconClick}
      />
    );

    await user.click(screen.getByTestId("rect-btn-String Zero Header"));

    expect(onHeaderIconClick).not.toHaveBeenCalled();
    expect(screen.getByTestId("rect-btn-String Zero Header")).toHaveAttribute(
      "data-enabled",
      "false"
    );
  });

  it("suppresses clicks when currentHeader is null and the header is undefined", async () => {
    const user = userEvent.setup();
    const onHeaderIconClick = jest.fn();

    render(
      <StudentProgressHeader
        currentHeader={null as any}
        headerIconList={[
          {
            displayName: "Undefined Header",
            iconSrc: "undefined.svg",
            header: undefined as any,
            course: { id: "course-undefined" } as any,
          },
        ]}
        onHeaderIconClick={onHeaderIconClick}
      />
    );

    await user.click(screen.getByTestId("rect-btn-Undefined Header"));

    expect(onHeaderIconClick).not.toHaveBeenCalled();
    expect(screen.getByTestId("rect-btn-Undefined Header")).toHaveAttribute(
      "data-enabled",
      "false"
    );
  });

  it("treats NaN headers as different and dispatches on click", async () => {
    const user = userEvent.setup();
    const onHeaderIconClick = jest.fn();

    render(
      <StudentProgressHeader
        currentHeader={Number.NaN as any}
        headerIconList={[
          {
            displayName: "NaN Header",
            iconSrc: "nan.svg",
            header: Number.NaN as any,
            course: { id: "course-nan" } as any,
          },
        ]}
        onHeaderIconClick={onHeaderIconClick}
      />
    );

    await user.click(screen.getByTestId("rect-btn-NaN Header"));

    expect(onHeaderIconClick).toHaveBeenCalledTimes(1);
    expect(Number.isNaN(onHeaderIconClick.mock.calls[0][0])).toBe(true);
    expect(screen.getByTestId("rect-btn-NaN Header")).toHaveAttribute(
      "data-enabled",
      "false"
    );
  });

  it("recognizes matching symbol headers as active", () => {
    const activeHeader = Symbol("active");

    render(
      <StudentProgressHeader
        currentHeader={activeHeader as any}
        headerIconList={[
          {
            displayName: "Symbol Header",
            iconSrc: "symbol.svg",
            header: activeHeader as any,
            course: { id: "course-symbol" } as any,
          },
        ]}
        onHeaderIconClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("rect-btn-Symbol Header")).toHaveAttribute(
      "data-enabled",
      "true"
    );
  });

  it("does not dispatch when the same symbol header is clicked again", async () => {
    const user = userEvent.setup();
    const onHeaderIconClick = jest.fn();
    const activeHeader = Symbol("active");

    render(
      <StudentProgressHeader
        currentHeader={activeHeader as any}
        headerIconList={[
          {
            displayName: "Symbol Header",
            iconSrc: "symbol.svg",
            header: activeHeader as any,
            course: { id: "course-symbol" } as any,
          },
        ]}
        onHeaderIconClick={onHeaderIconClick}
      />
    );

    await user.click(screen.getByTestId("rect-btn-Symbol Header"));

    expect(onHeaderIconClick).not.toHaveBeenCalled();
  });

  it("recognizes the same object reference as the active header", () => {
    const activeHeader = { id: "shared" };

    render(
      <StudentProgressHeader
        currentHeader={activeHeader as any}
        headerIconList={[
          {
            displayName: "Object Header",
            iconSrc: "object.svg",
            header: activeHeader as any,
            course: { id: "course-object" } as any,
          },
        ]}
        onHeaderIconClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("rect-btn-Object Header")).toHaveAttribute(
      "data-enabled",
      "true"
    );
  });

  it("dispatches when object headers are structurally equal but not the same reference", async () => {
    const user = userEvent.setup();
    const onHeaderIconClick = jest.fn();

    render(
      <StudentProgressHeader
        currentHeader={{ id: "same-shape" } as any}
        headerIconList={[
          {
            displayName: "Object Header",
            iconSrc: "object.svg",
            header: { id: "same-shape" } as any,
            course: { id: "course-object" } as any,
          },
        ]}
        onHeaderIconClick={onHeaderIconClick}
      />
    );

    await user.click(screen.getByTestId("rect-btn-Object Header"));

    expect(onHeaderIconClick).toHaveBeenCalledTimes(1);
    expect(onHeaderIconClick.mock.calls[0][0]).toEqual({ id: "same-shape" });
    expect(screen.getByTestId("rect-btn-Object Header")).toHaveAttribute(
      "data-enabled",
      "false"
    );
  });

  it("renders four course buttons plus back when given four headers", () => {
    render(
      <StudentProgressHeader
        currentHeader="h2"
        headerIconList={[
          { displayName: "One", iconSrc: "1.svg", header: "h1", course: {} as any },
          { displayName: "Two", iconSrc: "2.svg", header: "h2", course: {} as any },
          { displayName: "Three", iconSrc: "3.svg", header: "h3", course: {} as any },
          { displayName: "Four", iconSrc: "4.svg", header: "h4", course: {} as any },
        ]}
        onHeaderIconClick={jest.fn()}
      />
    );

    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("preserves order across three headers beyond the default fixture", () => {
    render(
      <StudentProgressHeader
        currentHeader="h2"
        headerIconList={[
          { displayName: "First", iconSrc: "1.svg", header: "h1", course: {} as any },
          { displayName: "Second", iconSrc: "2.svg", header: "h2", course: {} as any },
          { displayName: "Third", iconSrc: "3.svg", header: "h3", course: {} as any },
        ]}
        onHeaderIconClick={jest.fn()}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[1]).toHaveTextContent("First");
    expect(buttons[2]).toHaveTextContent("Second");
    expect(buttons[3]).toHaveTextContent("Third");
  });

  it("renders a header item even when displayName is an empty string", () => {
    render(
      <StudentProgressHeader
        currentHeader="filled"
        headerIconList={[
          {
            displayName: "",
            iconSrc: "blank.svg",
            header: "blank",
            course: { id: "course-blank" } as any,
          },
        ]}
        onHeaderIconClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("rect-btn-")).toBeInTheDocument();
  });

  it("forwards an empty iconSrc string without crashing", () => {
    render(
      <StudentProgressHeader
        currentHeader="filled"
        headerIconList={[
          {
            displayName: "No Icon",
            iconSrc: "",
            header: "no-icon",
            course: { id: "course-no-icon" } as any,
          },
        ]}
        onHeaderIconClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("rect-btn-No Icon")).toHaveAttribute(
      "data-icon-src",
      ""
    );
  });

  it("calls the back handler every time the back button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <StudentProgressHeader
        currentHeader="math-tab"
        headerIconList={headerIconList}
        onHeaderIconClick={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "back" }));
    await user.click(screen.getByRole("button", { name: "back" }));

    expect(mockSetPathToBackButton).toHaveBeenCalledTimes(2);
  });

  it("does not trigger onHeaderIconClick when only the back button is used", async () => {
    const user = userEvent.setup();
    const onHeaderIconClick = jest.fn();

    render(
      <StudentProgressHeader
        currentHeader="math-tab"
        headerIconList={headerIconList}
        onHeaderIconClick={onHeaderIconClick}
      />
    );

    await user.click(screen.getByRole("button", { name: "back" }));

    expect(onHeaderIconClick).not.toHaveBeenCalled();
  });

  it("marks both items enabled when duplicate header values match currentHeader", () => {
    render(
      <StudentProgressHeader
        currentHeader="shared-header"
        headerIconList={[
          {
            displayName: "Alpha",
            iconSrc: "alpha.svg",
            header: "shared-header",
            course: { id: "course-a" } as any,
          },
          {
            displayName: "Beta",
            iconSrc: "beta.svg",
            header: "shared-header",
            course: { id: "course-b" } as any,
          },
        ]}
        onHeaderIconClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("rect-btn-Alpha")).toHaveAttribute("data-enabled", "true");
    expect(screen.getByTestId("rect-btn-Beta")).toHaveAttribute("data-enabled", "true");
  });

  it("does not dispatch when duplicate header values already match currentHeader", async () => {
    const user = userEvent.setup();
    const onHeaderIconClick = jest.fn();

    render(
      <StudentProgressHeader
        currentHeader="shared-header"
        headerIconList={[
          {
            displayName: "Alpha",
            iconSrc: "alpha.svg",
            header: "shared-header",
            course: { id: "course-a" } as any,
          },
          {
            displayName: "Beta",
            iconSrc: "beta.svg",
            header: "shared-header",
            course: { id: "course-b" } as any,
          },
        ]}
        onHeaderIconClick={onHeaderIconClick}
      />
    );

    await user.click(screen.getByTestId("rect-btn-Alpha"));
    await user.click(screen.getByTestId("rect-btn-Beta"));

    expect(onHeaderIconClick).not.toHaveBeenCalled();
  });

  it("renders a mixed numeric and string header list without losing individual buttons", () => {
    render(
      <StudentProgressHeader
        currentHeader="1"
        headerIconList={[
          {
            displayName: "Numeric One",
            iconSrc: "one.svg",
            header: 1 as any,
            course: { id: "course-1" } as any,
          },
          {
            displayName: "String One",
            iconSrc: "one-string.svg",
            header: "1" as any,
            course: { id: "course-2" } as any,
          },
        ]}
        onHeaderIconClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("rect-btn-Numeric One")).toBeInTheDocument();
    expect(screen.getByTestId("rect-btn-String One")).toBeInTheDocument();
  });

  it("dispatches a symbol header unchanged when switching from a different current header", async () => {
    const user = userEvent.setup();
    const onHeaderIconClick = jest.fn();
    const targetHeader = Symbol("target");

    render(
      <StudentProgressHeader
        currentHeader="math-tab"
        headerIconList={[
          ...headerIconList,
          {
            displayName: "Symbol Target",
            iconSrc: "symbol-target.svg",
            header: targetHeader as any,
            course: { id: "course-symbol-target" } as any,
          },
        ]}
        onHeaderIconClick={onHeaderIconClick}
      />
    );

    await user.click(screen.getByTestId("rect-btn-Symbol Target"));

    expect(onHeaderIconClick).toHaveBeenCalledWith(targetHeader);
  });
});
