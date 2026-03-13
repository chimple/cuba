import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ParentalLock from "./ParentalLock";
import { PAGES } from "../../common/constants";
import { Util } from "../../utility/util";
import { schoolUtil } from "../../utility/schoolUtil";

const mockHistory = {
  replace: jest.fn(),
  push: jest.fn(),
  location: { pathname: "/display-students" },
};

jest.mock("react-router-dom", () => ({
  useHistory: () => mockHistory,
}));

jest.mock("i18next", () => ({
  t: (k: string) => k,
  changeLanguage: jest.fn(),
}));

jest.mock("../../utility/util", () => ({
  Util: {
    setParentLanguagetoLocal: jest.fn(),
    setPathToBackButton: jest.fn(),
    setCurrentStudent: jest.fn(),
  },
}));

jest.mock("../../utility/schoolUtil", () => ({
  schoolUtil: {
    setCurrentClass: jest.fn(),
  },
}));

const setup = (props?: Partial<React.ComponentProps<typeof ParentalLock>>) => {
  const baseProps: React.ComponentProps<typeof ParentalLock> = {
    showDialogBox: true,
    handleClose: jest.fn(),
    onHandleClose: jest.fn(),
    onUnlock: jest.fn(),
  };
  return render(<ParentalLock {...baseProps} {...props} />);
};

const runTouchSwipe = async (
  dialog: HTMLElement,
  start: { x: number; y: number },
  end: { x: number; y: number }
) => {
  fireEvent.touchStart(dialog, {
    targetTouches: [{ clientX: start.x, clientY: start.y }],
  });
  fireEvent.touchMove(dialog, {
    targetTouches: [{ clientX: end.x, clientY: end.y }],
  });
  fireEvent.touchEnd(dialog);
};

const runMouseSwipe = (
  dialog: HTMLElement,
  start: { x: number; y: number },
  end: { x: number; y: number }
) => {
  fireEvent.mouseDown(dialog, { clientX: start.x, clientY: start.y });
  fireEvent.mouseMove(dialog, { clientX: end.x, clientY: end.y });
  fireEvent.mouseUp(dialog);
};

