import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import StickerBookPreviewModal, {
  StickerBookPreviewData,
} from "./StickerBookPreviewModal";

const originalFetch = global.fetch;

const buildData = (override: Partial<StickerBookPreviewData> = {}): StickerBookPreviewData => ({
  source: "learning_pathway",
  stickerBookId: "book-1",
  stickerBookTitle: "Book 1",
  stickerBookSvgUrl: "https://example.com/sticker-book.svg",
  collectedStickerIds: ["slot-collected"],
  nextStickerId: "slot-next",
  nextStickerName: "Rocket",
  nextStickerImage: "https://example.com/rocket.png",
  ...override,
});

const svgWithSlots = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g data-slot-id="slot-collected">
    <rect x="0" y="0" width="10" height="10" fill="#111111" stroke="#222222" fill-opacity="0.3" stroke-opacity="0.3" />
  </g>
  <g data-slot-id="slot-next">
    <circle cx="20" cy="20" r="6" fill="#333333" stroke="#444444" />
  </g>
  <g data-slot-id="slot-locked">
    <rect x="35" y="10" width="12" height="12" fill="#555555" stroke="#666666" />
  </g>
</svg>
`;

const svgWithNoneFillStroke = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <g data-slot-id="slot-next">
    <rect x="10" y="10" width="30" height="30" fill="none" stroke="none" />
  </g>
</svg>
`;

