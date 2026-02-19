import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import LiveQuizRoomResult from "./LiveQuizRoomResult";
import { ServiceConfig } from "../services/ServiceConfig";
import { PAGES } from "../common/constants";

const mockReplace = jest.fn();
const mockNextButtonSpy = jest.fn();
const mockAvatarSpy = jest.fn();

jest.mock("@ionic/react", () => ({
  IonPage: (props: any) => <div>{props.children}</div>,
}));

jest.mock("react-router", () => ({
  useHistory: () => ({ replace: mockReplace }),
}));

jest.mock("react-confetti", () => () => <div data-testid="confetti" />);

jest.mock("../components/common/NextButton", () => (props: any) => {
  mockNextButtonSpy(props);
  return <button onClick={() => props.onClicked?.()}>next</button>;
});

jest.mock("../components/common/StudentAvatar", () => (props: any) => {
  mockAvatarSpy(props);
  return (
    <div data-testid={`avatar-${props.student.id}`}>
      {props.student.name}
      {props.nameLabel ? `-${props.nameLabel}` : ""}
    </div>
  );
});

jest.mock("i18next", () => ({
  t: (s: string) => s,
}));

const mockApi = {
  getLiveQuizRoomDoc: jest.fn(),
  getStudentResultsByAssignmentId: jest.fn(),
};

