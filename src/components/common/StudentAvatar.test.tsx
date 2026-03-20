import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import StudentAvatar from './StudentAvatar';

/* ================= MOCKS ================= */

jest.mock('i18next', () => ({
  t: jest.fn((key: string) => key),
}));

jest.mock('../../common/constants', () => ({
  AVATARS: ['defaultAvatar'],
}));

jest.mock('../../utility/util', () => ({
  Util: {
    getCurrentStudent: jest.fn(),
  },
}));

const { Util } = require('../../utility/util');

/* ================= TEST DATA ================= */

const student = {
  id: '1',
  name: 'Renuka',
  avatar: 'avatar1',
};

const currentStudent = {
  id: '1',
  name: 'Renuka',
};

describe('StudentAvatar Component', () => {
  const mockClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Util.getCurrentStudent.mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
  });

  /* ---------------- Rendering ---------------- */

  test('2. renders student name by default (below)', () => {
    render(<StudentAvatar student={student} onClicked={mockClick} />);
    expect(screen.getByText('Renuka')).toBeInTheDocument();
  });

  test('3. applies default class name', () => {
    const { container } = render(
      <StudentAvatar student={student} onClicked={mockClick} />,
    );
    expect(container.firstChild).toHaveClass('student-avatar-below');
  });

  test('7. shows name when student is not current student', () => {
    Util.getCurrentStudent.mockReturnValue({ id: '2' });
    render(<StudentAvatar student={student} onClicked={mockClick} />);
    expect(screen.getByText('Renuka')).toBeInTheDocument();
  });

  /* ---------------- namePosition Branches ---------------- */

  test("8. renders name above when namePosition='above'", () => {
    render(
      <StudentAvatar
        student={student}
        onClicked={mockClick}
        namePosition="above"
      />,
    );
    expect(screen.getByText('Renuka')).toBeInTheDocument();
  });

  test("9. renders name below when namePosition='below'", () => {
    render(
      <StudentAvatar
        student={student}
        onClicked={mockClick}
        namePosition="below"
      />,
    );
    expect(screen.getByText('Renuka')).toBeInTheDocument();
  });

  test("10. renders name right when namePosition='right'", () => {
    render(
      <StudentAvatar
        student={student}
        onClicked={mockClick}
        namePosition="right"
      />,
    );
    expect(screen.getByText('Renuka')).toBeInTheDocument();
  });

  test("11. renders name left when namePosition='left'", () => {
    render(
      <StudentAvatar
        student={student}
        onClicked={mockClick}
        namePosition="left"
      />,
    );
    expect(screen.getByText('Renuka')).toBeInTheDocument();
  });

  /* ---------------- nameLabel ---------------- */

  test('15. appends nameLabel to student name', () => {
    render(
      <StudentAvatar
        student={student}
        onClicked={mockClick}
        nameLabel="(Leader)"
      />,
    );
    expect(screen.getByText(/Renuka/)).toHaveTextContent('(Leader)');
  });

  /* ---------------- Style Logic ---------------- */

  test('17. flexDirection column for above', () => {
    const { container } = render(
      <StudentAvatar
        student={student}
        onClicked={mockClick}
        namePosition="above"
      />,
    );
    expect(container.firstChild).toHaveStyle('flex-direction: column');
  });

  test('18. flexDirection row for right', () => {
    const { container } = render(
      <StudentAvatar
        student={student}
        onClicked={mockClick}
        namePosition="right"
      />,
    );
    expect(container.firstChild).toHaveStyle('flex-direction: row');
  });

  /* ---------------- Edge Cases ---------------- */
  test('20. handles undefined nameLabel', () => {
    render(<StudentAvatar student={student} onClicked={mockClick} />);
    expect(screen.getByText('Renuka')).toBeInTheDocument();
  });

  test('21. renders even if getCurrentStudent returns undefined', () => {
    Util.getCurrentStudent.mockReturnValue(undefined);
    render(<StudentAvatar student={student} onClicked={mockClick} />);
    expect(screen.getByText('Renuka')).toBeInTheDocument();
  });

  /* ---------------- Re-render ---------------- */

  test('22. updates when namePosition changes', () => {
    const { rerender } = render(
      <StudentAvatar student={student} onClicked={mockClick} />,
    );

    rerender(
      <StudentAvatar
        student={student}
        onClicked={mockClick}
        namePosition="right"
      />,
    );

    expect(screen.getByText('Renuka')).toBeInTheDocument();
  });

  /* ---------------- Cleanup ---------------- */

  test('27. mounts and unmounts cleanly', () => {
    const { unmount } = render(
      <StudentAvatar student={student} onClicked={mockClick} />,
    );
    expect(() => unmount()).not.toThrow();
  });

  test('28. no console errors during render', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    render(<StudentAvatar student={student} onClicked={mockClick} />);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test('renders correctly when getCurrentStudent returns null', () => {
    Util.getCurrentStudent.mockReturnValue(null);

    render(
      <StudentAvatar
        student={{ id: '22', name: 'Jamie', avatar: 'avatarX' }}
        onClicked={mockClick}
      />,
    );

    expect(screen.getByText('Jamie')).toBeInTheDocument();
  });

  test('renders correctly when getCurrentStudent returns undefined', () => {
    Util.getCurrentStudent.mockReturnValue(undefined);

    render(
      <StudentAvatar
        student={{ id: '23', name: 'Chris', avatar: 'avatarX' }}
        onClicked={mockClick}
      />,
    );

    expect(screen.getByText('Chris')).toBeInTheDocument();
  });

  test("does not render 'Me' when ids do not match", () => {
    Util.getCurrentStudent.mockReturnValue({ id: '999' });

    render(
      <StudentAvatar
        student={{ id: '24', name: 'Taylor', avatar: 'avatarX' }}
        onClicked={mockClick}
      />,
    );

    expect(screen.queryByText('Me')).not.toBeInTheDocument();
    expect(screen.getByText('Taylor')).toBeInTheDocument();
  });

  test('renders student name when namePosition is left', () => {
    render(
      <StudentAvatar
        student={{ id: '60', name: 'Jordan', avatar: 'avatarX' }}
        onClicked={mockClick}
        namePosition="left"
      />,
    );

    expect(screen.getByText('Jordan')).toBeInTheDocument();
  });

  test('renders student name when namePosition is above', () => {
    render(
      <StudentAvatar
        student={{ id: '70', name: 'Casey', avatar: 'avatarX' }}
        onClicked={mockClick}
        namePosition="above"
      />,
    );

    expect(screen.getByText('Casey')).toBeInTheDocument();
  });

  test('renders student name when namePosition is below', () => {
    render(
      <StudentAvatar
        student={{ id: '80', name: 'Riley', avatar: 'avatarX' }}
        onClicked={mockClick}
        namePosition="below"
      />,
    );

    expect(screen.getByText('Riley')).toBeInTheDocument();
  });
  test('renders nameLabel together with student name', () => {
    render(
      <StudentAvatar
        student={{ id: '90', name: 'Avery', avatar: 'avatar1' }}
        onClicked={mockClick}
        nameLabel="(Leader)"
      />,
    );

    expect(screen.getByText(/Avery/)).toBeInTheDocument();
    expect(screen.getByText(/\(Leader\)/)).toBeInTheDocument();
  });
});
