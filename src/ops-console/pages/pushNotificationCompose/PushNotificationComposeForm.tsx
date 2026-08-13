import React from 'react';
import {
  Autocomplete,
  Box,
  Button,
  createFilterOptions,
  TextField,
  Typography,
} from '@mui/material';
import { t } from 'i18next';
import {
  BODY_LIMIT,
  TITLE_LIMIT,
  type PushNotificationDraft,
} from './PushNotificationComposeComponents';

type PushNotificationFieldsProps = {
  draft: PushNotificationDraft;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  labelOptions: string[];
  loadingLabels: boolean;
  onDraftChange: (draft: PushNotificationDraft) => void;
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <Typography className="push-notification-label">{children}</Typography>
);

const RequiredLabel = ({ label }: { label: string }) => (
  <FieldLabel>
    {t(label)} <span>*</span>
  </FieldLabel>
);

const filterLabelOptions = createFilterOptions<string>();

export const PushNotificationFields: React.FC<PushNotificationFieldsProps> = ({
  draft,
  fileInputRef,
  labelOptions,
  loadingLabels,
  onDraftChange,
  onImageChange,
}) => (
  <Box className="push-notification-fields-card">
    <Box className="push-notification-field">
      <RequiredLabel label="Choose Label" />
      <Autocomplete
        autoSelect
        freeSolo
        options={labelOptions}
        value={draft.label}
        loading={loadingLabels}
        disabled={loadingLabels}
        filterOptions={(options, params) => {
          const filtered = filterLabelOptions(options, params);
          const enteredLabel = params.inputValue.trim();

          return filtered.length === 0 && enteredLabel
            ? [enteredLabel]
            : filtered;
        }}
        onChange={(_, label) =>
          onDraftChange({ ...draft, label: label?.trim() ?? '' })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            size="small"
            placeholder={String(
              t(
                loadingLabels ? 'Loading labels...' : 'Search or enter a label',
              ),
            )}
          />
        )}
      />
    </Box>
    <Box className="push-notification-field">
      <RequiredLabel label="Notification Title" />
      <TextField
        fullWidth
        size="small"
        placeholder={String(t('Enter notification title'))}
        value={draft.title}
        inputProps={{ maxLength: TITLE_LIMIT }}
        helperText={`${draft.title.length} / ${TITLE_LIMIT} ${t('characters')}`}
        onChange={(event) =>
          onDraftChange({ ...draft, title: event.target.value })
        }
      />
    </Box>
    <Box className="push-notification-field push-notification-body-field">
      <RequiredLabel label="Notification Body" />
      <TextField
        className="push-notification-body-input"
        fullWidth
        multiline
        minRows={1}
        size="small"
        placeholder={String(
          t("e.g. Don't forget to complete today's assignment."),
        )}
        value={draft.body}
        inputProps={{ maxLength: BODY_LIMIT }}
        helperText={`${draft.body.length} / ${BODY_LIMIT} ${t('characters')}`}
        onChange={(event) =>
          onDraftChange({ ...draft, body: event.target.value })
        }
      />
    </Box>
    <Box className="push-notification-field">
      <FieldLabel>{t('Upload Image')}</FieldLabel>
      <input
        ref={fileInputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={onImageChange}
      />
      <Button
        fullWidth
        className="push-notification-upload"
        startIcon={
          <img
            alt=""
            className="push-notification-upload-icon"
            data-testid="push-notification-upload-icon"
            src="/assets/icons/upload.svg"
          />
        }
        onClick={() => fileInputRef.current?.click()}
      >
        {draft.imageName || t('Click to upload images')}
      </Button>
    </Box>
  </Box>
);
