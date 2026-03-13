import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { t } from "i18next";
import "./MediaDisplay.css";

export interface MediaItem {
  url: string;
  type: "image" | "video";
}

interface Props {
  id: string;
  label: string;
  media: MediaItem[];
}

const MediaSection: React.FC<Props> = ({ id, label, media }) => {
  const [open, setOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const handleClick = (item: MediaItem) => {
    setSelectedMedia(item);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedMedia(null);
  };

  return (
    <>
      <Box
        id={`${id}-container`}
        data-testid={`${id}-container`}
        className="media-section"
      >
        {/* LABEL */}
        <Typography
          id={`${id}-label`}
          data-testid={`${id}-label`}
          className="media-section-label"
        >
          {label}
        </Typography>

        {/* SAME GREY BOX AS TECH ISSUE */}
        <Paper
          id={`${id}-box`}
          data-testid={`${id}-box`}
          elevation={0}
          className="media-section-box"
        >
          {media && media.length > 0 ? (
            <div
              id={`${id}-grid`}
              data-testid={`${id}-grid`}
              className="media-grid"
            >
              {media.map((item, index) => (
                <div
                  key={index}
                  id={`${id}-thumb-${index}`}
                  data-testid={`${id}-thumb-${index}`}
                  className="media-thumb"
                  onClick={() => handleClick(item)}
                >
                  {item.type === "image" ? (
                    <img
                      id={`${id}-img-${index}`}
                      data-testid={`${id}-img-${index}`}
                      src={item.url}
                      alt={`Media ${index + 1}`}
                    />
                  ) : (
                    <video
                      id={`${id}-video-${index}`}
                      data-testid={`${id}-video-${index}`}
                      src={item.url}
                      muted
                      preload="metadata"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              id={`${id}-empty`}
              data-testid={`${id}-empty`}
              className="media-section-empty"
            >
              --
            </div>
          )}
        </Paper>
      </Box>

      {/* PREVIEW DIALOG */}
      <Dialog
        id={`${id}-dialog`}
        data-testid={`${id}-dialog`}
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogContent
          id={`${id}-dialog-content`}
          data-testid={`${id}-dialog-content`}
          className="media-dialog-content"
        >
          {selectedMedia?.type === "image" ? (
            <img
              id={`${id}-dialog-image`}
              data-testid={`${id}-dialog-image`}
              src={selectedMedia.url}
              alt="Full size"
              className="media-full"
            />
          ) : selectedMedia ? (
            <video
              id={`${id}-dialog-video`}
              data-testid={`${id}-dialog-video`}
              src={selectedMedia.url}
              controls
              className="media-full"
            />
          ) : null}
        </DialogContent>

        <DialogActions
          id={`${id}-dialog-actions`}
          data-testid={`${id}-dialog-actions`}
        >
          <Button
            id={`${id}-dialog-close`}
            data-testid={`${id}-dialog-close`}
            onClick={handleClose}
          >
            {t("Close")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MediaSection;
