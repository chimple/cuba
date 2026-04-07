import { render, screen, fireEvent } from '@testing-library/react';
import PaintExitPopup from './PaintExitPopup';
import { AudioUtil } from '../../utility/AudioUtil';

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('../../utility/AudioUtil', () => ({
  AudioUtil: {
    playAudioOrTts: jest.fn().mockResolvedValue(true),
    stopAudioUrlOrTtsPlayback: jest.fn().mockResolvedValue(undefined),
    getLocalizedAudioUrl: jest.fn(),
  },
}));

describe('PaintExitPopup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AudioUtil.getLocalizedAudioUrl as jest.Mock).mockImplementation(
      async (folder: string, clipName: string) =>
        `/assets/audios/${folder}/en_${clipName}.mp3`,
    );
  });

  test('does not render when closed', () => {
    const { container } = render(
      <PaintExitPopup
        isOpen={false}
        onStay={jest.fn()}
        onExit={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders when open with text and buttons', async () => {
    render(
      <PaintExitPopup
        isOpen={true}
        onStay={jest.fn()}
        onExit={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(
      screen.getByText('Uh-oh! Do you want to leave paint mode?'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stay' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Replay audio' }),
    ).toBeInTheDocument();
    await screen.findByRole('button', { name: 'Replay audio' });
    expect(AudioUtil.getLocalizedAudioUrl).toHaveBeenCalledWith(
      'paintExit',
      'leave_paint',
    );
    expect(AudioUtil.playAudioOrTts).toHaveBeenCalledWith({
      audioUrl: '/assets/audios/paintExit/en_leave_paint.mp3',
      delayMs: 300,
      text: 'Uh-oh! Do you want to leave paint mode?',
    });
  });

  test('renders post-save variant with yes/no and mapped actions', async () => {
    const onStay = jest.fn();
    const onExit = jest.fn();

    render(
      <PaintExitPopup
        isOpen={true}
        onStay={onStay}
        onExit={onExit}
        onClose={jest.fn()}
        variant="post-save-exit"
      />,
    );

    expect(screen.getByText('Your creation is shared!')).toBeInTheDocument();
    expect(
      screen.getByText(/Please confirm if you want to exit\.?$/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    fireEvent.click(screen.getByRole('button', { name: 'No' }));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onStay).toHaveBeenCalledTimes(1);
    expect(AudioUtil.stopAudioUrlOrTtsPlayback).toHaveBeenCalled();
    await screen.findByRole('button', { name: 'Yes' });
    expect(AudioUtil.getLocalizedAudioUrl).toHaveBeenCalledWith(
      'paintExit',
      'creation_shared_exit',
    );
    expect(AudioUtil.playAudioOrTts).toHaveBeenCalledWith({
      audioUrl: '/assets/audios/paintExit/en_creation_shared_exit.mp3',
      delayMs: 300,
      text: 'Your creation is shared! Please confirm if you want to exit',
    });
  });

  test('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <PaintExitPopup
        isOpen={true}
        onStay={jest.fn()}
        onExit={jest.fn()}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(AudioUtil.stopAudioUrlOrTtsPlayback).toHaveBeenCalled();
  });

  test('calls onStay when stay button is clicked', () => {
    const onStay = jest.fn();
    render(
      <PaintExitPopup
        isOpen={true}
        onStay={onStay}
        onExit={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Stay' }));
    expect(onStay).toHaveBeenCalledTimes(1);
    expect(AudioUtil.stopAudioUrlOrTtsPlayback).toHaveBeenCalled();
  });

  test('calls onExit when exit button is clicked', () => {
    const onExit = jest.fn();
    render(
      <PaintExitPopup
        isOpen={true}
        onStay={jest.fn()}
        onExit={onExit}
        onClose={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Exit' }));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(AudioUtil.stopAudioUrlOrTtsPlayback).toHaveBeenCalled();
  });
  /* ---------- BUTTON COUNT ---------- */

  test('renders exactly four buttons when open', () => {
    render(
      <PaintExitPopup
        isOpen={true}
        onStay={jest.fn()}
        onExit={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(4);
  });

  /* ---------- MESSAGE EXISTS ---------- */

  test('exit message appears when popup opens', () => {
    render(
      <PaintExitPopup
        isOpen={true}
        onStay={jest.fn()}
        onExit={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(
      screen.getByText('Uh-oh! Do you want to leave paint mode?'),
    ).toBeVisible();
  });

  /* ---------- STAY BUTTON MULTIPLE CLICKS ---------- */

  test('stay button can be clicked multiple times', () => {
    const onStay = jest.fn();

    render(
      <PaintExitPopup
        isOpen={true}
        onStay={onStay}
        onExit={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    const stayBtn = screen.getByRole('button', { name: 'Stay' });

    fireEvent.click(stayBtn);
    fireEvent.click(stayBtn);
    fireEvent.click(stayBtn);

    expect(onStay).toHaveBeenCalledTimes(3);
  });

  /* ---------- EXIT BUTTON MULTIPLE CLICKS ---------- */

  test('exit button handles multiple clicks', () => {
    const onExit = jest.fn();

    render(
      <PaintExitPopup
        isOpen={true}
        onStay={jest.fn()}
        onExit={onExit}
        onClose={jest.fn()}
      />,
    );

    const exitBtn = screen.getByRole('button', { name: 'Exit' });

    fireEvent.click(exitBtn);
    fireEvent.click(exitBtn);

    expect(onExit).toHaveBeenCalledTimes(2);
  });

  /* ---------- CLOSE BUTTON MULTIPLE CLICKS ---------- */

  test('close button handles multiple clicks', () => {
    const onClose = jest.fn();

    render(
      <PaintExitPopup
        isOpen={true}
        onStay={jest.fn()}
        onExit={jest.fn()}
        onClose={onClose}
      />,
    );

    const closeBtn = screen.getByRole('button', { name: 'Close' });

    fireEvent.click(closeBtn);
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  /* ---------- BUTTON TYPES ---------- */

  test('all buttons have type button', () => {
    render(
      <PaintExitPopup
        isOpen={true}
        onStay={jest.fn()}
        onExit={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    const buttons = screen.getAllByRole('button');

    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('type', 'button');
    });
  });

  /* ---------- STAY BUTTON EXISTS ---------- */

  test('stay button is visible', () => {
    render(
      <PaintExitPopup
        isOpen={true}
        onStay={jest.fn()}
        onExit={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Stay' })).toBeVisible();
  });

  /* ---------- EXIT BUTTON EXISTS ---------- */

  test('exit button is visible', () => {
    render(
      <PaintExitPopup
        isOpen={true}
        onStay={jest.fn()}
        onExit={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Exit' })).toBeVisible();
  });

  /* ---------- CLOSE BUTTON EXISTS ---------- */

  test('close button is visible', () => {
    render(
      <PaintExitPopup
        isOpen={true}
        onStay={jest.fn()}
        onExit={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Close' })).toBeVisible();
  });

  /* ---------- COMPONENT RENDERS WITHOUT CRASH ---------- */

  test('component renders without crashing', () => {
    render(
      <PaintExitPopup
        isOpen={true}
        onStay={() => {}}
        onExit={() => {}}
        onClose={() => {}}
      />,
    );

    expect(true).toBe(true);
  });

  /* ---------- CALLBACKS NOT AUTO TRIGGERED ---------- */

  test('callbacks are not triggered automatically', () => {
    const onStay = jest.fn();
    const onExit = jest.fn();
    const onClose = jest.fn();

    render(
      <PaintExitPopup
        isOpen={true}
        onStay={onStay}
        onExit={onExit}
        onClose={onClose}
      />,
    );

    expect(onStay).not.toHaveBeenCalled();
    expect(onExit).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  /* ---------- RERENDER OPEN/CLOSE ---------- */

  test('popup appears when rerendered with open state', () => {
    const { rerender } = render(
      <PaintExitPopup
        isOpen={false}
        onStay={jest.fn()}
        onExit={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    rerender(
      <PaintExitPopup
        isOpen={true}
        onStay={jest.fn()}
        onExit={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(
      screen.getByText('Uh-oh! Do you want to leave paint mode?'),
    ).toBeInTheDocument();
  });

  /* ---------- BUTTON CLICK ORDER ---------- */

  test('clicking stay then exit triggers both handlers', () => {
    const onStay = jest.fn();
    const onExit = jest.fn();

    render(
      <PaintExitPopup
        isOpen={true}
        onStay={onStay}
        onExit={onExit}
        onClose={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Stay' }));
    fireEvent.click(screen.getByRole('button', { name: 'Exit' }));

    expect(onStay).toHaveBeenCalled();
    expect(onExit).toHaveBeenCalled();
  });

  /* ---------- POPUP DOM STRUCTURE ---------- */

  test('popup contains message container', () => {
    render(
      <PaintExitPopup
        isOpen={true}
        onStay={jest.fn()}
        onExit={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    const message = screen.getByText('Uh-oh! Do you want to leave paint mode?');

    expect(message.parentElement).toBeInTheDocument();
  });

  /* ---------- TEXT CONTENT STABILITY ---------- */

  test('popup message text remains unchanged', () => {
    render(
      <PaintExitPopup
        isOpen={true}
        onStay={jest.fn()}
        onExit={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(
      screen.getByText('Uh-oh! Do you want to leave paint mode?'),
    ).toHaveTextContent('leave paint mode');
  });

  /* ---------- BUTTONS REMAIN AFTER CLICK ---------- */

  test('buttons remain visible after click', () => {
    render(
      <PaintExitPopup
        isOpen={true}
        onStay={jest.fn()}
        onExit={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Stay' }));

    expect(screen.getByRole('button', { name: 'Exit' })).toBeVisible();
  });

  /* ---------- POPUP STAYS OPEN AFTER STAY ---------- */

  test('popup remains after stay click', () => {
    render(
      <PaintExitPopup
        isOpen={true}
        onStay={jest.fn()}
        onExit={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Stay' }));

    expect(
      screen.getByText('Uh-oh! Do you want to leave paint mode?'),
    ).toBeInTheDocument();
  });

  /* ---------- CLOSE BUTTON DOES NOT TRIGGER EXIT ---------- */

  test('close button does not trigger exit handler', () => {
    const onExit = jest.fn();

    render(
      <PaintExitPopup
        isOpen={true}
        onStay={jest.fn()}
        onExit={onExit}
        onClose={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onExit).not.toHaveBeenCalled();
  });

  test('replays audio when speaker button is clicked', async () => {
    render(
      <PaintExitPopup
        isOpen={true}
        onStay={jest.fn()}
        onExit={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Replay audio' }));

    await screen.findByRole('button', { name: 'Replay audio' });
    expect(AudioUtil.playAudioOrTts).toHaveBeenCalledTimes(2);
    expect(AudioUtil.playAudioOrTts).toHaveBeenLastCalledWith({
      audioUrl: '/assets/audios/paintExit/en_leave_paint.mp3',
      text: 'Uh-oh! Do you want to leave paint mode?',
    });
  });
});
