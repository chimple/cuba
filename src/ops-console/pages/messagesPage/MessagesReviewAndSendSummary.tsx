import React from 'react';
import { Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type SummaryItem = { label: string; value: string };

type MessagesReviewAndSendSummaryProps = {
  audienceSummaryItems: SummaryItem[];
  notificationSummaryItems: SummaryItem[];
  notificationImageUrl: string;
  onEditAudience: () => void;
  onEditNotification: () => void;
};

const MessagesReviewAndSendSummary: React.FC<
  MessagesReviewAndSendSummaryProps
> = ({
  audienceSummaryItems,
  notificationSummaryItems,
  notificationImageUrl,
  onEditAudience,
  onEditNotification,
}) => {
  const { t } = useTranslation();

  return (
    <div className="messages-review-send__summary-column">
      <section className="messages-review-send__summary-card messages-review-send__audience-summary-card">
        <div className="messages-review-send__summary-card-header">
          <div className="messages-review-send__card-title-row">
            <Typography
              variant="h2"
              className="messages-review-send__card-heading"
            >
              {t('Audience Summary')}
            </Typography>
            <Button
              type="button"
              variant="outlined"
              size="small"
              className="messages-review-send__inline-edit-button"
              onClick={onEditAudience}
            >
              {t('Edit')}
            </Button>
          </div>
        </div>
        <dl className="messages-review-send__summary-list">
          {audienceSummaryItems.map((item) => {
            const isEstimatedCount = item.label === 'Estimated Recipient Count';
            if (isEstimatedCount) {
              return (
                <div
                  key={item.label}
                  className="messages-review-send__summary-estimated-row"
                >
                  <span>{`${t(item.label)}:`}</span>
                  <strong>{item.value}</strong>
                </div>
              );
            }
            return (
              <React.Fragment key={item.label}>
                <dt>{`${t(item.label)}:`}</dt>
                <dd>{item.value}</dd>
              </React.Fragment>
            );
          })}
        </dl>
      </section>

      <section className="messages-review-send__summary-card messages-review-send__notification-summary-card">
        <div className="messages-review-send__summary-card-header">
          <div className="messages-review-send__card-title-row">
            <Typography
              variant="h2"
              className="messages-review-send__card-heading"
            >
              {t('Notification Summary')}
            </Typography>
            <Button
              type="button"
              variant="outlined"
              size="small"
              className="messages-review-send__inline-edit-button"
              onClick={onEditNotification}
            >
              {t('Edit')}
            </Button>
          </div>
        </div>
        <dl className="messages-review-send__summary-list">
          {notificationSummaryItems.map((item) => {
            const isAttachmentStatus = item.label === 'Attached Image';
            const isAttachedValue =
              isAttachmentStatus && item.value === 'Attached';
            return (
              <React.Fragment key={item.label}>
                <dt
                  className={
                    isAttachmentStatus && item.value !== 'Not attached'
                      ? 'messages-review-send__summary-label--attached'
                      : undefined
                  }
                >
                  {`${t(item.label)}:`}
                </dt>
                <dd>
                  <span
                    className={[
                      isAttachedValue
                        ? 'messages-review-send__summary-value--attached'
                        : undefined,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {isAttachmentStatus
                      ? item.value === 'Attached'
                        ? t('Attached')
                        : t('Not attached')
                      : item.value}
                  </span>
                </dd>
              </React.Fragment>
            );
          })}
        </dl>
      </section>
    </div>
  );
};

export default MessagesReviewAndSendSummary;
