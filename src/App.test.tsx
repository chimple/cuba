import { render, act } from "@testing-library/react";
import App from "./App";

describe("App Component", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("renders without crashing", () => {
    let unmount: () => void;

    act(() => {
      const result = render(<App />);
      unmount = result.unmount;
    });

    // Just ensure it mounted successfully
    expect(document.body).toBeTruthy();

    act(() => {
      unmount();
    });
  });
});
