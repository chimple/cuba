import React from 'react';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ParentWhatsappInvitationPage from './ParentWhatsappInvitationPage';
import {
  formatCellValue,
  formatFileSize,
  formatHeaderLabel,
  formatProcessedUdiseRows,
  getTodayDateValue,
  getWhatsappMediaType,
  toApiError,
  useParentWhatsappInvitationPageLogic,
} from './parentWhatsappInvitationPageLogic';
import * as parentWhatsappInvitationService from './parentWhatsappInvitationService';
import { ServiceConfig } from '../../../services/ServiceConfig';
import * as phoneNormalization from '../../utils/phoneNormalization';

jest.mock('i18next', () => ({
  t: (key: string, options?: Record<string, unknown>) => {
    if (key.includes('{{value}}') && options?.value !== undefined) {
      return key.replace('{{value}}', String(options.value));
    }
    if (key.includes('{{count}}') && options?.count !== undefined) {
      return key.replace('{{count}}', String(options.count));
    }
    if (key.includes('{{phone}}') && options?.phone !== undefined) {
      return key.replace('{{phone}}', String(options.phone));
    }
    if (
      key.includes('{{successCount}}') &&
      options?.successCount !== undefined
    ) {
      return key.replace('{{successCount}}', String(options.successCount));
    }
    if (key.includes('{{failedCount}}') && options?.failedCount !== undefined) {
      return key.replace('{{failedCount}}', String(options.failedCount));
    }
    if (
      key.includes('{{failureCount}}') &&
      options?.failureCount !== undefined
    ) {
      return key.replace('{{failureCount}}', String(options.failureCount));
    }
    return key;
  },
}));

jest.mock('../../components/DataTableBody', () => (props: any) => (
  <div data-testid="data-table-body">
    {props.columns.map((column: any) => (
      <div key={`header-${column.key}`}>{column.label}</div>
    ))}
    {props.rows.map((row: Record<string, unknown>, index: number) => (
      <div key={`row-${index}`}>
        {props.columns
          .map((column: any) =>
            column.render ? column.render(row) : row[column.key],
          )
          .join('|')}
      </div>
    ))}
  </div>
));

jest.mock('./parentWhatsappInvitationPageLogic', () => ({
  ...jest.requireActual('./parentWhatsappInvitationPageLogic'),
  useParentWhatsappInvitationPageLogic: jest.fn(),
}));

const mockUseParentWhatsappInvitationPageLogic =
  useParentWhatsappInvitationPageLogic as jest.MockedFunction<
    typeof useParentWhatsappInvitationPageLogic
  >;

const actualPageLogicModule = jest.requireActual(
  './parentWhatsappInvitationPageLogic',
) as typeof import('./parentWhatsappInvitationPageLogic');

const useParentWhatsappInvitationPageLogicActual =
  actualPageLogicModule.useParentWhatsappInvitationPageLogic;

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const createFileList = (files: File[]): FileList =>
  ({
    length: files.length,
    item: (index: number) => files[index] ?? null,
    ...Object.fromEntries(files.map((file, index) => [index, file])),
  }) as unknown as FileList;

const createLogicState = (overrides: Partial<any> = {}) => ({
  uploadInputRef: { current: { click: jest.fn() } },
  isWhatsappMode: false,
  setIsWhatsappMode: jest.fn(),
  showMsg91Report: false,
  setShowMsg91Report: jest.fn(),
  isDraggingFile: false,
  setIsDraggingFile: jest.fn(),
  udiseInput: '',
  setUdiseInput: jest.fn(),
  limit: 300,
  setLimit: jest.fn(),
  analysisResult: null,
  analysisFeedback: null,
  isAnalyzing: false,
  isSendingSms: false,
  smsFeedback: null,
  smsResult: null,
  startDate: '2026-03-17',
  setStartDate: jest.fn(),
  endDate: '2026-03-17',
  setEndDate: jest.fn(),
  reportRows: [],
  reportFeedback: null,
  isLoadingReport: false,
  phoneInput: '',
  setPhoneInput: jest.fn(),
  templateName: '',
  setTemplateName: jest.fn(),
  templateLang: '',
  setTemplateLang: jest.fn(),
  messageType: 'utility',
  setMessageType: jest.fn(),
  uploadedMedia: null,
  setUploadedMedia: jest.fn(),
  manualValidation: {
    normalizedPhones: [],
    duplicates: [],
    invalid: [],
  },
  manualFeedback: null,
  isSendingWhatsapp: false,
  whatsappProgress: 0,
  manualSendSummary: null,
  handleAnalyze: jest.fn(),
  handleSendSmsInvites: jest.fn(),
  handleFetchReport: jest.fn(),
  handleFileSelect: jest.fn(),
  handleSendWhatsapp: jest.fn(),
  ...overrides,
});

const renderPage = (overrides: Partial<any> = {}) => {
  const state = createLogicState(overrides);
  mockUseParentWhatsappInvitationPageLogic.mockReturnValue(state as any);
  const utils = render(<ParentWhatsappInvitationPage />);
  return { ...utils, state };
};

