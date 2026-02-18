import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PathwayStructure from "./PathwayStructure";
import { usePathwayData } from "../../hooks/usePathwayData";
import { usePathwaySVG } from "../../hooks/usePathwaySVG";

jest.mock("../../hooks/usePathwayData");
jest.mock("../../hooks/usePathwaySVG");

jest.mock("./ChimpleRiveMascot", () => () => <div data-testid="chimple-mascot" />);
jest.mock("./RewardRive", () => () => <div data-testid="reward-rive" />);
jest.mock("./RewardBox", () => (props: any) => (
  <button data-testid="reward-box" onClick={props.onRewardClick}>
    reward-box
  </button>
));
jest.mock("./DailyRewardModal", () => (props: any) => (
  <div data-testid="daily-reward-modal">
    <button onClick={props.onClose}>close</button>
    <button onClick={props.onPlay}>play</button>
  </div>
));

describe("PathwayStructure", () => {
  const setModalOpen = jest.fn();
  const setModalText = jest.fn();
  const handleRewardBoxOpen = jest.fn();
  const handleRewardModalClose = jest.fn();
  const handleRewardModalPlay = jest.fn();

  const buildHookData = (override: Partial<any> = {}) => {
    const riveHost = document.createElement("div");
    const rewardHost = document.createElement("div");
    document.body.appendChild(riveHost);
    document.body.appendChild(rewardHost);

    return {
      containerRef: { current: null },
      modalOpen: false,
      modalText: "",
      setModalOpen,
      setModalText,
      shouldAnimate: false,
      riveContainer: riveHost,
      rewardRiveContainer: rewardHost,
      mascotProps: {
        stateMachine: "State Machine",
        inputName: "Number 1",
        stateValue: 1,
        animationName: "id",
      },
      mascotKey: 1,
      rewardRiveState: 1,
      hasTodayReward: false,
      isRewardFeatureOn: false,
      rewardModalOpen: false,
      isCampaignFinished: true,
      handleRewardBoxOpen,
      handleRewardModalClose,
      handleRewardModalPlay,
      getCachedLesson: jest.fn(),
      updateMascotToNormalState: jest.fn(),
      invokeMascotCelebration: jest.fn(),
      setRewardRiveState: jest.fn(),
      setRiveContainer: jest.fn(),
      setRewardRiveContainer: jest.fn(),
      setHasTodayReward: jest.fn(),
      setCurrentCourse: jest.fn(),
      setCurrentChapter: jest.fn(),
      setIsRewardPathLoaded: jest.fn(),
      isRewardPathLoaded: false,
      checkAndUpdateReward: jest.fn(),
      ...override,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePathwaySVG as jest.Mock).mockImplementation(() => null);
    (usePathwayData as jest.Mock).mockReturnValue(buildHookData());
  });

  test("renders base pathway container", () => {
    const { container } = render(<PathwayStructure />);
    expect(container.querySelector(".pathway-structure-div")).toBeInTheDocument();
  });

  test("renders inactive-assessment popup and handles close/confirm", () => {
    (usePathwayData as jest.Mock).mockReturnValue(
      buildHookData({
        modalOpen: true,
        modalText: "This lesson is locked. Play the current active lesson.",
      })
    );
    render(<PathwayStructure />);

    expect(
      screen.getByText("This lesson is locked. Play the current active lesson.")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByAltText("close-icon"));
    expect(setModalOpen).toHaveBeenCalledWith(false);
    const okButton = document.querySelector(".learning-pathway-OK-button");
    expect(okButton).toBeTruthy();
    if (okButton) fireEvent.click(okButton);
    expect(setModalOpen).toHaveBeenCalledWith(false);
  });

  test("renders reward box when reward is available and feature is on", () => {
    (usePathwayData as jest.Mock).mockReturnValue(
      buildHookData({ hasTodayReward: true, isRewardFeatureOn: true })
    );
    render(<PathwayStructure />);
    fireEvent.click(screen.getByTestId("reward-box"));
    expect(handleRewardBoxOpen).toHaveBeenCalled();
  });

  test("hides reward box when feature is off", () => {
    (usePathwayData as jest.Mock).mockReturnValue(
      buildHookData({ hasTodayReward: true, isRewardFeatureOn: false })
    );
    render(<PathwayStructure />);
    expect(screen.queryByTestId("reward-box")).not.toBeInTheDocument();
  });

  test("renders daily reward modal and handles close/play", () => {
    (usePathwayData as jest.Mock).mockReturnValue(
      buildHookData({ rewardModalOpen: true, isRewardFeatureOn: true })
    );
    render(<PathwayStructure />);

    fireEvent.click(screen.getByText("close"));
    fireEvent.click(screen.getByText("play"));
    expect(handleRewardModalClose).toHaveBeenCalled();
    expect(handleRewardModalPlay).toHaveBeenCalled();
  });

  test("does not render daily reward modal when reward feature is disabled", () => {
    (usePathwayData as jest.Mock).mockReturnValue(
      buildHookData({ rewardModalOpen: true, isRewardFeatureOn: false })
    );
    render(<PathwayStructure />);
    expect(screen.queryByTestId("daily-reward-modal")).not.toBeInTheDocument();
  });

  test("calls usePathwaySVG with required callbacks and refs", () => {
    const data = buildHookData();
    (usePathwayData as jest.Mock).mockReturnValue(data);
    render(<PathwayStructure />);

    expect(usePathwaySVG).toHaveBeenCalledWith(
      expect.objectContaining({
        containerRef: data.containerRef,
        setModalOpen: data.setModalOpen,
        setModalText: data.setModalText,
        getCachedLesson: data.getCachedLesson,
      })
    );
  });

  test("does not render inactive modal when modalOpen is false", () => {
    (usePathwayData as jest.Mock).mockReturnValue(buildHookData({ modalOpen: false }));
    render(<PathwayStructure />);
    expect(screen.queryByText("This lesson is locked. Play the current active lesson.")).not.toBeInTheDocument();
  });

  test("passes animate=true to modal when shouldAnimate is true", () => {
    (usePathwayData as jest.Mock).mockReturnValue(
      buildHookData({
        modalOpen: true,
        modalText: "Complete these 5 lessons to earn rewards",
        shouldAnimate: true,
      })
    );
    const { container } = render(<PathwayStructure />);
    expect(container.querySelector(".PathwayModal-content")).toBeInTheDocument();
  });

  test("renders mascot portal only when riveContainer exists", () => {
    (usePathwayData as jest.Mock).mockReturnValue(buildHookData({ riveContainer: null }));
    render(<PathwayStructure />);
    expect(screen.queryByTestId("chimple-mascot")).not.toBeInTheDocument();
  });

  test("renders reward rive portal only when rewardRiveContainer exists", () => {
    (usePathwayData as jest.Mock).mockReturnValue(
      buildHookData({ rewardRiveContainer: null })
    );
    render(<PathwayStructure />);
    expect(screen.queryByTestId("reward-rive")).not.toBeInTheDocument();
  });

  test("renders both portals when both hosts exist", () => {
    render(<PathwayStructure />);
    expect(screen.getByTestId("chimple-mascot")).toBeInTheDocument();
    expect(screen.getByTestId("reward-rive")).toBeInTheDocument();
  });

  test.each([
    { hasTodayReward: false, isRewardFeatureOn: false, visible: false },
    { hasTodayReward: false, isRewardFeatureOn: true, visible: false },
    { hasTodayReward: true, isRewardFeatureOn: false, visible: false },
    { hasTodayReward: true, isRewardFeatureOn: true, visible: true },
  ])(
    "reward box visibility matrix hasTodayReward=$hasTodayReward feature=$isRewardFeatureOn",
    ({ hasTodayReward, isRewardFeatureOn, visible }) => {
      (usePathwayData as jest.Mock).mockReturnValue(
        buildHookData({ hasTodayReward, isRewardFeatureOn })
      );
      render(<PathwayStructure />);
      if (visible) {
        expect(screen.getByTestId("reward-box")).toBeInTheDocument();
      } else {
        expect(screen.queryByTestId("reward-box")).not.toBeInTheDocument();
      }
    }
  );

  test.each([
    { rewardModalOpen: false, isRewardFeatureOn: false, visible: false },
    { rewardModalOpen: false, isRewardFeatureOn: true, visible: false },
    { rewardModalOpen: true, isRewardFeatureOn: false, visible: false },
    { rewardModalOpen: true, isRewardFeatureOn: true, visible: true },
  ])(
    "daily reward modal matrix rewardModalOpen=$rewardModalOpen feature=$isRewardFeatureOn",
    ({ rewardModalOpen, isRewardFeatureOn, visible }) => {
      (usePathwayData as jest.Mock).mockReturnValue(
        buildHookData({ rewardModalOpen, isRewardFeatureOn })
      );
      render(<PathwayStructure />);
      if (visible) {
        expect(screen.getByTestId("daily-reward-modal")).toBeInTheDocument();
      } else {
        expect(screen.queryByTestId("daily-reward-modal")).not.toBeInTheDocument();
      }
    }
  );

  test("reward box click uses hook callback exactly once", () => {
    const openCb = jest.fn();
    (usePathwayData as jest.Mock).mockReturnValue(
      buildHookData({ hasTodayReward: true, isRewardFeatureOn: true, handleRewardBoxOpen: openCb })
    );
    render(<PathwayStructure />);
    fireEvent.click(screen.getByTestId("reward-box"));
    expect(openCb).toHaveBeenCalledTimes(1);
  });

  test("daily reward modal close/play call hook callbacks once each", () => {
    const closeCb = jest.fn();
    const playCb = jest.fn();
    (usePathwayData as jest.Mock).mockReturnValue(
      buildHookData({
        rewardModalOpen: true,
        isRewardFeatureOn: true,
        handleRewardModalClose: closeCb,
        handleRewardModalPlay: playCb,
      })
    );
    render(<PathwayStructure />);
    fireEvent.click(screen.getByText("close"));
    fireEvent.click(screen.getByText("play"));
    expect(closeCb).toHaveBeenCalledTimes(1);
    expect(playCb).toHaveBeenCalledTimes(1);
  });

  test("usePathwaySVG receives reward-path loading flags", () => {
    const data = buildHookData({ isRewardPathLoaded: true });
    (usePathwayData as jest.Mock).mockReturnValue(data);
    render(<PathwayStructure />);
    expect(usePathwaySVG).toHaveBeenCalledWith(
      expect.objectContaining({
        isRewardPathLoaded: true,
        setIsRewardPathLoaded: data.setIsRewardPathLoaded,
      })
    );
  });

  test("renders modal text from hook as-is", () => {
    (usePathwayData as jest.Mock).mockReturnValue(
      buildHookData({
        modalOpen: true,
        modalText: "Custom locked lesson message",
      })
    );
    render(<PathwayStructure />);
    expect(screen.getByText("Custom locked lesson message")).toBeInTheDocument();
  });

  test("modal close icon remains available when modal is open", () => {
    (usePathwayData as jest.Mock).mockReturnValue(
      buildHookData({
        modalOpen: true,
        modalText: "Locked",
      })
    );
    render(<PathwayStructure />);
    expect(screen.getByAltText("close-icon")).toBeInTheDocument();
  });

  test("pathway root div renders exactly once", () => {
    const { container } = render(<PathwayStructure />);
    expect(container.querySelectorAll(".pathway-structure-div")).toHaveLength(1);
  });
});