const svgWithoutSlots = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="5" y="5" width="90" height="90" fill="#ececec" />
</svg>
`;

describe("StickerBookPreviewModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("renders loading state and then sticker book SVG", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    render(<StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />);

    expect(screen.getByTestId("StickerBookPreviewModal-loading")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId("StickerBookPreviewModal-book")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("StickerBookPreviewModal-loading")).not.toBeInTheDocument();
  });

  test("applies collected/next/locked styles to sticker slots", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    const { container } = render(
      <StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("StickerBookPreviewModal-book")).toBeInTheDocument(),
    );

    const collected = container.querySelector(
      '[data-slot-id="slot-collected"] rect',
    ) as SVGRectElement;
    const next = container.querySelector('[data-slot-id="slot-next"] circle') as SVGCircleElement;
    const locked = container.querySelector(
      '[data-slot-id="slot-locked"] rect',
    ) as SVGRectElement;

    expect(collected.getAttribute("fill-opacity")).toBeNull();
    expect(collected.getAttribute("stroke-opacity")).toBeNull();
    expect(next.getAttribute("fill")).toBe("#B8B8B8");
    expect(next.getAttribute("stroke")).toBe("#B8B8B8");
    expect(locked.getAttribute("fill")).toBe("#FFFFFF");
    expect(locked.getAttribute("stroke")).toBe("#FFFFFF");
  });

  test("closes with close_button when close icon is clicked", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
    const onClose = jest.fn();

    render(<StickerBookPreviewModal data={buildData()} onClose={onClose} />);
    await waitFor(() =>
      expect(screen.getByTestId("StickerBookPreviewModal-book")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId("StickerBookPreviewModal-close"));

    expect(onClose).toHaveBeenCalledWith("close_button");
  });

  test("closes with backdrop when overlay is clicked", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
    const onClose = jest.fn();

    render(<StickerBookPreviewModal data={buildData()} onClose={onClose} />);
    await waitFor(() =>
      expect(screen.getByTestId("StickerBookPreviewModal-book")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId("StickerBookPreviewModal-overlay"));

    expect(onClose).toHaveBeenCalledWith("backdrop");
  });

  test("falls back to local layout when sticker book fetch fails", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("network failed"))
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<svg><g data-slot-id='fallback-slot'><rect /></g></svg>",
      } as Response);

    render(<StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />);

    await waitFor(() =>
      expect(screen.getByTestId("StickerBookPreviewModal-book")).toBeInTheDocument(),
    );
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(2);
    warnSpy.mockRestore();
  });

  test("calls fetch with provided stickerBookSvgUrl", async () => {
    const data = buildData({ stickerBookSvgUrl: "https://example.com/custom-book.svg" });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    render(<StickerBookPreviewModal data={data} onClose={jest.fn()} />);

    await waitFor(() =>
      expect(screen.getByTestId("StickerBookPreviewModal-book")).toBeInTheDocument(),
    );
    expect(global.fetch).toHaveBeenCalledWith("https://example.com/custom-book.svg");
  });

  test("falls back when primary fetch returns ok=false", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<svg><g data-slot-id='fallback-a'><rect /></g></svg>",
      } as Response);

    render(<StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />);

    await waitFor(() =>
      expect(screen.getByTestId("StickerBookPreviewModal-book")).toBeInTheDocument(),
    );
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(2);
    warnSpy.mockRestore();
  });

  test("renders provided nextStickerImage with alt text", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    render(
      <StickerBookPreviewModal
        data={buildData({ nextStickerName: "Super Rocket", nextStickerImage: "https://cdn.test/super.png" })}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("StickerBookPreviewModal-book")).toBeInTheDocument(),
    );
    const image = screen.getByTestId("StickerBookPreviewModal-next-image") as HTMLImageElement;
    expect(image.alt).toBe("Super Rocket");
    expect(image.src).toContain("https://cdn.test/super.png");
  });

  test("uses default icon when nextStickerImage is missing", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    render(
      <StickerBookPreviewModal
        data={buildData({ nextStickerImage: undefined })}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("StickerBookPreviewModal-book")).toBeInTheDocument(),
    );
    const image = screen.getByTestId("StickerBookPreviewModal-next-image") as HTMLImageElement;
    expect(image.src).toContain("assets/icons/DefaultIcon.png");
  });

  test("exposes expected base test IDs for key modal sections", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    render(<StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />);

    expect(screen.getByTestId("StickerBookPreviewModal-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("StickerBookPreviewModal-modal")).toBeInTheDocument();
    expect(screen.getByTestId("StickerBookPreviewModal-close")).toBeInTheDocument();
    expect(screen.getByTestId("StickerBookPreviewModal-book-frame")).toBeInTheDocument();
    expect(screen.getByTestId("StickerBookPreviewModal-bottom-strip")).toBeInTheDocument();
    expect(screen.getByTestId("StickerBookPreviewModal-helper-text")).toBeInTheDocument();
    expect(screen.getByTestId("StickerBookPreviewModal-next-name")).toBeInTheDocument();
  });

  test("clicking inside modal body does not trigger backdrop close", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
    const onClose = jest.fn();

    render(<StickerBookPreviewModal data={buildData()} onClose={onClose} />);
    await waitFor(() =>
      expect(screen.getByTestId("StickerBookPreviewModal-book")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("StickerBookPreviewModal-modal"));
    expect(onClose).not.toHaveBeenCalled();
  });

  test("renders accessibility attributes for dialog and close button", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    render(<StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />);
    await waitFor(() =>
      expect(screen.getByTestId("StickerBookPreviewModal-book")).toBeInTheDocument(),
    );

    const overlay = screen.getByTestId("StickerBookPreviewModal-overlay");
    const modal = screen.getByTestId("StickerBookPreviewModal-modal");
    const closeButton = screen.getByTestId("StickerBookPreviewModal-close");

    expect(overlay).toHaveAttribute("role", "presentation");
    expect(modal).toHaveAttribute("role", "dialog");
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(closeButton).toHaveAttribute("aria-label", "close-sticker-book-preview");
  });

  test("forces loaded svg sizing and preserveAspectRatio attributes", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
    const { container } = render(
      <StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("StickerBookPreviewModal-book")).toBeInTheDocument(),
    );

    const svg = container.querySelector(".StickerBookPreviewModal-book svg") as SVGElement;
    expect(svg).toBeTruthy();
    expect(svg.getAttribute("width")).toBe("100%");
    expect(svg.getAttribute("height")).toBe("100%");
    expect(svg.getAttribute("preserveAspectRatio")).toBe("xMidYMid meet");
  });

  test("sets slot container opacity to 1 for all slot states", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
    const { container } = render(
      <StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("StickerBookPreviewModal-book")).toBeInTheDocument(),
    );

    const collectedSlot = container.querySelector('[data-slot-id="slot-collected"]') as HTMLElement;
    const nextSlot = container.querySelector('[data-slot-id="slot-next"]') as HTMLElement;
    const lockedSlot = container.querySelector('[data-slot-id="slot-locked"]') as HTMLElement;

    expect(collectedSlot.style.opacity).toBe("1");
    expect(nextSlot.style.opacity).toBe("1");
    expect(lockedSlot.style.opacity).toBe("1");
  });

  test("does not overwrite fill/stroke when original shape uses none", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithNoneFillStroke,
    } as Response);
    const { container } = render(
      <StickerBookPreviewModal
        data={buildData({ nextStickerId: "slot-next", collectedStickerIds: [] })}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("StickerBookPreviewModal-book")).toBeInTheDocument(),
    );

    const shape = container.querySelector('[data-slot-id="slot-next"] rect') as SVGRectElement;
    expect(shape.getAttribute("fill")).toBe("none");
    expect(shape.getAttribute("stroke")).toBe("none");
    expect(shape.getAttribute("fill-opacity")).toBe("1");
    expect(shape.getAttribute("stroke-opacity")).toBe("1");
  });

  test("renders normally when SVG has no data-slot-id elements", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithoutSlots,
    } as Response);

    render(<StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />);

    await waitFor(() =>
      expect(screen.getByTestId("StickerBookPreviewModal-book")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("StickerBookPreviewModal-loading")).not.toBeInTheDocument();
  });

  test("re-fetches and re-renders when stickerBookSvgUrl changes", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          "<svg><g data-slot-id='slot-a'><rect fill='#111111' stroke='#111111' /></g></svg>",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          "<svg><g data-slot-id='slot-b'><rect fill='#222222' stroke='#222222' /></g></svg>",
      } as Response);

    const { rerender, container } = render(
      <StickerBookPreviewModal
        data={buildData({ stickerBookSvgUrl: "https://example.com/book-a.svg" })}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(container.querySelector('[data-slot-id="slot-a"]')).toBeInTheDocument(),
    );

    rerender(
      <StickerBookPreviewModal
        data={buildData({ stickerBookSvgUrl: "https://example.com/book-b.svg" })}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(container.querySelector('[data-slot-id="slot-b"]')).toBeInTheDocument(),
    );
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe("https://example.com/book-a.svg");
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toBe("https://example.com/book-b.svg");
  });

  test("updates slot styling when collectedStickerIds changes on rerender", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
    const { rerender, container } = render(
      <StickerBookPreviewModal
        data={buildData({ collectedStickerIds: [], nextStickerId: "slot-next" })}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(container.querySelector('[data-slot-id="slot-collected"] rect')).toBeInTheDocument(),
    );

    let target = container.querySelector('[data-slot-id="slot-collected"] rect') as SVGRectElement;
    expect(target.getAttribute("fill")).toBe("#FFFFFF");

    rerender(
      <StickerBookPreviewModal
        data={buildData({
          collectedStickerIds: ["slot-collected"],
          nextStickerId: "slot-next",
        })}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      const updated = container.querySelector(
        '[data-slot-id="slot-collected"] rect',
      ) as SVGRectElement;
      expect(updated.getAttribute("fill-opacity")).toBeNull();
      expect(updated.getAttribute("stroke-opacity")).toBeNull();
    });
  });

  test("treats all uncollected slots as locked when nextStickerId is not present in SVG", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
    const { container } = render(
      <StickerBookPreviewModal
        data={buildData({
          collectedStickerIds: [],
          nextStickerId: "slot-not-present",
        })}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(container.querySelector('[data-slot-id="slot-next"] circle')).toBeInTheDocument(),
    );

    const nextSlotShape = container.querySelector('[data-slot-id="slot-next"] circle') as SVGCircleElement;
    const lockedSlotShape = container.querySelector('[data-slot-id="slot-locked"] rect') as SVGRectElement;
    expect(nextSlotShape.getAttribute("fill")).toBe("#FFFFFF");
    expect(nextSlotShape.getAttribute("stroke")).toBe("#FFFFFF");
    expect(lockedSlotShape.getAttribute("fill")).toBe("#FFFFFF");
    expect(lockedSlotShape.getAttribute("stroke")).toBe("#FFFFFF");
  });

  test("does not crash if component unmounts before fetch resolves", async () => {
    let resolveFetch: ((value: Response) => void) | null = null;
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const { unmount } = render(
      <StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />,
    );
    unmount();

    if (resolveFetch) {
      await act(async () => {
        resolveFetch?.({
          ok: true,
          text: async () => svgWithSlots,
        } as Response);
        await Promise.resolve();
      });
    }

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
