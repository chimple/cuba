import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  getStepFromSearch,
  PushNotificationHeader,
  PushNotificationLivePreview,
  PushNotificationStepPlaceholder,
  type PushNotificationDraft,
} from './PushNotificationComposeComponents';
import { PushNotificationFields } from './PushNotificationComposeForm';

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

const baseDraft: PushNotificationDraft = {
  label: '',
  title: '',
  body: '',
  imageName: '',
  imageUrl: '',
};

describe('PushNotificationComposeComponents', () => {
  it('uses public asset icons for preview and upload controls', () => {
    const fileInputRef = React.createRef<HTMLInputElement>();
    render(
      <>
        <PushNotificationHeader onBack={jest.fn()} />
        <PushNotificationLivePreview
          title="Homework"
          body="Complete your lesson."
          imageUrl=""
        />
        <PushNotificationFields
          draft={baseDraft}
          fileInputRef={fileInputRef}
          labelOptions={['Homework']}
          loadingLabels={false}
          onDraftChange={jest.fn()}
          onImageChange={jest.fn()}
        />
      </>,
    );

    expect(
      screen.getByTestId('push-notification-preview-app-icon'),
    ).toHaveAttribute('src', '/assets/icons/ChimpLogo.png');
    expect(screen.getByTestId('push-notification-upload-icon')).toHaveAttribute(
      'src',
      '/assets/icons/upload.svg',
    );
    expect(
      screen.getByTestId('push-notification-preview-image-placeholder'),
    ).toBeInTheDocument();
  });

  it('updates draft when fields change', () => {
    const fileInputRef = React.createRef<HTMLInputElement>();
    const onDraftChange = jest.fn();
    render(
      <PushNotificationFields
        draft={baseDraft}
        fileInputRef={fileInputRef}
        labelOptions={['Homework']}
        loadingLabels={false}
        onDraftChange={onDraftChange}
        onImageChange={jest.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('Enter notification title'), {
      target: { value: 'Festival Homework' },
    });

    expect(onDraftChange).toHaveBeenCalledWith({
      ...baseDraft,
      title: 'Festival Homework',
    });
  });

  it('filters and selects existing labels by search text', () => {
    const fileInputRef = React.createRef<HTMLInputElement>();
    const onDraftChange = jest.fn();
    render(
      <PushNotificationFields
        draft={baseDraft}
        fileInputRef={fileInputRef}
        labelOptions={['Homework', 'Reminder']}
        loadingLabels={false}
        onDraftChange={onDraftChange}
        onImageChange={jest.fn()}
      />,
    );

    const labelInput = screen.getByPlaceholderText('Search or enter a label');
    fireEvent.change(labelInput, { target: { value: 'home' } });

    expect(
      screen.getByRole('option', { name: 'Homework' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Reminder')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('option', { name: 'Homework' }));

    expect(onDraftChange).toHaveBeenCalledWith({
      ...baseDraft,
      label: 'Homework',
    });
  });

  it('accepts a new label when no existing label matches', () => {
    const fileInputRef = React.createRef<HTMLInputElement>();
    const onDraftChange = jest.fn();
    render(
      <PushNotificationFields
        draft={baseDraft}
        fileInputRef={fileInputRef}
        labelOptions={['Homework', 'Reminder']}
        loadingLabels={false}
        onDraftChange={onDraftChange}
        onImageChange={jest.fn()}
      />,
    );

    const labelInput = screen.getByPlaceholderText('Search or enter a label');
    fireEvent.change(labelInput, { target: { value: 'Festival' } });

    expect(screen.queryByText('Homework')).not.toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Festival' }),
    ).toBeInTheDocument();

    fireEvent.keyDown(labelInput, { key: 'Enter' });

    expect(onDraftChange).toHaveBeenCalledWith({
      ...baseDraft,
      label: 'Festival',
    });
  });

  it('renders live preview content and image', () => {
    render(
      <PushNotificationLivePreview
        title="Homework"
        body="Complete your lesson."
        imageUrl="blob:lesson"
      />,
    );

    expect(screen.queryByText('9:41')).not.toBeInTheDocument();
    expect(screen.getByText('Chimple')).toBeInTheDocument();
    expect(screen.getByText('Homework')).toBeInTheDocument();
    expect(screen.getByText('Complete your lesson.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Image Preview' })).toHaveAttribute(
      'src',
      'blob:lesson',
    );
  });

  it('renders review placeholder with draft values', () => {
    render(
      <PushNotificationStepPlaceholder
        step={3}
        draft={{
          ...baseDraft,
          label: 'Homework',
          title: 'Title',
          body: 'Body',
        }}
      />,
    );

    expect(screen.getByText('Review & Send')).toBeInTheDocument();
    expect(screen.getByText('Homework')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('normalizes valid and invalid step query params', () => {
    expect(getStepFromSearch('?step=1')).toBe(1);
    expect(getStepFromSearch('?step=3')).toBe(3);
    expect(getStepFromSearch('?step=8')).toBe(2);
  });
});