describe("ParentalLock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Util.setParentLanguagetoLocal as jest.Mock).mockResolvedValue(undefined);
    (Math.random as any) = jest.fn(() => 0);
  });

  test("renders dialog when showDialogBox is true", async () => {
    setup({ showDialogBox: true });
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  test("does not render dialog when showDialogBox is false", () => {
    setup({ showDialogBox: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("renders parent section header", async () => {
    setup();
    expect(await screen.findByText("Parents Section")).toBeInTheDocument();
  });

  test("renders unlock instruction for LEFT when random chooses LEFT", async () => {
    (Math.random as any) = jest.fn(() => 0);
    setup();
    expect(await screen.findByText("Swipe LEFT to Unlock")).toBeInTheDocument();
  });

  test("renders unlock instruction for RIGHT when random chooses RIGHT", async () => {
    (Math.random as any) = jest.fn(() => 0.26);
    setup();
    expect(await screen.findByText("Swipe RIGHT to Unlock")).toBeInTheDocument();
  });

  test("renders unlock instruction for UP when random chooses UP", async () => {
    (Math.random as any) = jest.fn(() => 0.51);
    setup();
    expect(await screen.findByText("Swipe UP to Unlock")).toBeInTheDocument();
  });

  test("renders unlock instruction for DOWN when random chooses DOWN", async () => {
    (Math.random as any) = jest.fn(() => 0.76);
    setup();
    expect(await screen.findByText("Swipe DOWN to Unlock")).toBeInTheDocument();
  });

  test("close icon click calls onHandleClose", async () => {
    const onHandleClose = jest.fn();
    setup({ onHandleClose });
    const closeImg = await screen.findByAltText("Close");
    fireEvent.click(closeImg);
    expect(onHandleClose).toHaveBeenCalled();
  });

  test("correct LEFT touch swipe unlocks and executes navigation side effects", async () => {
    (Math.random as any) = jest.fn(() => 0);
    const onUnlock = jest.fn();
    setup({ onUnlock });
    const dialog = await screen.findByRole("dialog");

    await runTouchSwipe(dialog, { x: 300, y: 100 }, { x: 200, y: 100 });

    await waitFor(() => {
      expect(onUnlock).toHaveBeenCalledTimes(1);
      expect(Util.setParentLanguagetoLocal).toHaveBeenCalledTimes(1);
      expect(Util.setPathToBackButton).toHaveBeenCalledWith(PAGES.PARENT, mockHistory);
      expect(Util.setCurrentStudent).toHaveBeenCalledWith(null);
      expect(schoolUtil.setCurrentClass).toHaveBeenCalledWith(undefined);
    });
  });

  test("wrong touch swipe direction does not unlock", async () => {
    (Math.random as any) = jest.fn(() => 0);
    const onUnlock = jest.fn();
    setup({ onUnlock });
    const dialog = await screen.findByRole("dialog");

    await runTouchSwipe(dialog, { x: 100, y: 100 }, { x: 200, y: 100 });

    await waitFor(() => {
      expect(onUnlock).not.toHaveBeenCalled();
      expect(Util.setPathToBackButton).not.toHaveBeenCalled();
    });
  });

  test("touch swipe below minimum threshold does not unlock", async () => {
    (Math.random as any) = jest.fn(() => 0);
    const onUnlock = jest.fn();
    setup({ onUnlock });
    const dialog = await screen.findByRole("dialog");

    await runTouchSwipe(dialog, { x: 200, y: 100 }, { x: 170, y: 100 });

    expect(onUnlock).not.toHaveBeenCalled();
  });

  test("touch end without move does not unlock", async () => {
    (Math.random as any) = jest.fn(() => 0);
    const onUnlock = jest.fn();
    setup({ onUnlock });
    const dialog = await screen.findByRole("dialog");

    fireEvent.touchStart(dialog, {
      targetTouches: [{ clientX: 300, clientY: 100 }],
    });
    fireEvent.touchEnd(dialog);

    expect(onUnlock).not.toHaveBeenCalled();
  });

  test("correct RIGHT mouse swipe unlocks", async () => {
    (Math.random as any) = jest.fn(() => 0.26);
    const onUnlock = jest.fn();
    setup({ onUnlock });
    const dialog = await screen.findByRole("dialog");

    runMouseSwipe(dialog, { x: 100, y: 100 }, { x: 200, y: 100 });

    await waitFor(() => {
      expect(onUnlock).toHaveBeenCalledTimes(1);
      expect(Util.setPathToBackButton).toHaveBeenCalledWith(PAGES.PARENT, mockHistory);
    });
  });

  test("correct UP mouse swipe unlocks", async () => {
    (Math.random as any) = jest.fn(() => 0.51);
    const onUnlock = jest.fn();
    setup({ onUnlock });
    const dialog = await screen.findByRole("dialog");

    runMouseSwipe(dialog, { x: 100, y: 200 }, { x: 100, y: 100 });

    await waitFor(() => {
      expect(onUnlock).toHaveBeenCalledTimes(1);
    });
  });

  test("correct DOWN mouse swipe unlocks", async () => {
    (Math.random as any) = jest.fn(() => 0.76);
    const onUnlock = jest.fn();
    setup({ onUnlock });
    const dialog = await screen.findByRole("dialog");

    runMouseSwipe(dialog, { x: 100, y: 100 }, { x: 100, y: 200 });

    await waitFor(() => {
      expect(onUnlock).toHaveBeenCalledTimes(1);
    });
  });

  test("wrong mouse swipe direction does not unlock", async () => {
    (Math.random as any) = jest.fn(() => 0.76);
    const onUnlock = jest.fn();
    setup({ onUnlock });
    const dialog = await screen.findByRole("dialog");

    runMouseSwipe(dialog, { x: 300, y: 100 }, { x: 200, y: 100 });

    expect(onUnlock).not.toHaveBeenCalled();
  });

  test("mouse swipe below minimum threshold does not unlock", async () => {
    (Math.random as any) = jest.fn(() => 0.26);
    const onUnlock = jest.fn();
    setup({ onUnlock });
    const dialog = await screen.findByRole("dialog");

    runMouseSwipe(dialog, { x: 100, y: 100 }, { x: 130, y: 100 });

    expect(onUnlock).not.toHaveBeenCalled();
  });

  test("mouse up without mouse move does not unlock", async () => {
    const onUnlock = jest.fn();
    setup({ onUnlock });
    const dialog = await screen.findByRole("dialog");

    fireEvent.mouseDown(dialog, { clientX: 200, clientY: 100 });
    fireEvent.mouseUp(dialog);

    expect(onUnlock).not.toHaveBeenCalled();
  });

  test("mouse enter primes start point and swipe can still unlock", async () => {
    (Math.random as any) = jest.fn(() => 0.26);
    const onUnlock = jest.fn();
    setup({ onUnlock });
    const dialog = await screen.findByRole("dialog");

    fireEvent.mouseEnter(dialog, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(dialog, { clientX: 200, clientY: 100 });
    fireEvent.mouseUp(dialog);

    await waitFor(() => {
      expect(onUnlock).toHaveBeenCalledTimes(1);
    });
  });

  test("touch events with missing coordinates do not unlock", async () => {
    const onUnlock = jest.fn();
    setup({ onUnlock });
    const dialog = await screen.findByRole("dialog");

    fireEvent.touchStart(dialog, { targetTouches: [{}] });
    fireEvent.touchMove(dialog, { targetTouches: [{}] });
    fireEvent.touchEnd(dialog);

    expect(onUnlock).not.toHaveBeenCalled();
  });

  test("mouse move before mouse down does not unlock", async () => {
    const onUnlock = jest.fn();
    setup({ onUnlock });
    const dialog = await screen.findByRole("dialog");

    fireEvent.mouseMove(dialog, { clientX: 200, clientY: 100 });
    fireEvent.mouseUp(dialog);

    expect(onUnlock).not.toHaveBeenCalled();
  });

  test("unlock still executes side effects when onUnlock callback is not provided", async () => {
    (Math.random as any) = jest.fn(() => 0);
    setup({ onUnlock: undefined });
    const dialog = await screen.findByRole("dialog");

    await runTouchSwipe(dialog, { x: 300, y: 100 }, { x: 200, y: 100 });

    await waitFor(() => {
      expect(Util.setParentLanguagetoLocal).toHaveBeenCalled();
      expect(Util.setPathToBackButton).toHaveBeenCalledWith(PAGES.PARENT, mockHistory);
      expect(Util.setCurrentStudent).toHaveBeenCalledWith(null);
      expect(schoolUtil.setCurrentClass).toHaveBeenCalledWith(undefined);
    });
  });

  test("does not execute side effects when swipe direction is incorrect", async () => {
    (Math.random as any) = jest.fn(() => 0.26);
    setup();
    const dialog = await screen.findByRole("dialog");

    runMouseSwipe(dialog, { x: 300, y: 100 }, { x: 200, y: 100 });

    expect(Util.setParentLanguagetoLocal).not.toHaveBeenCalled();
    expect(Util.setPathToBackButton).not.toHaveBeenCalled();
    expect(Util.setCurrentStudent).not.toHaveBeenCalled();
    expect(schoolUtil.setCurrentClass).not.toHaveBeenCalled();
  });
});
