import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DisplayStudents from './DisplayStudents';
import { MODES, PAGES } from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';
import { Util } from '../utility/util';
import { schoolUtil } from '../utility/schoolUtil';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { updateLocalAttributes, useGbContext } from '../growthbook/Growthbook';
import { useOnlineOfflineErrorMessageHandler } from '../common/onlineOfflineErrorMessageHandler';

const mockHistoryReplace = jest.fn();
const mockSetGbUpdated = jest.fn();
const mockPresentToast = jest.fn();

const mockApi = {
  getParentStudentProfiles: jest.fn(),
  getStudentClassesAndSchools: jest.fn(),
  getClassById: jest.fn(),
};

jest.mock('@ionic/react', () => ({
  IonPage: (props: any) => <div data-testid="ion-page">{props.children}</div>,
  IonContent: (props: any) => <div>{props.children}</div>,
  useIonToast: () => [jest.fn()],
}));

jest.mock('react-router', () => ({
  useHistory: () => ({
    replace: mockHistoryReplace,
    location: { pathname: '/display-students' },
  }),
}));

jest.mock('i18next', () => ({
  t: (k: string) => k,
}));

jest.mock('../i18n', () => ({
  __esModule: true,
  default: {
    changeLanguage: jest.fn().mockResolvedValue(undefined),
    language: 'en',
  },
}));

jest.mock('../components/ChimpleLogo', () => (props: any) => (
  <div data-testid="chimple-logo">
    <div>{props.header}</div>
    {props.msg?.map((m: string) => (
      <span key={m}>{m}</span>
    ))}
  </div>
));

jest.mock('../components/Loading', () => () => <div data-testid="loading" />);

jest.mock('../components/SkeltonLoading', () => (props: any) => (
  <div data-testid="skeleton-loading">{String(props.header)}</div>
));

jest.mock('../components/parent/ParentalLock', () => (props: any) => (
  <div data-testid="parental-lock">
    <button type="button" onClick={props.handleClose}>
      keep-open
    </button>
    <button type="button" onClick={props.onHandleClose}>
      close-lock
    </button>
  </div>
));

jest.mock('../utility/util');
jest.mock('../utility/schoolUtil', () => ({
  schoolUtil: {
    getCurrMode: jest.fn(),
    setCurrMode: jest.fn(),
    setCurrentClass: jest.fn(),
  },
}));

jest.mock('../growthbook/Growthbook', () => ({
  useGbContext: jest.fn(),
  updateLocalAttributes: jest.fn(),
}));

jest.mock('../common/onlineOfflineErrorMessageHandler', () => ({
  useOnlineOfflineErrorMessageHandler: jest.fn(),
}));

jest.mock('../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: jest.fn(),
  },
}));

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(),
  },
}));

jest.mock('@capacitor/screen-orientation', () => ({
  ScreenOrientation: {
    lock: jest.fn(),
  },
}));

