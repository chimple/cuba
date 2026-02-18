import React from "react";
import { act, render, screen } from "@testing-library/react";
import TressureBox from "./TressureBox";

describe("TressureBox", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    let rafTime = 0;
    jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        rafTime += 600;
        cb(rafTime);
        return 1;
      });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("renders static box when start and end are equal", () => {
    render(<TressureBox startNumber={5} endNumber={5} />);
    expect(screen.getByAltText("Treasure Box")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.queryByAltText("Confetti Treasure Box")).not.toBeInTheDocument();
  });

  test("animates increment and finishes at target number", () => {
    render(<TressureBox startNumber={1} endNumber={3} />);
    expect(screen.getByAltText("Confetti Treasure Box")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(screen.getByAltText("Treasure Box")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("animates decrement for reverse direction", () => {
    render(<TressureBox startNumber={4} endNumber={2} />);
    expect(screen.getByAltText("Confetti Treasure Box")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("handles negative range values", () => {
    render(<TressureBox startNumber={-2} endNumber={0} />);
    expect(screen.getByAltText("Confetti Treasure Box")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(6500);
    });
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  test("updates current number when startNumber prop changes", () => {
    const { rerender } = render(<TressureBox startNumber={7} endNumber={7} />);
    expect(screen.getByText("7")).toBeInTheDocument();
    rerender(<TressureBox startNumber={11} endNumber={11} />);
    expect(screen.getByText("11")).toBeInTheDocument();
  });

  test("cleans interval on unmount", () => {
    const clearSpy = jest.spyOn(window, "clearInterval");
    const { unmount } = render(<TressureBox startNumber={1} endNumber={4} />);
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  test("shows scroll container while updating", () => {
    const { container } = render(<TressureBox startNumber={2} endNumber={4} />);
    expect(container.querySelector(".scroll-container")).toBeInTheDocument();
  });

  test("hides scroll container after animation completion", () => {
    const { container } = render(<TressureBox startNumber={2} endNumber={4} />);
    act(() => {
      jest.advanceTimersByTime(7000);
    });
    expect(container.querySelector(".scroll-container")).not.toBeInTheDocument();
    expect(container.querySelector(".number-inside-box")).toHaveTextContent("4");
  });

  test("renders fixed treasure svg once animation ends", () => {
    render(<TressureBox startNumber={8} endNumber={10} />);
    act(() => {
      jest.advanceTimersByTime(7000);
    });
    expect(screen.getByAltText("Treasure Box")).toBeInTheDocument();
    expect(screen.queryByAltText("Confetti Treasure Box")).not.toBeInTheDocument();
  });

  test("keeps confetti visible during active update", () => {
    render(<TressureBox startNumber={5} endNumber={7} />);
    act(() => {
      jest.advanceTimersByTime(2500);
    });
    expect(screen.getByAltText("Confetti Treasure Box")).toBeInTheDocument();
  });

  test("handles zero to zero without running update state", () => {
    const { container } = render(<TressureBox startNumber={0} endNumber={0} />);
    expect(container.querySelector(".scroll-container")).not.toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  test.each([
    { start: 1, end: 3, expected: "3" },
    { start: 2, end: 6, expected: "6" },
    { start: 10, end: 7, expected: "7" },
    { start: -3, end: -1, expected: "-1" },
    { start: -1, end: -5, expected: "-5" },
  ])(
    "reaches final value from $start to $end",
    ({ start, end, expected }) => {
      render(<TressureBox startNumber={start} endNumber={end} />);
      act(() => {
        jest.advanceTimersByTime(13000);
      });
      expect(screen.getByText(expected)).toBeInTheDocument();
    }
  );

  test("supports large ranges and still ends at target", () => {
    render(<TressureBox startNumber={1} endNumber={6} />);
    act(() => {
      jest.advanceTimersByTime(20000);
    });
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  test("rerendering to a new animated range restarts update UI", () => {
    const { rerender, container } = render(<TressureBox startNumber={1} endNumber={1} />);
    expect(container.querySelector(".scroll-container")).not.toBeInTheDocument();
    rerender(<TressureBox startNumber={1} endNumber={3} />);
    expect(container.querySelector(".scroll-container")).toBeInTheDocument();
  });

  test("does not throw when unmounted mid-animation", () => {
    const { unmount } = render(<TressureBox startNumber={1} endNumber={5} />);
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(() => unmount()).not.toThrow();
  });

  test("highlights a current number item during update", () => {
    const { container } = render(<TressureBox startNumber={1} endNumber={3} />);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(container.querySelector(".scroll-item.highlight")).toBeInTheDocument();
  });

  test("renders only one static number after completion", () => {
    const { container } = render(<TressureBox startNumber={3} endNumber={5} />);
    act(() => {
      jest.advanceTimersByTime(7000);
    });
    expect(container.querySelectorAll(".number-inside-box")).toHaveLength(1);
  });

  test("renders treasure wrapper container structure", () => {
    const { container } = render(<TressureBox startNumber={2} endNumber={2} />);
    expect(container.querySelector(".treasure-box-container")).toBeInTheDocument();
    expect(container.querySelector(".treasure-box-wrapper")).toBeInTheDocument();
  });

  test("shows numeric destination after decrementing long range", () => {
    render(<TressureBox startNumber={12} endNumber={8} />);
    act(() => {
      jest.advanceTimersByTime(20000);
    });
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  test("confetti image is hidden once update finalizes", () => {
    render(<TressureBox startNumber={1} endNumber={3} />);
    act(() => {
      jest.advanceTimersByTime(7000);
    });
    expect(screen.queryByAltText("Confetti Treasure Box")).not.toBeInTheDocument();
  });
});