describe('ParentWhatsappInvitationPage component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Covers default SMS/UDISE mode rendering with core form fields.
  it('renders UDISE mode by default with UDISE input, limit input, and Run Analysis button', () => {
    renderPage({ isWhatsappMode: false, showMsg91Report: false });

    expect(screen.getByText('Enter UDISE codes')).toBeInTheDocument();
    expect(screen.getByText('Message Limit')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run Analysis' })).toBeInTheDocument();
  });

  // Covers switch accessibility attributes for toggle controls.
  it('renders toggles with role switch and aria-checked state', () => {
    renderPage({ isWhatsappMode: true, showMsg91Report: false });

    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toHaveAttribute('aria-checked', 'true');
    expect(switches[1]).toHaveAttribute('aria-checked', 'false');
  });

  // Covers WhatsApp toggle click wiring to state setter.
  it('calls setIsWhatsappMode when whatsapp toggle is clicked', async () => {
    const user = userEvent.setup();
    const { state } = renderPage({ isWhatsappMode: false });

    await user.click(screen.getByRole('switch', { name: /WhatsApp/i }));
    expect(state.setIsWhatsappMode).toHaveBeenCalledWith(true);
  });

  // Covers MSG91 report toggle click wiring to state setter.
  it('calls setShowMsg91Report when report toggle is clicked', async () => {
    const user = userEvent.setup();
    const { state } = renderPage({ showMsg91Report: false });

    await user.click(screen.getByRole('switch', { name: /View MSG91 Report/i }));
    expect(state.setShowMsg91Report).toHaveBeenCalledWith(true);
  });

  // Covers WhatsApp mode rendering and SMS mode hiding behavior.
  it('renders whatsapp form and hides UDISE form when whatsapp mode is enabled', () => {
    renderPage({ isWhatsappMode: true });

    expect(
      screen.getByText('Send WhatsApp messages to parents'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Enter phone numbers (one per line or comma-separated)'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Enter UDISE codes')).not.toBeInTheDocument();
  });

  // Covers MSG91 report mode rendering when report toggle is active.
  it('renders MSG91 report date fields and report button in report mode', () => {
    renderPage({ isWhatsappMode: false, showMsg91Report: true });

    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Get Report' })).toBeInTheDocument();
  });

  // Covers report button disabled state while report request is loading.
  it('disables Get Report button when isLoadingReport is true', () => {
    renderPage({ isWhatsappMode: false, showMsg91Report: true, isLoadingReport: true });

    expect(screen.getByRole('button', { name: 'Get Report' })).toBeDisabled();
  });

  // Covers whatsapp message type select options and change handler wiring.
  it('renders utility/marketing options and calls setMessageType on selection change', () => {
    const { state } = renderPage({ isWhatsappMode: true, messageType: 'utility' });

    const select = screen.getByDisplayValue('utility');
    expect(select).toBeInTheDocument();

    fireEvent.change(select, {
      target: { value: 'marketing' },
    });

    expect(state.setMessageType).toHaveBeenCalledWith('marketing');
  });

  // Covers upload zone click behavior invoking hidden file input click.
  it('triggers upload input click when upload zone is clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderPage({ isWhatsappMode: true });

    const uploadZone = container.querySelector('[role="button"][tabindex="0"]') as HTMLElement;
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = jest.spyOn(input, 'click').mockImplementation(() => {});
    await user.click(uploadZone);

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  // Covers upload zone keyboard accessibility for Enter and Space activation.
  it('triggers upload input click on Enter and Space keyboard events', () => {
    const { container } = renderPage({ isWhatsappMode: true });

    const uploadZone = container.querySelector('[role="button"][tabindex="0"]') as HTMLElement;
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = jest.spyOn(input, 'click').mockImplementation(() => {});
    fireEvent.keyDown(uploadZone, { key: 'Enter' });
    fireEvent.keyDown(uploadZone, { key: ' ' });

    expect(clickSpy).toHaveBeenCalledTimes(2);
  });

  // Covers upload zone drag-over and drag-leave state callbacks.
  it('calls dragging state handlers on drag over and drag leave', () => {
    const { state, container } = renderPage({ isWhatsappMode: true });

    const uploadZone = container.querySelector('[role="button"][tabindex="0"]') as HTMLElement;
    fireEvent.dragOver(uploadZone);
    fireEvent.dragLeave(uploadZone);

    expect(state.setIsDraggingFile).toHaveBeenCalledWith(true);
    expect(state.setIsDraggingFile).toHaveBeenCalledWith(false);
  });

  // Covers upload zone drop event forwarding selected files to file handler.
  it('forwards dropped files to handleFileSelect on drop', () => {
    const file = new File(['a'], 'drop.png', { type: 'image/png' });
    const { state, container } = renderPage({ isWhatsappMode: true });

    const uploadZone = container.querySelector('[role="button"][tabindex="0"]') as HTMLElement;
    fireEvent.drop(uploadZone, { dataTransfer: { files: [file] } });

    expect(state.handleFileSelect).toHaveBeenCalledWith([file]);
  });

  // Covers hidden file input change wiring to file handler.
  it('forwards file input selected files to handleFileSelect', () => {
    const file = new File(['a'], 'input.png', { type: 'image/png' });
    const { state, container } = renderPage({ isWhatsappMode: true });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(state.handleFileSelect).toHaveBeenCalledWith([file]);
  });

  // Covers browse button click propagation stop to avoid duplicate upload-zone click.
  it('invokes upload click once when Browse files button is clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderPage({ isWhatsappMode: true });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = jest.spyOn(input, 'click').mockImplementation(() => {});

    await user.click(screen.getByRole('button', { name: 'Browse files' }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  // Covers uploaded file card rendering with remove action and aria-label.
  it('renders uploaded file card and calls setUploadedMedia(null) on remove click', async () => {
    const user = userEvent.setup();
    const file = new File(['abcd'], 'upload.png', { type: 'image/png' });
    const { state } = renderPage({ isWhatsappMode: true, uploadedMedia: file });

    expect(screen.getByText('upload.png')).toBeInTheDocument();
    const remove = screen.getByRole('button', { name: 'Remove uploaded file' });
    await user.click(remove);

    expect(state.setUploadedMedia).toHaveBeenCalledWith(null);
  });

  // Covers progress visibility for active send or non-zero progress values.
  it('shows whatsapp progress when sending or progress is greater than zero', () => {
    const { rerender } = renderPage({ isWhatsappMode: true, isSendingWhatsapp: true, whatsappProgress: 0 });

    expect(screen.getByText('0% complete')).toBeInTheDocument();

    mockUseParentWhatsappInvitationPageLogic.mockReturnValue(
      createLogicState({ isWhatsappMode: true, isSendingWhatsapp: false, whatsappProgress: 55 }) as any,
    );
    rerender(<ParentWhatsappInvitationPage />);

    expect(screen.getByText('55% complete')).toBeInTheDocument();
  });

  // Covers progress hidden state when not sending and progress is zero.
  it('hides whatsapp progress when not sending and progress is zero', () => {
    renderPage({ isWhatsappMode: true, isSendingWhatsapp: false, whatsappProgress: 0 });

    expect(screen.queryByText('0% complete')).not.toBeInTheDocument();
  });

  // Covers manual feedback alert rendering and summary pill visibility.
  it('renders manual feedback and send summary pills when present', () => {
    renderPage({
      isWhatsappMode: true,
      manualFeedback: { severity: 'warning', text: 'warn text' },
      manualSendSummary: {
        attempted: 3,
        successCount: 2,
        failed: [{ mobile: '919876543210', error: { message: 'x' } }],
      },
    });

    expect(screen.getByText('warn text')).toBeInTheDocument();
    expect(screen.getByText('Attempted: 3')).toBeInTheDocument();
    expect(screen.getByText('Success: 2')).toBeInTheDocument();
    expect(screen.getByText('Failed: 1')).toBeInTheDocument();
  });

  // Covers invalid/duplicate/failure DataFrameCard rendering with populated rows.
  it('renders invalid numbers, duplicate numbers, and whatsapp failures tables when rows exist', () => {
    renderPage({
      isWhatsappMode: true,
      manualValidation: {
        normalizedPhones: ['9876543210'],
        duplicates: ['9876543210'],
        invalid: ['12345'],
      },
      manualSendSummary: {
        attempted: 1,
        successCount: 0,
        failed: [
          {
            mobile: '919876543210',
            error: {
              message: 'Failed',
              statusCode: 500,
              responseText: 'error',
            },
          },
        ],
      },
    });

    expect(screen.getByText('Invalid Numbers')).toBeInTheDocument();
    expect(screen.getByText('Duplicate Numbers')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp Failures')).toBeInTheDocument();
    expect(screen.getByText(/919876543210\|Failed\|500\|error/)).toBeInTheDocument();
  });

  // Covers analysis output rendering and send invitation button enable/disable behavior.
  it('renders analysis output and toggles send invitation button based on invite list length', () => {
    const analysisResult = {
      processedUdise: ['01111111111'],
      totalMissing: 0,
      inviteList: [],
      failedGroups: [],
    };
    const { rerender } = renderPage({
      isWhatsappMode: false,
      showMsg91Report: false,
      analysisResult,
    });

    expect(screen.getByText('Processed UDISE')).toBeInTheDocument();
    expect(screen.getByText('Total Missing Parents')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Send Invitation to Parents' }),
    ).toBeDisabled();
    expect(screen.getByText('No rows found.')).toBeInTheDocument();

    mockUseParentWhatsappInvitationPageLogic.mockReturnValue(
      createLogicState({
        isWhatsappMode: false,
        showMsg91Report: false,
        analysisResult: {
          ...analysisResult,
          inviteList: [
            {
              udise: '01111111111',
              school: 'S1',
              className: 'C1',
              mobile: '919876543210',
              inviteLink: 'https://chat.whatsapp.com/demo',
            },
          ],
        },
      }) as any,
    );
    rerender(<ParentWhatsappInvitationPage />);

    expect(
      screen.getByRole('button', { name: 'Send Invitation to Parents' }),
    ).toBeEnabled();
  });

  // Covers SMS and analysis feedback alerts plus SMS result summary pills rendering.
  it('renders analysis feedback, sms feedback, and sms summary pills when present', () => {
    renderPage({
      isWhatsappMode: false,
      showMsg91Report: false,
      analysisFeedback: { severity: 'success', text: 'analysis done' },
      smsFeedback: { severity: 'warning', text: 'sms warn' },
      smsResult: {
        successCount: 5,
        failedBatches: [
          {
            batchIndex: 1,
            recipients: ['919876543210'],
            inviteRows: [],
            error: { message: 'batch failed' },
          },
        ],
      },
    });

    expect(screen.getByText('analysis done')).toBeInTheDocument();
    expect(screen.getByText('sms warn')).toBeInTheDocument();
    expect(screen.getByText('Success Count: 5')).toBeInTheDocument();
    expect(screen.getByText('Failed Batches: 1')).toBeInTheDocument();
  });

  // Covers failed groups and failed MSG91 batches table visibility in SMS mode.
  it('renders failed groups and failed msg91 batches tables when rows exist', () => {
    renderPage({
      isWhatsappMode: false,
      showMsg91Report: false,
      analysisResult: {
        processedUdise: [],
        totalMissing: 0,
        inviteList: [],
        failedGroups: [
          {
            udise: '01111111111',
            school: 'S1',
            className: 'C1',
            groupId: 'g1',
            error: 'boom',
          },
        ],
      },
      smsResult: {
        successCount: 1,
        failedBatches: [
          {
            batchIndex: 1,
            recipients: ['919876543210'],
            error: { message: 'sms fail', statusCode: 500, responseText: 'x' },
          },
        ],
      },
    });

    expect(screen.getByText('Failed Groups')).toBeInTheDocument();
    expect(screen.getByText('Failed MSG91 Batches')).toBeInTheDocument();
  });

  // Covers MSG91 report feedback and total count rendering for data and success-empty edge case.
  it('renders report feedback and total count for report rows and success-empty edge case', () => {
    const { rerender } = renderPage({
      isWhatsappMode: false,
      showMsg91Report: true,
      reportFeedback: { severity: 'success', text: 'report loaded' },
      reportRows: [{ id: 1 }],
    });

    expect(screen.getByText('report loaded')).toBeInTheDocument();
    expect(screen.getByText('Total Count: 1')).toBeInTheDocument();
    expect(screen.getByText('MSG91 Report Rows')).toBeInTheDocument();

    mockUseParentWhatsappInvitationPageLogic.mockReturnValue(
      createLogicState({
        isWhatsappMode: false,
        showMsg91Report: true,
        reportFeedback: { severity: 'success', text: 'report loaded' },
        reportRows: [],
      }) as any,
    );
    rerender(<ParentWhatsappInvitationPage />);

    expect(screen.getByText('Total Count: 0')).toBeInTheDocument();
  });

  // Covers upload zone accessibility attributes role=button and tabIndex=0.
  it('keeps upload zone keyboard accessible with role button and tabIndex 0', () => {
    const { container } = renderPage({ isWhatsappMode: true });

    const uploadZone = container.querySelector('[role="button"][tabindex="0"]');
    expect(uploadZone).toBeInTheDocument();
  });

  // Covers toggle checked modifier CSS class for checked and unchecked states.
  it('applies checked CSS modifier class only when toggle is checked', () => {
    const { rerender } = renderPage({ isWhatsappMode: false, showMsg91Report: false });
    expect(
      document.querySelector('.parent-whatsapp-page-toggle-control--checked'),
    ).not.toBeInTheDocument();

    mockUseParentWhatsappInvitationPageLogic.mockReturnValue(
      createLogicState({ isWhatsappMode: true, showMsg91Report: false }) as any,
    );
    rerender(<ParentWhatsappInvitationPage />);
    expect(
      document.querySelector('.parent-whatsapp-page-toggle-control--checked'),
    ).toBeInTheDocument();
  });

  // Covers WhatsApp toggle re-click behavior by sending false when currently true.
  it('calls setIsWhatsappMode(false) when whatsapp toggle is clicked while checked', async () => {
    const user = userEvent.setup();
    const { state } = renderPage({ isWhatsappMode: true });
    await user.click(screen.getByRole('switch', { name: /WhatsApp/i }));
    expect(state.setIsWhatsappMode).toHaveBeenCalledWith(false);
  });

  // Covers WhatsApp send button enabled and disabled states.
  it('toggles Send WhatsApp Message button disabled state using isSendingWhatsapp', () => {
    const { rerender } = renderPage({ isWhatsappMode: true, isSendingWhatsapp: true });
    expect(
      screen.getByRole('button', { name: 'Send WhatsApp Message' }),
    ).toBeDisabled();

    mockUseParentWhatsappInvitationPageLogic.mockReturnValue(
      createLogicState({ isWhatsappMode: true, isSendingWhatsapp: false }) as any,
    );
    rerender(<ParentWhatsappInvitationPage />);
    expect(
      screen.getByRole('button', { name: 'Send WhatsApp Message' }),
    ).toBeEnabled();
  });

  // Covers absence of uploaded file info card when no file is selected.
  it('does not render uploaded file card when uploadedMedia is null', () => {
    renderPage({ isWhatsappMode: true, uploadedMedia: null });
    expect(screen.queryByRole('button', { name: 'Remove uploaded file' })).toBeNull();
  });

  // Covers hidden state for feedback and summary when both are null.
  it('hides manual feedback and summary pills when both values are null', () => {
    renderPage({
      isWhatsappMode: true,
      manualFeedback: null,
      manualSendSummary: null,
    });
    expect(screen.queryByText('Attempted:')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  // Covers invalid numbers table hidden state when invalid list is empty.
  it('does not render Invalid Numbers card when invalid list is empty', () => {
    renderPage({
      isWhatsappMode: true,
      manualValidation: { normalizedPhones: [], duplicates: [], invalid: [] },
    });
    expect(screen.queryByText('Invalid Numbers')).toBeNull();
  });

  // Covers default limit value and limit stepper/button handlers in SMS mode.
  it('renders default limit and calls setLimit through stepper and number input', () => {
    const { state } = renderPage({ isWhatsappMode: false, limit: 300 });
    expect(screen.getByDisplayValue('300')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '+' }));
    expect(state.setLimit).toHaveBeenCalledWith(expect.any(Function));

    fireEvent.click(screen.getByRole('button', { name: '-' }));
    expect(state.setLimit).toHaveBeenCalledWith(expect.any(Function));

    fireEvent.change(screen.getByDisplayValue('300'), { target: { value: '0' } });
    expect(state.setLimit).toHaveBeenCalledWith(1);
  });

  // Covers hidden analysis output when analysisResult is null.
  it('does not render analysis section when analysisResult is null', () => {
    renderPage({ isWhatsappMode: false, showMsg91Report: false, analysisResult: null });
    expect(screen.queryByText('Processed UDISE')).toBeNull();
  });

  // Covers DataFrameCard header formatting and derived columns in report table rows.
  it('renders derived report columns and formatted header labels when columns are not provided', () => {
    renderPage({
      isWhatsappMode: false,
      showMsg91Report: true,
      reportRows: [{ responseText: 'ok', status_code: 200 }],
    });
    expect(screen.getByText('Response Text')).toBeInTheDocument();
    expect(screen.getByText('Status Code')).toBeInTheDocument();
  });

  // Covers FieldBlock structure by ensuring labels and corresponding inputs are rendered together.
  it('renders FieldBlock labels with their input controls in the same block', () => {
    const { container } = renderPage({ isWhatsappMode: false, showMsg91Report: false });
    const udiseLabel = screen.getByText('Enter UDISE codes');
    const fieldBlock = udiseLabel.closest('#parent-whatsapp-page-field-block');
    expect(fieldBlock).toBeInTheDocument();
    expect(fieldBlock?.querySelector('textarea')).toBeInTheDocument();

    const reportView = createLogicState({
      isWhatsappMode: false,
      showMsg91Report: true,
    });
    mockUseParentWhatsappInvitationPageLogic.mockReturnValue(reportView as any);
    const { container: reportContainer } = render(<ParentWhatsappInvitationPage />);
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(reportContainer.querySelector('input[type="date"]')).toBeInTheDocument();
  });
});

describe('ParentWhatsappInvitationPage logic helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Covers today date output format in YYYY-MM-DD.
  it('returns today date value in YYYY-MM-DD format', () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-03-07T10:00:00.000Z'));
    expect(getTodayDateValue()).toBe('2025-03-07');
    jest.useRealTimers();
  });

  // Covers API error normalization for object payloads with all fields.
  it('maps object error shape into ParentWhatsappApiError shape', () => {
    expect(
      toApiError(
        {
          message: 'Boom',
          statusCode: 500,
          responseText: 'raw-response',
          exceptionMessage: 'stack-info',
        },
        'fallback',
      ),
    ).toEqual({
      message: 'Boom',
      statusCode: 500,
      responseText: 'raw-response',
      exceptionMessage: 'stack-info',
    });
  });

  // Covers API error normalization for Error instances.
  it('uses Error.message for plain Error instances', () => {
    expect(toApiError(new Error('Network down'), 'fallback')).toEqual({
      message: 'Network down',
      statusCode: undefined,
      responseText: undefined,
      exceptionMessage: 'Network down',
    });
  });

  // Covers API error normalization for non-object thrown values.
  it('uses fallback message and stringified exception for non-object errors', () => {
    expect(toApiError('oops', 'fallback-msg')).toEqual({
      message: 'fallback-msg',
      exceptionMessage: 'oops',
    });
  });

  // Covers API error normalization for null thrown values.
  it('uses empty exception string when thrown value is null', () => {
    expect(toApiError(null, 'fallback-msg')).toEqual({
      message: 'fallback-msg',
      exceptionMessage: '',
    });
  });

  // Covers media type detection when no file is provided.
  it('returns null media type for null file', () => {
    expect(getWhatsappMediaType(null)).toEqual({ mediaType: null });
  });

  // Covers image and video media validation for supported extensions and limits.
  it('returns valid media types for supported image and video files', () => {
    expect(getWhatsappMediaType(new File(['a'], 'a.png'))).toEqual({
      mediaType: 'image',
    });
    expect(getWhatsappMediaType(new File(['a'], 'a.jpeg'))).toEqual({
      mediaType: 'image',
    });
    expect(getWhatsappMediaType(new File(['a'], 'a.jpg'))).toEqual({
      mediaType: 'image',
    });
    expect(getWhatsappMediaType(new File(['a'], 'a.mp4'))).toEqual({
      mediaType: 'video',
    });
    expect(getWhatsappMediaType(new File(['a'], 'a.3gp'))).toEqual({
      mediaType: 'video',
    });
  });

  // Covers media validation failure for unsupported extension and oversize payloads.
  it('returns validation errors for unsupported extension or oversize media', () => {
    const tooBigImage = { name: 'big.png', size: 5 * 1024 * 1024 + 1 } as File;
    const tooBigVideo = { name: 'big.mp4', size: 16 * 1024 * 1024 + 1 } as File;

    expect(getWhatsappMediaType(tooBigImage)).toEqual(
      expect.objectContaining({ mediaType: null, error: expect.any(String) }),
    );
    expect(getWhatsappMediaType(tooBigVideo)).toEqual(
      expect.objectContaining({ mediaType: null, error: expect.any(String) }),
    );
    expect(getWhatsappMediaType(new File(['a'], 'a.pdf'))).toEqual(
      expect.objectContaining({ mediaType: null, error: expect.any(String) }),
    );
  });

  // Covers case-insensitive extension support for media validation.
  it('accepts uppercase supported extensions', () => {
    expect(getWhatsappMediaType(new File(['a'], 'A.PNG'))).toEqual({
      mediaType: 'image',
    });
  });

  // Covers cell formatting for null/undefined/empty/boolean/array/object/number/string values.
  it('formats table cell values consistently across value types', () => {
    expect(formatCellValue(null)).toBe('-');
    expect(formatCellValue(undefined)).toBe('-');
    expect(formatCellValue('')).toBe('-');
    expect(formatCellValue(true)).toBe('Yes');
    expect(formatCellValue(false)).toBe('No');
    expect(formatCellValue([1, [2, 3]])).toBe('1, 2, 3');
    expect(formatCellValue({ a: 1 })).toBe('{"a":1}');
    expect(formatCellValue(42)).toBe('42');
    expect(formatCellValue('hello')).toBe('hello');
  });

  // Covers header formatting for snake_case, camelCase, empty strings, and normalized spacing.
  it('formats header labels into readable title case', () => {
    expect(formatHeaderLabel('udise_code')).toBe('Udise Code');
    expect(formatHeaderLabel('responseText')).toBe('Response Text');
    expect(formatHeaderLabel('statusCode')).toBe('Status Code');
    expect(formatHeaderLabel('')).toBe('');
    expect(formatHeaderLabel(' many   spaces ')).toBe('Many Spaces');
  });

  // Covers file size formatting in bytes, KB, and MB units.
  it('formats file size values across B, KB, and MB boundaries', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  // Covers processed UDISE row chunking at 0, 5, 6, and 10 items.
  it('formats processed UDISE values as five-column rows', () => {
    expect(formatProcessedUdiseRows([])).toBe('-');
    expect(formatProcessedUdiseRows(['1', '2', '3', '4', '5'])).toBe(
      '1   2   3   4   5',
    );
    expect(formatProcessedUdiseRows(['1', '2', '3', '4', '5', '6'])).toBe(
      '1   2   3   4   5\n6',
    );
    expect(
      formatProcessedUdiseRows([
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
      ]),
    ).toBe('1   2   3   4   5\n6   7   8   9   10');
  });
});

describe('ParentWhatsappInvitationPage hook handlers', () => {
  const baseAnalysisResult = {
    processedUdise: ['01111111111'],
    inviteList: [
      {
        udise: '01111111111',
        school: 'Alpha School',
        className: 'Class 1',
        mobile: '919876543210',
        inviteLink: 'https://chat.whatsapp.com/demo',
      },
    ],
    failedGroups: [],
    totalMissing: 1,
  };

  const mockApi = { id: 'mock-api' };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
      apiHandler: mockApi,
    } as any);
    jest
      .spyOn(parentWhatsappInvitationService, 'processParentWhatsappUdiseCodes')
      .mockResolvedValue(baseAnalysisResult as any);
    jest
      .spyOn(parentWhatsappInvitationService, 'sendParentWhatsappMsg91Invites')
      .mockResolvedValue({ successCount: 1, failedBatches: [] } as any);
    jest
      .spyOn(parentWhatsappInvitationService, 'fetchParentWhatsappMsg91Report')
      .mockResolvedValue([{ message: 'ok' }]);
    jest
      .spyOn(parentWhatsappInvitationService, 'uploadParentWhatsappMedia')
      .mockResolvedValue('media-1');
    jest
      .spyOn(parentWhatsappInvitationService, 'sendParentWhatsappTemplateMessage')
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Covers warning feedback when analysis is triggered without configured API.
  it('sets analysis error feedback when api is missing', async () => {
    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({ apiHandler: null } as any);
    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());

    await act(async () => {
      await result.current.handleAnalyze();
    });

    expect(result.current.analysisFeedback).toEqual({
      severity: 'error',
      text: 'API service is not ready yet in this session.',
    });
  });

  // Covers warning feedback for empty or whitespace-only UDISE input.
  it('sets warning feedback for empty and whitespace-only UDISE input', async () => {
    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());

    await act(async () => {
      await result.current.handleAnalyze();
    });
    expect(result.current.analysisFeedback?.severity).toBe('warning');

    act(() => {
      result.current.setUdiseInput('  \n   ');
    });
    await act(async () => {
      await result.current.handleAnalyze();
    });
    expect(result.current.analysisFeedback?.severity).toBe('warning');
  });

  // Covers UDISE deduplication and comma/newline splitting before analysis API call.
  it('deduplicates UDISE input and sends parsed values to analysis API', async () => {
    const analyzeSpy = jest.spyOn(
      parentWhatsappInvitationService,
      'processParentWhatsappUdiseCodes',
    );
    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());

    act(() => {
      result.current.setUdiseInput('01111111111,01111111111\n02222222222');
      result.current.setLimit(300);
    });

    await act(async () => {
      await result.current.handleAnalyze();
    });

    expect(analyzeSpy).toHaveBeenCalledWith({
      api: mockApi,
      udiseCodes: ['01111111111', '02222222222'],
      limit: 300,
    });
  });

  // Covers successful analysis state updates and success feedback.
  it('sets analysis result and success feedback after successful analysis', async () => {
    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());

    act(() => {
      result.current.setUdiseInput('01111111111');
    });

    await act(async () => {
      await result.current.handleAnalyze();
    });

    expect(result.current.analysisResult).toEqual(baseAnalysisResult);
    expect(result.current.analysisFeedback).toEqual({
      severity: 'success',
      text: 'Analysis complete. 1 invite rows are ready.',
    });
  });

  // Covers analysis error feedback mapping from thrown API errors.
  it('sets analysis error feedback when analysis API throws', async () => {
    jest
      .spyOn(parentWhatsappInvitationService, 'processParentWhatsappUdiseCodes')
      .mockRejectedValueOnce(new Error('Analyze failed'));
    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());

    act(() => {
      result.current.setUdiseInput('01111111111');
    });

    await act(async () => {
      await result.current.handleAnalyze();
    });

    expect(result.current.analysisFeedback).toEqual({
      severity: 'error',
      text: 'Analyze failed',
    });
  });

  // Covers analysis loading state during request and reset after completion.
  it('toggles isAnalyzing true during request and false after completion', async () => {
    const deferred = createDeferred<typeof baseAnalysisResult>();
    jest
      .spyOn(parentWhatsappInvitationService, 'processParentWhatsappUdiseCodes')
      .mockReturnValueOnce(deferred.promise as any);

    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());

    act(() => {
      result.current.setUdiseInput('01111111111');
    });

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.handleAnalyze();
    });

    expect(result.current.isAnalyzing).toBe(true);

    await act(async () => {
      deferred.resolve(baseAnalysisResult);
      await pending;
    });

    expect(result.current.isAnalyzing).toBe(false);
  });

  // Covers SMS feedback and summary reset when analysis starts again.
  it('clears previous smsResult and smsFeedback at analyze start', async () => {
    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());

    act(() => {
      result.current.setUdiseInput('01111111111');
    });

    await act(async () => {
      await result.current.handleAnalyze();
    });
    await act(async () => {
      await result.current.handleSendSmsInvites();
    });

    expect(result.current.smsResult).not.toBeNull();
    expect(result.current.smsFeedback).not.toBeNull();

    await act(async () => {
      await result.current.handleAnalyze();
    });

    expect(result.current.smsResult).toBeNull();
    expect(result.current.smsFeedback).toBeNull();
  });

  // Covers SMS invite warning and error paths for missing API or analysis data.
  it('sets sms feedback for missing api and missing analysis result', async () => {
    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({ apiHandler: null } as any);
    const { result: missingApi } = renderHook(() =>
      useParentWhatsappInvitationPageLogicActual(),
    );
    await act(async () => {
      await missingApi.current.handleSendSmsInvites();
    });
    expect(missingApi.current.smsFeedback?.severity).toBe('error');

    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({ apiHandler: mockApi } as any);
    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());
    await act(async () => {
      await result.current.handleSendSmsInvites();
    });
    expect(result.current.smsFeedback?.severity).toBe('warning');
  });

  // Covers warning path when analysis exists but invite list is empty.
  it('sets sms warning when analysisResult.inviteList is empty', async () => {
    jest
      .spyOn(parentWhatsappInvitationService, 'processParentWhatsappUdiseCodes')
      .mockResolvedValueOnce({
        processedUdise: ['01111111111'],
        inviteList: [],
        failedGroups: [],
        totalMissing: 0,
      } as any);

    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());
    act(() => {
      result.current.setUdiseInput('01111111111');
    });
    await act(async () => {
      await result.current.handleAnalyze();
    });
    await act(async () => {
      await result.current.handleSendSmsInvites();
    });
    expect(result.current.smsFeedback?.severity).toBe('warning');
  });

  // Covers SMS invite success and warning variants based on failed batches.
  it('sets success or warning sms feedback based on failed batch count', async () => {
    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());

    act(() => {
      result.current.setUdiseInput('01111111111');
    });
    await act(async () => {
      await result.current.handleAnalyze();
    });
    await act(async () => {
      await result.current.handleSendSmsInvites();
    });

    expect(result.current.smsFeedback?.severity).toBe('success');

    jest
      .spyOn(parentWhatsappInvitationService, 'sendParentWhatsappMsg91Invites')
      .mockResolvedValueOnce({
        successCount: 1,
        failedBatches: [
          {
            batchIndex: 1,
            recipients: ['919876543210'],
            inviteRows: baseAnalysisResult.inviteList,
            error: { message: 'batch failed' },
          },
        ],
      } as any);

    await act(async () => {
      await result.current.handleSendSmsInvites();
    });

    expect(result.current.smsFeedback?.severity).toBe('warning');
  });

  // Covers report fetch warning and error paths for missing API and dates.
  it('sets report feedback for missing api and missing dates', async () => {
    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({ apiHandler: null } as any);
    const { result: missingApi } = renderHook(() =>
      useParentWhatsappInvitationPageLogicActual(),
    );
    await act(async () => {
      await missingApi.current.handleFetchReport();
    });
    expect(missingApi.current.reportFeedback?.severity).toBe('error');

    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({ apiHandler: mockApi } as any);
    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());
    act(() => {
      result.current.setStartDate('');
    });
    await act(async () => {
      await result.current.handleFetchReport();
    });
    expect(result.current.reportFeedback?.severity).toBe('warning');
  });

  // Covers report fetch success updates and error handling with loading reset.
  it('sets report rows on success and error feedback on failure', async () => {
    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());

    act(() => {
      result.current.setStartDate('2025-01-01');
      result.current.setEndDate('2025-01-31');
    });

    await act(async () => {
      await result.current.handleFetchReport();
    });

    expect(result.current.reportRows).toEqual([{ message: 'ok' }]);
    expect(result.current.reportFeedback?.severity).toBe('success');

    const deferred = createDeferred<Record<string, unknown>[]>();
    jest
      .spyOn(parentWhatsappInvitationService, 'fetchParentWhatsappMsg91Report')
      .mockReturnValueOnce(deferred.promise);

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.handleFetchReport();
    });
    expect(result.current.isLoadingReport).toBe(true);

    await act(async () => {
      deferred.reject(new Error('report failed'));
      try {
        await pending;
      } catch {
        // ignored
      }
    });

    await waitFor(() => {
      expect(result.current.reportFeedback).toEqual({
        severity: 'error',
        text: 'report failed',
      });
    });
    expect(result.current.isLoadingReport).toBe(false);
  });

  // Covers file selection handling for null, empty, single-file, and multi-file input.
  it('sets uploaded media correctly for null, empty, single, and multiple file lists', () => {
    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());
    const one = new File(['a'], 'one.png', { type: 'image/png' });
    const two = new File(['a'], 'two.png', { type: 'image/png' });

    act(() => {
      result.current.handleFileSelect(null);
    });
    expect(result.current.uploadedMedia).toBeNull();

    act(() => {
      result.current.handleFileSelect(createFileList([]));
    });
    expect(result.current.uploadedMedia).toBeNull();

    act(() => {
      result.current.handleFileSelect(createFileList([one]));
    });
    expect(result.current.uploadedMedia?.name).toBe('one.png');

    act(() => {
      result.current.handleFileSelect(createFileList([one, two]));
    });
    expect(result.current.uploadedMedia?.name).toBe('one.png');
  });

  // Covers manual validation updates when phone input changes.
  it('updates manual phone validation when phone input changes', async () => {
    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());

    act(() => {
      result.current.setPhoneInput('9876543210\n9876543210\n12345');
    });

    await waitFor(() => {
      expect(result.current.manualValidation.normalizedPhones).toEqual([
        '9876543210',
      ]);
      expect(result.current.manualValidation.duplicates).toEqual(['9876543210']);
      expect(result.current.manualValidation.invalid).toEqual(['12345']);
    });
  });

  // Covers WhatsApp send guard, validation checks, success path, and failure path.
  it('runs whatsapp send validations and updates summary for success and partial failure', async () => {
    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());

    await act(async () => {
      await result.current.handleSendWhatsapp();
    });
    expect(result.current.manualFeedback?.severity).toBe('warning');

    act(() => {
      result.current.setTemplateName('welcome_template');
      result.current.setTemplateLang('en');
      result.current.setPhoneInput('9876543210\n9876543211');
    });

    await act(async () => {
      await result.current.handleSendWhatsapp();
    });

    expect(result.current.manualFeedback?.severity).toBe('success');
    expect(result.current.manualSendSummary).toEqual({
      attempted: 2,
      successCount: 2,
      failed: [],
    });

    jest
      .spyOn(parentWhatsappInvitationService, 'sendParentWhatsappTemplateMessage')
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('template failed'));

    await act(async () => {
      await result.current.handleSendWhatsapp();
    });

    expect(result.current.manualFeedback?.severity).toBe('warning');
    expect(result.current.manualSendSummary?.failed.length).toBe(1);
  });

  // Covers WhatsApp send API-missing and template-language validation branches.
  it('returns manual feedback errors for missing api and missing template fields', async () => {
    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({ apiHandler: null } as any);
    const { result: noApi } = renderHook(() =>
      useParentWhatsappInvitationPageLogicActual(),
    );
    await act(async () => {
      await noApi.current.handleSendWhatsapp();
    });
    expect(noApi.current.manualFeedback?.severity).toBe('error');

    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({ apiHandler: mockApi } as any);
    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());
    act(() => {
      result.current.setTemplateName('welcome_template');
      result.current.setTemplateLang('');
      result.current.setPhoneInput('9876543210');
    });
    await act(async () => {
      await result.current.handleSendWhatsapp();
    });
    expect(result.current.manualFeedback?.severity).toBe('warning');
  });

  // Covers early return branch when handleSendWhatsapp is called while already sending.
  it('does not re-enter whatsapp send loop when a send is already in progress', async () => {
    const deferred = createDeferred<void>();
    jest
      .spyOn(parentWhatsappInvitationService, 'sendParentWhatsappTemplateMessage')
      .mockReturnValueOnce(deferred.promise)
      .mockResolvedValue(undefined);

    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());
    act(() => {
      result.current.setTemplateName('welcome_template');
      result.current.setTemplateLang('en');
      result.current.setPhoneInput('9876543210');
    });

    let firstRun!: Promise<void>;
    act(() => {
      firstRun = result.current.handleSendWhatsapp();
    });

    await waitFor(() => {
      expect(result.current.isSendingWhatsapp).toBe(true);
    });

    await act(async () => {
      await result.current.handleSendWhatsapp();
    });

    expect(
      parentWhatsappInvitationService.sendParentWhatsappTemplateMessage,
    ).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve();
      await firstRun;
    });
  });

  // Covers WhatsApp send warning branch for over-1000 unique phone inputs.
  it('shows warning when more than 1000 unique phone numbers are provided', async () => {
    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());
    const phones = Array.from({ length: 1001 }, (_, index) => {
      const suffix = String(100000000 + index).padStart(9, '0');
      return `9${suffix}`;
    }).join('\n');

    act(() => {
      result.current.setTemplateName('welcome_template');
      result.current.setTemplateLang('en');
      result.current.setPhoneInput(phones);
    });

    await act(async () => {
      await result.current.handleSendWhatsapp();
    });

    expect(result.current.manualFeedback?.severity).toBe('warning');
    expect(result.current.manualFeedback?.text).toContain('1000');
  });

  // Covers WhatsApp send warning when no valid phone numbers are present.
  it('shows warning when no valid Indian mobile numbers are provided', async () => {
    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());
    act(() => {
      result.current.setTemplateName('welcome_template');
      result.current.setTemplateLang('en');
      result.current.setPhoneInput('12345');
    });
    await act(async () => {
      await result.current.handleSendWhatsapp();
    });
    expect(result.current.manualFeedback?.severity).toBe('warning');
  });

  // Covers invalid-media, upload-failure, and no-media-upload branches for WhatsApp send.
  it('handles invalid media, media upload failure, and no-media send branches', async () => {
    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());

    act(() => {
      result.current.setTemplateName('welcome_template');
      result.current.setTemplateLang('en');
      result.current.setPhoneInput('9876543210');
      result.current.setUploadedMedia(new File(['a'], 'invalid.pdf'));
    });
    await act(async () => {
      await result.current.handleSendWhatsapp();
    });
    expect(result.current.manualFeedback?.severity).toBe('error');

    jest
      .spyOn(parentWhatsappInvitationService, 'uploadParentWhatsappMedia')
      .mockRejectedValueOnce(new Error('upload failed'));
    act(() => {
      result.current.setUploadedMedia(new File(['a'], 'ok.png', { type: 'image/png' }));
    });
    await act(async () => {
      await result.current.handleSendWhatsapp();
    });
    expect(result.current.manualFeedback?.text).toBe('upload failed');

    const uploadSpy = jest.spyOn(
      parentWhatsappInvitationService,
      'uploadParentWhatsappMedia',
    );
    uploadSpy.mockClear();
    act(() => {
      result.current.setUploadedMedia(null);
    });
    await act(async () => {
      await result.current.handleSendWhatsapp();
    });
    expect(uploadSpy).not.toHaveBeenCalled();
  });

  // Covers SMS send thrown error branch and loading reset in handleSendSmsInvites.
  it('sets sms error feedback when sendParentWhatsappMsg91Invites throws', async () => {
    jest
      .spyOn(parentWhatsappInvitationService, 'sendParentWhatsappMsg91Invites')
      .mockRejectedValueOnce(new Error('sms send failed'));
    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());

    act(() => {
      result.current.setUdiseInput('01111111111');
    });
    await act(async () => {
      await result.current.handleAnalyze();
    });
    await act(async () => {
      await result.current.handleSendSmsInvites();
    });

    expect(result.current.smsFeedback?.severity).toBe('error');
    expect(result.current.smsFeedback?.text).toBe('sms send failed');
    expect(result.current.isSendingSms).toBe(false);
  });

  // Covers report warning branch for missing end date specifically.
  it('sets warning report feedback when endDate is empty', async () => {
    const { result } = renderHook(() => useParentWhatsappInvitationPageLogicActual());
    act(() => {
      result.current.setStartDate('2025-01-01');
      result.current.setEndDate('');
    });
    await act(async () => {
      await result.current.handleFetchReport();
    });
    expect(result.current.reportFeedback?.severity).toBe('warning');
  });
});