describe('DisplayStudents', () => {
  const students = [
    {
      id: 'stu-1',
      name: 'Student One',
      avatar: 'fox',
      image: 'https://cdn/stu-1.png',
      language_id: 'lang-1',
      grade_id: 'grade-1',
      age: 7,
    },
    {
      id: 'stu-2',
      name: '',
      avatar: 'lion',
      language_id: 'lang-2',
      grade_id: 'grade-2',
      age: 8,
    },
  ] as any[];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: mockApi,
    });
    (useGbContext as jest.Mock).mockReturnValue({
      setGbUpdated: mockSetGbUpdated,
    });
    (useOnlineOfflineErrorMessageHandler as jest.Mock).mockReturnValue({
      online: true,
      presentToast: mockPresentToast,
    });
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    (schoolUtil.getCurrMode as jest.Mock).mockResolvedValue(MODES.PARENT);
    (Util.loadBackgroundImage as jest.Mock).mockImplementation(() => {});
    (Util.mergeStudentsByUpdatedAt as jest.Mock).mockImplementation((s) => s);
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(undefined);
    (Util.setCurrentStudent as jest.Mock).mockResolvedValue(undefined);
    (Util.ensureLidoCommonAudioForStudent as jest.Mock).mockResolvedValue(
      undefined,
    );

    mockApi.getParentStudentProfiles.mockResolvedValue(students);
    mockApi.getStudentClassesAndSchools.mockResolvedValue({
      classes: [{ id: 'class-1' }],
      schools: [{ id: 'school-1' }],
    });
    mockApi.getClassById.mockResolvedValue({ id: 'class-1', name: 'Class 1' });
  });

  test('loads background image and fetches student profiles on mount', async () => {
    render(<DisplayStudents />);

    await waitFor(() => {
      expect(Util.loadBackgroundImage).toHaveBeenCalled();
      expect(mockApi.getParentStudentProfiles).toHaveBeenCalled();
    });
  });

  test('calls mergeStudentsByUpdatedAt with session map string', async () => {
    sessionStorage.setItem(
      'editStudentsMap',
      JSON.stringify({ 'stu-1': { name: 'Edited' } }),
    );
    render(<DisplayStudents />);

    await waitFor(() => {
      expect(Util.mergeStudentsByUpdatedAt).toHaveBeenCalledWith(
        expect.any(Array),
        JSON.stringify({ 'stu-1': { name: 'Edited' } }),
      );
    });
  });

  test('renders welcome copy and student cards after loading', async () => {
    render(<DisplayStudents />);

    expect(await screen.findByTestId('chimple-logo')).toBeInTheDocument();
    expect(screen.getByText('Welcome to Chimple!')).toBeInTheDocument();
    expect(await screen.findByText('Student One')).toBeInTheDocument();
  });

  test('shows Profile label when student has name', async () => {
    render(<DisplayStudents />);

    expect(await screen.findByText('Profile:')).toBeInTheDocument();
  });

  test('renders avatar fallback path in parent mode', async () => {
    render(<DisplayStudents />);

    await screen.findByText('Student One');
    const img = document.querySelector('img.avatar-img') as HTMLImageElement;
    expect(img.src).toContain('assets/avatars/');
  });

  test('renders school image when mode is SCHOOL and image exists', async () => {
    (schoolUtil.getCurrMode as jest.Mock).mockResolvedValue(MODES.SCHOOL);
    render(<DisplayStudents />);

    await waitFor(() => {
      const imgs = Array.from(
        document.querySelectorAll('img.avatar-img'),
      ) as HTMLImageElement[];
      expect(imgs.some((n) => n.src.includes('https://cdn/stu-1.png'))).toBe(
        true,
      );
    });
  });

  test('updates growthbook child-count attributes when students are loaded', async () => {
    render(<DisplayStudents />);

    await waitFor(() => {
      expect(updateLocalAttributes).toHaveBeenCalledWith({
        count_of_children: 2,
      });
      expect(mockSetGbUpdated).toHaveBeenCalledWith(true);
    });
  });

  test('shows skeleton loader with DISPLAY_STUDENT header', async () => {
    render(<DisplayStudents />);
    expect(await screen.findByTestId('skeleton-loading')).toHaveTextContent(
      PAGES.DISPLAY_STUDENT,
    );
  });

  test('locks orientation when running on native platform', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    render(<DisplayStudents />);

    await waitFor(() => {
      expect(ScreenOrientation.lock).toHaveBeenCalledWith({
        orientation: 'landscape',
      });
    });
  });

  test('does not lock orientation on web platform', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    render(<DisplayStudents />);

    await waitFor(() => {
      expect(ScreenOrientation.lock).not.toHaveBeenCalled();
    });
  });

  test('opens parental lock popup when Parent button is clicked', async () => {
    render(<DisplayStudents />);

    fireEvent.click(await screen.findByRole('button', { name: 'Parent' }));
    expect(screen.getByTestId('parental-lock')).toBeInTheDocument();
  });

  test('closes parental lock when onHandleClose is called', async () => {
    render(<DisplayStudents />);

    fireEvent.click(await screen.findByRole('button', { name: 'Parent' }));
    fireEvent.click(screen.getByRole('button', { name: 'close-lock' }));

    await waitFor(() => {
      expect(screen.queryByTestId('parental-lock')).not.toBeInTheDocument();
    });
  });

  test('keeps parental lock open when handleClose is called', async () => {
    render(<DisplayStudents />);

    fireEvent.click(await screen.findByRole('button', { name: 'Parent' }));
    fireEvent.click(screen.getByRole('button', { name: 'keep-open' }));
    expect(screen.getByTestId('parental-lock')).toBeInTheDocument();
  });

  test('clicking student switches mode, sets student and updates GB attributes', async () => {
    render(<DisplayStudents />);

    fireEvent.click(await screen.findByText('Student One'));

    await waitFor(() => {
      expect(schoolUtil.setCurrMode).toHaveBeenCalledWith(MODES.PARENT);
      expect(Util.setCurrentStudent).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'stu-1' }),
        undefined,
        true,
      );
      expect(updateLocalAttributes).toHaveBeenCalledWith(
        expect.objectContaining({
          student_id: 'stu-1',
          age: 7,
          grade_id: 'grade-1',
        }),
      );
      expect(mockSetGbUpdated).toHaveBeenCalledWith(true);
    });
  });

  test('fetches linked classes and sets current class when class exists', async () => {
    render(<DisplayStudents />);
    fireEvent.click(await screen.findByText('Student One'));

    await waitFor(() => {
      expect(mockApi.getStudentClassesAndSchools).toHaveBeenCalledWith('stu-1');
      expect(mockApi.getClassById).toHaveBeenCalledWith('class-1');
      expect(schoolUtil.setCurrentClass).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'class-1' }),
      );
    });
  });

  test('sets current class undefined when linked class list is empty', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockApi.getStudentClassesAndSchools.mockResolvedValueOnce({
      classes: [],
      schools: [],
    });

    render(<DisplayStudents />);
    fireEvent.click(await screen.findByText('Student One'));

    await waitFor(() => {
      expect(schoolUtil.setCurrentClass).toHaveBeenCalledWith(undefined);
      expect(warnSpy).toHaveBeenCalledWith('No classes found for the student.');
    });
    warnSpy.mockRestore();
  });

  test('ensures lido common audio when student profile is selected', async () => {
    render(<DisplayStudents />);
    fireEvent.click(await screen.findByText('Student One'));

    await waitFor(() => {
      expect(Util.ensureLidoCommonAudioForStudent).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'stu-1' }),
      );
    });
  });

  test('navigates to edit student when selected student language is missing', async () => {
    mockApi.getParentStudentProfiles.mockResolvedValueOnce([
      { ...students[0], id: 'stu-3', language_id: null },
    ]);
    render(<DisplayStudents />);

    fireEvent.click(await screen.findByText('Student One'));
    await waitFor(() => {
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.EDIT_STUDENT, {
        from: '/display-students',
      });
    });
  });

  test('navigates to home with current query params when profile is complete', async () => {
    window.history.replaceState(
      {},
      '',
      '/display-students?tab=ASSIGNMENT&page=/join-class',
    );
    render(<DisplayStudents />);

    fireEvent.click(await screen.findByText('Student One'));
    await waitFor(() => {
      expect(mockHistoryReplace).toHaveBeenCalledWith(
        `${PAGES.HOME}?tab=ASSIGNMENT&page=/join-class`,
      );
    });
  });

  test('renders blank placeholder span for student name when name is empty', async () => {
    render(<DisplayStudents />);

    await waitFor(() => {
      const names = Array.from(
        document.querySelectorAll('.display-student-name'),
      ).map((el) => el.textContent);
      expect(names.some((v) => v === '\u00A0')).toBe(true);
    });
  });

  test('sets student mode from schoolUtil.getCurrMode', async () => {
    (schoolUtil.getCurrMode as jest.Mock).mockResolvedValueOnce(MODES.SCHOOL);
    render(<DisplayStudents />);

    await waitFor(() => {
      expect(schoolUtil.getCurrMode).toHaveBeenCalled();
    });
  });
});
