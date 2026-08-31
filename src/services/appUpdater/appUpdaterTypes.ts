// --------------
// INTERNAL TYPES
// --------------

/** The checksum of a single file. */
export type ChecksumFile = {
  /** The relative path to the file in the checksum package. */
  path: string;

  /** The unique file hash based on it's contents. */
  hash: string;
};

/** The checksum of a package of files. */
export type Checksum = {
  /** The unique identifier of the checksum. */
  id: string;

  /** The date the checksum was generated. */
  timestamp: Date;

  /** The package of files. */
  files: ChecksumFile[];
};

/** The details of a release. */
export type Release = {
  /** The unique identifier of the release. */
  id: string;

  /** The date of the release. */
  updated: Date;

  /** The release checksum. */
  checksum: Checksum;
};

export enum HotUpdateStatus {
  CHECKING_FOR_UPDATE = 'Checking for an update',
  COPY_FROM_BUNDLE = 'Getting ready for an update in the background',
  FOUND_UPDATE = 'Found a new update',
  DOWNLOADING_THE_UPDATES = 'Downloading the latest updates',
  ALREADY_UPDATED = 'Already on the latest version',
  ERROR = 'Something went wrong',
}