describe('ParentWhatsappInvitationPage service exports', () => {
  const createApiMock = () => ({
    getParentWhatsappSchoolByUdise: jest.fn(),
    getParentWhatsappClassesBySchoolId: jest.fn(),
    getParentWhatsappGroupDetails: jest.fn(),
    getParentWhatsappParentPhonesByClassId: jest.fn(),
    getParentWhatsappMsg91ReportRows: jest.fn(),
    getParentWhatsappMsg91SendResult: jest.fn(),
    uploadParentWhatsappMediaRpc: jest.fn(),
    sendParentWhatsappTemplateMessageRpc: jest.fn(),
  });

  const createMockFile = (
    name: string,
    type = 'image/png',
    content = 'hello',
  ) => {
    const file = new File([content], name, { type });
    if (!file.arrayBuffer) {
      Object.defineProperty(file, 'arrayBuffer', {
        value: async () =>
          Uint8Array.from(
            Array.from(content).map((character) => character.charCodeAt(0)),
          ).buffer,
      });
    }
    return file;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Covers static config status payload with all feature flags enabled.
  it('returns all parent whatsapp config flags as true', () => {
    expect(parentWhatsappInvitationService.getParentWhatsappConfigStatus()).toEqual(
      {
        hasMsg91Send: true,
        hasMsg91Report: true,
        hasWhatsappMediaUpload: true,
        hasWhatsappTemplateSend: true,
      },
    );
  });

  // Covers UDISE processing skip and success paths for analysis output.
  it('handles UDISE analysis skips and builds invite rows for missing parents', async () => {
    const api = createApiMock();
    const invalidResult =
      await parentWhatsappInvitationService.processParentWhatsappUdiseCodes({
        api: api as any,
        udiseCodes: ['abc'],
        limit: 10,
      });
    expect(invalidResult.totalMissing).toBe(0);

    api.getParentWhatsappSchoolByUdise.mockResolvedValue({
      id: 'school-1',
      name: 'School 1',
    });
    api.getParentWhatsappClassesBySchoolId.mockResolvedValue([
      {
        id: 'class-1',
        name: 'Class 1',
        group_id: 'group-1',
        whatsapp_invite_link: 'https://chat.whatsapp.com/invite-1',
      },
    ]);
    api.getParentWhatsappGroupDetails.mockResolvedValue({
      data: { participants: ['919876543210@c.us'] },
    });
    api.getParentWhatsappParentPhonesByClassId.mockResolvedValue([
      '919876543210',
      '919876543211',
    ]);

    const result = await parentWhatsappInvitationService.processParentWhatsappUdiseCodes(
      {
        api: api as any,
        udiseCodes: ['1234567890'],
        limit: 10,
      },
    );

    expect(result.inviteList).toHaveLength(1);
    expect(result.inviteList[0].mobile).toBe('919876543211');
  });

  // Covers analysis behavior for missing group id, failed group fetch, and limit break.
  it('handles class/group edge cases and limit stop while analyzing', async () => {
    const failedApi = createApiMock();
    failedApi.getParentWhatsappSchoolByUdise.mockResolvedValue({
      id: 'school-1',
      name: 'School 1',
    });
    failedApi.getParentWhatsappClassesBySchoolId.mockResolvedValue([
      { id: 'class-1', name: 'Class 1', group_id: null },
      { id: 'class-2', name: 'Class 2', group_id: 'g2' },
    ]);
    failedApi.getParentWhatsappGroupDetails.mockRejectedValueOnce(
      new Error('group failed'),
    );
    failedApi.getParentWhatsappParentPhonesByClassId.mockResolvedValue([
      '919876543210',
      '919876543211',
    ]);

    const failed = await parentWhatsappInvitationService.processParentWhatsappUdiseCodes(
      {
        api: failedApi as any,
        udiseCodes: ['1234567890'],
        limit: 10,
      },
    );
    expect(failed.failedGroups.length).toBeGreaterThan(0);

    const limitedApi = createApiMock();
    limitedApi.getParentWhatsappSchoolByUdise.mockResolvedValue({
      id: 'school-1',
      name: 'School 1',
    });
    limitedApi.getParentWhatsappClassesBySchoolId.mockResolvedValue([
      {
        id: 'class-1',
        name: 'Class 1',
        group_id: 'group-1',
        whatsapp_invite_link: 'https://chat.whatsapp.com/invite-1',
      },
    ]);
    limitedApi.getParentWhatsappGroupDetails.mockResolvedValue({
      data: { participants: [] },
    });
    limitedApi.getParentWhatsappParentPhonesByClassId.mockResolvedValue([
      '919876543210',
      '919876543211',
    ]);

    const limited =
      await parentWhatsappInvitationService.processParentWhatsappUdiseCodes({
        api: limitedApi as any,
        udiseCodes: ['1234567890', '2234567890'],
        limit: 1,
      });
    expect(limited.inviteList).toHaveLength(1);
  });

  // Covers report fetch failure payload and supported success response data shapes.
  it('handles report fetch failure and supported result shapes', async () => {
    const api = createApiMock();
    api.getParentWhatsappMsg91ReportRows.mockResolvedValueOnce({
      success: false,
      statusCode: 500,
      responseText: 'failed',
    });
    await expect(
      parentWhatsappInvitationService.fetchParentWhatsappMsg91Report({
        api: api as any,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      }),
    ).rejects.toEqual(
      expect.objectContaining({ statusCode: 500, responseText: 'failed' }),
    );

    api.getParentWhatsappMsg91ReportRows.mockResolvedValueOnce({
      success: true,
      data: [{ id: 1 }],
    });
    expect(
      await parentWhatsappInvitationService.fetchParentWhatsappMsg91Report({
        api: api as any,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      }),
    ).toEqual([{ id: 1 }]);

    api.getParentWhatsappMsg91ReportRows.mockResolvedValueOnce({
      raw: { data: [{ id: 2 }] },
    });
    expect(
      await parentWhatsappInvitationService.fetchParentWhatsappMsg91Report({
        api: api as any,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      }),
    ).toEqual([{ id: 2 }]);
  });

  // Covers remaining report response shapes: raw array, no shape fallback, and missing success flag.
  it('handles raw-array and fallback report payload shapes', async () => {
    const api = createApiMock();
    api.getParentWhatsappMsg91ReportRows.mockResolvedValueOnce({ raw: [{ id: 9 }] });
    expect(
      await parentWhatsappInvitationService.fetchParentWhatsappMsg91Report({
        api: api as any,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      }),
    ).toEqual([{ id: 9 }]);

    api.getParentWhatsappMsg91ReportRows.mockResolvedValueOnce({ success: true });
    expect(
      await parentWhatsappInvitationService.fetchParentWhatsappMsg91Report({
        api: api as any,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      }),
    ).toEqual([]);

    api.getParentWhatsappMsg91ReportRows.mockResolvedValueOnce({ data: [{ id: 3 }] });
    expect(
      await parentWhatsappInvitationService.fetchParentWhatsappMsg91Report({
        api: api as any,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      }),
    ).toEqual([{ id: 3 }]);
  });

  // Covers MSG91 invite send mappings for empty input, successCount clamping, and failed batch fallback.
  it('maps send invite response with success counts and failed batch fallbacks', async () => {
    const api = createApiMock();
    expect(
      await parentWhatsappInvitationService.sendParentWhatsappMsg91Invites(
        api as any,
        [],
      ),
    ).toEqual({ successCount: 0, failedBatches: [] });

    const inviteRows = [
      {
        udise: '1',
        school: 'S1',
        className: 'C1',
        mobile: '919876543210',
        inviteLink: 'link',
      },
    ];
    api.getParentWhatsappMsg91SendResult.mockResolvedValueOnce({
      successCount: -5,
      failedBatches: [{ batchIndex: 'invalid' }],
    });

    const mapped = await parentWhatsappInvitationService.sendParentWhatsappMsg91Invites(
      api as any,
      inviteRows,
    );
    expect(mapped.successCount).toBe(0);
    expect(mapped.failedBatches[0].batchIndex).toBe(1);
    expect(mapped.failedBatches[0].recipients).toEqual(['919876543210']);
  });

  // Covers failed-batch recipient mapping using explicit recipients and no-failure fallback.
  it('maps explicit recipients and supports no failedBatches payload', async () => {
    const api = createApiMock();
    const inviteRows = [
      {
        udise: '1',
        school: 'S1',
        className: 'C1',
        mobile: '919876543210',
        inviteLink: 'link',
      },
      {
        udise: '1',
        school: 'S1',
        className: 'C1',
        mobile: '919876543211',
        inviteLink: 'link',
      },
    ];

    api.getParentWhatsappMsg91SendResult.mockResolvedValueOnce({
      successCount: 2,
      failedBatches: [
        { batchIndex: 1, recipients: ['919000000000'], error: { message: 'x' } },
      ],
    });

    const withRecipients =
      await parentWhatsappInvitationService.sendParentWhatsappMsg91Invites(
        api as any,
        inviteRows,
      );
    expect(withRecipients.failedBatches[0].recipients).toEqual(['919000000000']);

    api.getParentWhatsappMsg91SendResult.mockResolvedValueOnce({ successCount: 2 });
    const noFailures =
      await parentWhatsappInvitationService.sendParentWhatsappMsg91Invites(
        api as any,
        inviteRows,
      );
    expect(noFailures.failedBatches).toEqual([]);
  });

  // Covers media upload success id extraction, mime fallback, and failure branches.
  it('handles media upload success ids, mime fallback, and failure branches', async () => {
    const api = createApiMock();

    api.uploadParentWhatsappMediaRpc.mockResolvedValueOnce({
      success: false,
      statusCode: 500,
      responseText: 'upload-failed',
    });
    await expect(
      parentWhatsappInvitationService.uploadParentWhatsappMedia(
        api as any,
        createMockFile('a.png'),
      ),
    ).rejects.toEqual(
      expect.objectContaining({ statusCode: 500, responseText: 'upload-failed' }),
    );

    api.uploadParentWhatsappMediaRpc.mockResolvedValueOnce({ id: 'id-1' });
    await expect(
      parentWhatsappInvitationService.uploadParentWhatsappMedia(
        api as any,
        createMockFile('b.png'),
      ),
    ).resolves.toBe('id-1');

    api.uploadParentWhatsappMediaRpc.mockResolvedValueOnce({ mediaId: 'id-2' });
    await expect(
      parentWhatsappInvitationService.uploadParentWhatsappMedia(
        api as any,
        createMockFile('b2.png'),
      ),
    ).resolves.toBe('id-2');

    api.uploadParentWhatsappMediaRpc.mockResolvedValueOnce({ raw: { id: 'id-3' } });
    await expect(
      parentWhatsappInvitationService.uploadParentWhatsappMedia(
        api as any,
        createMockFile('b3.png'),
      ),
    ).resolves.toBe('id-3');

    api.uploadParentWhatsappMediaRpc.mockResolvedValueOnce({ success: true, raw: {} });
    await expect(
      parentWhatsappInvitationService.uploadParentWhatsappMedia(
        api as any,
        createMockFile('c.png'),
      ),
    ).rejects.toEqual(
      expect.objectContaining({
        message:
          'WhatsApp media upload succeeded but no media id was returned.',
      }),
    );

    api.uploadParentWhatsappMediaRpc.mockResolvedValueOnce({ id: 'fallback-id' });
    const file = createMockFile('no-type.bin', '', 'abc');
    await parentWhatsappInvitationService.uploadParentWhatsappMedia(api as any, file);
    expect(api.uploadParentWhatsappMediaRpc).toHaveBeenCalledWith(
      expect.any(String),
      'no-type.bin',
      'application/octet-stream',
    );
  });

  // Covers template send success and failure branches with media params.
  it('handles template send success and failure with media param pass-through', async () => {
    const api = createApiMock();
    api.sendParentWhatsappTemplateMessageRpc.mockResolvedValueOnce({
      success: true,
    });
    await expect(
      parentWhatsappInvitationService.sendParentWhatsappTemplateMessage(api as any, {
        to: '919876543210',
        templateName: 'welcome',
        templateLang: 'en',
        messageType: 'utility',
        mediaId: 'media-1',
        mediaType: 'image',
      }),
    ).resolves.toBeUndefined();

    api.sendParentWhatsappTemplateMessageRpc.mockResolvedValueOnce({
      success: false,
      statusCode: 400,
      responseText: 'bad request',
      raw: { error: 'invalid' },
    });
    await expect(
      parentWhatsappInvitationService.sendParentWhatsappTemplateMessage(api as any, {
        to: '919876543211',
        templateName: 'welcome',
        templateLang: 'en',
        messageType: 'utility',
      }),
    ).rejects.toEqual(
      expect.objectContaining({ statusCode: 400, responseText: 'bad request' }),
    );

    api.sendParentWhatsappTemplateMessageRpc.mockResolvedValueOnce({});
    await expect(
      parentWhatsappInvitationService.sendParentWhatsappTemplateMessage(api as any, {
        to: '919876543212',
        templateName: 'welcome',
        templateLang: 'en',
        messageType: 'marketing',
        mediaId: null,
        mediaType: null,
      }),
    ).resolves.toBeUndefined();
    expect(api.sendParentWhatsappTemplateMessageRpc).toHaveBeenCalledWith(
      expect.objectContaining({ mediaId: null, mediaType: null }),
    );
  });

  // Covers skip branch when SMS formatter returns null.
  it('skips invite rows when SMS formatter returns null', async () => {
    const api = createApiMock();
    jest
      .spyOn(phoneNormalization, 'formatSmsReadyIndianPhone')
      .mockReturnValueOnce(null);

    api.getParentWhatsappSchoolByUdise.mockResolvedValue({
      id: 'school-1',
      name: 'School 1',
    });
    api.getParentWhatsappClassesBySchoolId.mockResolvedValue([
      {
        id: 'class-1',
        name: 'Class 1',
        group_id: 'group-1',
        whatsapp_invite_link: 'https://chat.whatsapp.com/link',
      },
    ]);
    api.getParentWhatsappGroupDetails.mockResolvedValue({
      data: { participants: [] },
    });
    api.getParentWhatsappParentPhonesByClassId.mockResolvedValue([
      '919876543210',
    ]);

    const result =
      await parentWhatsappInvitationService.processParentWhatsappUdiseCodes({
        api: api as any,
        udiseCodes: ['1234567890'],
        limit: 10,
      });

    expect(result.inviteList).toEqual([]);
  });
});
