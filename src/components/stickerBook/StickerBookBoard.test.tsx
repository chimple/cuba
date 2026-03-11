import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import StickerBookBoard from "./StickerBookBoard";

const baseProps = {
  title: "STICKER BOOK : ANIMALS",
  svgUrl: "/assets/icons/StickerBookBoard.svg",
  canGoPrev: true,
  canGoNext: true,
  locked: false,
  onBack: jest.fn(),
  onPrev: jest.fn(),
  onNext: jest.fn(),
};

describe("StickerBookBoard", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () =>
          Promise.resolve(`
            <svg width="500" height="300">
              <g id="background"></g>
              <g id="stickers"></g>
            </svg>
          `),
      }),
    ) as jest.Mock;
  });

  test("renders component", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );
  });

  test("renders board title", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );
    expect(screen.getByText(/STICKER BOOK/i)).toBeInTheDocument();
  });

  test("renders correct title text", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    expect(
      screen.getByText((content) => content.includes("STICKER BOOK : ANIMALS")),
    ).toBeInTheDocument();
  });

  test("renders back button", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  test("back button triggers callback", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(baseProps.onBack).toHaveBeenCalled();
  });

  test("fetches svg on mount", async () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  test("fetch called with correct url", async () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/assets/icons/StickerBookBoard.svg");
    });
  });

  test("fetch called once", async () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  test("renders svg after load", async () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    await waitFor(() => {
      expect(document.querySelector("svg")).toBeInTheDocument();
    });
  });

  test("renders navigation buttons", async () => {
    const { container } = render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector("#sticker-book-nav-left")).toBeTruthy();
      expect(container.querySelector("#sticker-book-nav-right")).toBeTruthy();
    });
  });

  test("left navigation triggers onPrev", async () => {
    const { container } = render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    await waitFor(() => {
      fireEvent.click(
        container.querySelector("#sticker-book-nav-left") as HTMLElement,
      );
    });

    expect(baseProps.onPrev).toHaveBeenCalled();
  });

  test("right navigation triggers onNext", async () => {
    const { container } = render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    await waitFor(() => {
      fireEvent.click(
        container.querySelector("#sticker-book-nav-right") as HTMLElement,
      );
    });

    expect(baseProps.onNext).toHaveBeenCalled();
  });

  test("shows disabled layer when locked", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={true}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    expect(
      document.querySelector(".sticker-book-disabled-layer"),
    ).toBeInTheDocument();
  });

  test("disabled layer not shown when unlocked", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    expect(document.querySelector(".sticker-book-disabled-layer")).toBeNull();
  });

  test("renders with collected stickers", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={["lion", "tiger"]}
      />,
    );
  });

  test("handles svgRaw provided", () => {
    render(
      <StickerBookBoard
        svgRaw={`<svg width="500" height="300">
        <g id="background"></g>
        <g id="stickers"></g>
        </svg>`}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    expect(document.querySelector("svg")).toBeInTheDocument();
  });
  /* ---------------- ADDITIONAL TEST CASES ---------------- */

  test("board root container exists", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    expect(document.querySelector("#sb-board-root")).toBeInTheDocument();
  });

  test("board frame container exists", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    expect(document.querySelector("#sb-frame")).toBeInTheDocument();
  });

  test("board content container exists", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    expect(document.querySelector("#sb-board-content")).toBeInTheDocument();
  });

  test("back button has correct class", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    expect(
      document.querySelector(".sticker-book-back-btn"),
    ).toBeInTheDocument();
  });

  test("back button supports multiple clicks", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    const btn = screen.getByRole("button");

    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);

    expect(baseProps.onBack).toHaveBeenCalledTimes(3);
  });

  test("component renders without collected stickers", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );
  });

  test("component renders with many stickers", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={["lion", "tiger", "cat", "dog", "elephant"]}
      />,
    );
  });

  test("svg background group exists after load", async () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    await waitFor(() => {
      expect(document.querySelector("#background")).toBeInTheDocument();
    });
  });

  test("svg stickers group exists after load", async () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    await waitFor(() => {
      expect(document.querySelector("#stickers")).toBeInTheDocument();
    });
  });

  test("navigation buttons remain clickable", async () => {
    const { container } = render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    await waitFor(() => {
      const left = container.querySelector(
        "#sticker-book-nav-left",
      ) as HTMLElement;
      const right = container.querySelector(
        "#sticker-book-nav-right",
      ) as HTMLElement;

      fireEvent.click(left);
      fireEvent.click(right);
    });

    expect(baseProps.onPrev).toHaveBeenCalled();
    expect(baseProps.onNext).toHaveBeenCalled();
  });

  test("left navigation supports multiple clicks", async () => {
    const { container } = render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    await waitFor(() => {
      const left = container.querySelector(
        "#sticker-book-nav-left",
      ) as HTMLElement;

      fireEvent.click(left);
      fireEvent.click(left);
    });

    expect(baseProps.onPrev).toHaveBeenCalledTimes(2);
  });

  test("right navigation supports multiple clicks", async () => {
    const { container } = render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    await waitFor(() => {
      const right = container.querySelector(
        "#sticker-book-nav-right",
      ) as HTMLElement;

      fireEvent.click(right);
      fireEvent.click(right);
    });

    expect(baseProps.onNext).toHaveBeenCalledTimes(2);
  });

  test("component does not crash when fetch fails", async () => {
    global.fetch = jest.fn(() => Promise.reject("fetch failed")) as jest.Mock;

    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );
  });

  test("component renders title container", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    expect(document.querySelector("#sb-board-title")).toBeInTheDocument();
  });

  test("board title contains sticker text", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    expect(document.querySelector("#sb-board-title")?.textContent).toContain(
      "STICKER BOOK",
    );
  });

  test("component supports rerender", () => {
    const { rerender } = render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    rerender(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={["lion"]}
      />,
    );
  });

  test("component supports rerender with locked state", () => {
    const { rerender } = render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    rerender(
      <StickerBookBoard
        svgRaw={null}
        isLocked={true}
        {...baseProps}
        collectedStickers={[]}
      />,
    );
  });

  test("locked layer appears after rerender", () => {
    const { rerender } = render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    rerender(
      <StickerBookBoard
        svgRaw={null}
        isLocked={true}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    expect(
      document.querySelector(".sticker-book-disabled-layer"),
    ).toBeInTheDocument();
  });

  test("board content container has correct class", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    expect(
      document.querySelector(".sticker-book-board-content"),
    ).toBeInTheDocument();
  });

  test("component renders svg element", async () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    await waitFor(() => {
      expect(document.querySelector("svg")).toBeInTheDocument();
    });
  });

  test("component does not crash with empty props", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        title=""
        canGoPrev={false}
        canGoNext={false}
        onBack={jest.fn()}
        onPrev={jest.fn()}
        onNext={jest.fn()}
        collectedStickers={[]}
      />,
    );
  });

  test("back button has tabindex attribute", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    expect(document.querySelector(".sticker-book-back-btn")).toHaveAttribute(
      "tabindex",
    );
  });

  test("navigation icons exist", async () => {
    const { container } = render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector("#sticker-book-nav-left")).toBeTruthy();
      expect(container.querySelector("#sticker-book-nav-right")).toBeTruthy();
    });
  });

  test("svg width attribute exists", async () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    await waitFor(() => {
      expect(document.querySelector("svg")?.getAttribute("width")).toBe("500");
    });
  });

  test("svg height attribute exists", async () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    await waitFor(() => {
      expect(document.querySelector("svg")?.getAttribute("height")).toBe("300");
    });
  });

  test("component handles many rerenders", () => {
    const { rerender } = render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    for (let i = 0; i < 5; i++) {
      rerender(
        <StickerBookBoard
          svgRaw={null}
          isLocked={false}
          {...baseProps}
          collectedStickers={[]}
        />,
      );
    }
  });

  test("component renders top row container", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    expect(document.querySelector("#sb-top-row")).toBeInTheDocument();
  });

  test("component renders board container", () => {
    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={[]}
      />,
    );

    expect(document.querySelector("#sb-board")).toBeInTheDocument();
  });

  test("component handles large sticker list", () => {
    const stickers = Array.from({ length: 50 }, (_, i) => `sticker${i}`);

    render(
      <StickerBookBoard
        svgRaw={null}
        isLocked={false}
        {...baseProps}
        collectedStickers={stickers}
      />,
    );
  });
});