describe("LiveQuizRoomResult page", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockAvatarSpy.mockReset();
    mockNextButtonSpy.mockReset();
    window.history.replaceState({}, "", "/?liveRoomId=room-1");
    jest.spyOn(ServiceConfig, "getI").mockReturnValue({ apiHandler: mockApi } as any);

    mockApi.getLiveQuizRoomDoc.mockResolvedValue({
      assignment_id: "a-1",
      class_id: "class-1",
      results: {
        s1: [
          { score: 10, timeSpent: 8 },
          { score: 6, timeSpent: 3 },
        ],
        s2: [{ score: 12, timeSpent: 7 }],
        s3: [{ score: 7, timeSpent: 2 }],
        s4: [{ score: 2, timeSpent: 1 }],
      },
    });
    mockApi.getStudentResultsByAssignmentId.mockResolvedValue([
      {
        user_data: [
          { id: "s1", name: "One" },
          { id: "s2", name: "Two" },
          { id: "s3", name: "Three" },
          { id: "s4", name: "Four" },
        ],
      },
    ]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("fetches room doc with URL liveRoomId", async () => {
    render(<LiveQuizRoomResult />);
    await waitFor(() => {
      expect(mockApi.getLiveQuizRoomDoc).toHaveBeenCalledWith("room-1");
    });
  });

  test("loads assignment participants by assignment id", async () => {
    render(<LiveQuizRoomResult />);
    await waitFor(() => {
      expect(mockApi.getStudentResultsByAssignmentId).toHaveBeenCalledWith("a-1");
    });
  });

  test("renders next button and navigates leaderboard on click", async () => {
    render(<LiveQuizRoomResult />);
    fireEvent.click(await screen.findByText("next"));
    expect(mockReplace).toHaveBeenCalledWith(
      PAGES.LIVE_QUIZ_LEADERBOARD + "?liveRoomId=room-1"
    );
  });

  test("shows confetti and congratulations initially", async () => {
    render(<LiveQuizRoomResult />);
    expect(await screen.findByTestId("confetti")).toBeInTheDocument();
    expect(screen.getByText("Congratulations!")).toBeInTheDocument();
  });

  test("hides confetti after 5 seconds", async () => {
    render(<LiveQuizRoomResult />);
    await screen.findByTestId("confetti");
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    await waitFor(() => {
      expect(screen.queryByTestId("confetti")).not.toBeInTheDocument();
    });
  });

  test("keeps congratulations text visible before timeout", async () => {
    render(<LiveQuizRoomResult />);
    await screen.findByText("Congratulations!");
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.getByText("Congratulations!")).toBeInTheDocument();
  });

  test("renders top performer as first podium avatar", async () => {
    render(<LiveQuizRoomResult />);
    await waitFor(() => {
      expect(screen.getAllByTestId("avatar-s1").length).toBeGreaterThan(0);
    });
    // s1 has total 16, s2 has 12, s3 has 7 => s1 first
    const firstCall = mockAvatarSpy.mock.calls.find((c) => c[0].nameLabel === "1st");
    expect(firstCall?.[0]?.student?.id).toBe("s1");
  });

  test("renders second and third podium labels", async () => {
    render(<LiveQuizRoomResult />);
    await waitFor(() => {
      expect(mockAvatarSpy.mock.calls.some((c) => c[0].nameLabel === "2nd")).toBe(true);
      expect(mockAvatarSpy.mock.calls.some((c) => c[0].nameLabel === "3rd")).toBe(true);
    });
  });

  test("calculates and sorts all student scores descending", async () => {
    render(<LiveQuizRoomResult />);
    await waitFor(() => {
      const nodes = screen.getAllByTestId(/avatar-/);
      expect(nodes.length).toBeGreaterThan(2);
    });
    const all = mockAvatarSpy.mock.calls
      .filter((c) => c[0].namePosition === "above")
      .map((c) => c[0].student.id);
    expect(all[0]).toBe("s1");
    expect(all[1]).toBe("s2");
  });

  test("renders rounded score values", async () => {
    mockApi.getLiveQuizRoomDoc.mockResolvedValue({
      assignment_id: "a-1",
      class_id: "class-1",
      results: {
        s1: [{ score: 9.6, timeSpent: 3 }],
      },
    });
    mockApi.getStudentResultsByAssignmentId.mockResolvedValue([
      {
        user_data: [{ id: "s1", name: "One" }],
      },
    ]);
    const { container } = render(<LiveQuizRoomResult />);
    await waitFor(() => {
      expect(container.querySelector(".student-score")).toHaveTextContent("10");
    });
  });

  test("breaks ties by lower total time spent", async () => {
    mockApi.getLiveQuizRoomDoc.mockResolvedValue({
      assignment_id: "a-1",
      class_id: "class-1",
      results: {
        s1: [{ score: 10, timeSpent: 10 }],
        s2: [{ score: 10, timeSpent: 3 }],
      },
    });
    mockApi.getStudentResultsByAssignmentId.mockResolvedValue([
      {
        user_data: [
          { id: "s1", name: "One" },
          { id: "s2", name: "Two" },
        ],
      },
    ]);
    render(<LiveQuizRoomResult />);
    await waitFor(() => {
      const firstPodium = mockAvatarSpy.mock.calls.find((c) => c[0].nameLabel === "1st");
      expect(firstPodium?.[0].student.id).toBe("s2");
    });
  });

  test("does not crash with fewer than 3 students", async () => {
    mockApi.getLiveQuizRoomDoc.mockResolvedValue({
      assignment_id: "a-1",
      class_id: "class-1",
      results: {
        s1: [{ score: 2, timeSpent: 1 }],
      },
    });
    mockApi.getStudentResultsByAssignmentId.mockResolvedValue([
      { user_data: [{ id: "s1", name: "One" }] },
    ]);
    render(<LiveQuizRoomResult />);
    await waitFor(() => {
      expect(screen.getAllByTestId("avatar-s1").length).toBeGreaterThan(0);
    });
  });

  test("renders score list rows for all sorted students", async () => {
    const { container } = render(<LiveQuizRoomResult />);
    await waitFor(() => {
      expect(container.querySelectorAll(".student-info").length).toBe(4);
    });
  });

  test("handles missing class_id by skipping assignment user map fetch", async () => {
    mockApi.getLiveQuizRoomDoc.mockResolvedValue({
      assignment_id: "a-1",
      class_id: undefined,
      results: {},
    });
    render(<LiveQuizRoomResult />);
    await waitFor(() => {
      expect(mockApi.getStudentResultsByAssignmentId).not.toHaveBeenCalled();
    });
  });

  test("handles missing room results gracefully", async () => {
    mockApi.getLiveQuizRoomDoc.mockResolvedValue({
      assignment_id: "a-1",
      class_id: "class-1",
      results: null,
    });
    render(<LiveQuizRoomResult />);
    await waitFor(() => {
      expect(screen.getByText("next")).toBeInTheDocument();
    });
  });

  test("supports URL without liveRoomId", async () => {
    window.history.replaceState({}, "", "/");
    render(<LiveQuizRoomResult />);
    await waitFor(() => {
      expect(mockApi.getLiveQuizRoomDoc).toHaveBeenCalledWith("");
    });
  });

  test("logs errors and keeps page stable when init fails", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockApi.getLiveQuizRoomDoc.mockRejectedValue(new Error("failed"));
    render(<LiveQuizRoomResult />);
    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
      expect(screen.getByText("next")).toBeInTheDocument();
    });
    spy.mockRestore();
  });

  test("passes disabled false to next button", async () => {
    render(<LiveQuizRoomResult />);
    await waitFor(() => {
      const props = mockNextButtonSpy.mock.calls[mockNextButtonSpy.mock.calls.length - 1][0];
      expect(props.disabled).toBe(false);
    });
  });

  test("shows crown icon container for first performer section", async () => {
    const { container } = render(<LiveQuizRoomResult />);
    await waitFor(() => {
      expect(container.querySelector(".crown-container")).toBeInTheDocument();
    });
  });

  test("renders ordinal labels through helper function for podium", async () => {
    render(<LiveQuizRoomResult />);
    await waitFor(() => {
      expect(mockAvatarSpy.mock.calls.some((c) => c[0].nameLabel === "2nd")).toBe(true);
      expect(mockAvatarSpy.mock.calls.some((c) => c[0].nameLabel === "3rd")).toBe(true);
    });
  });
});
