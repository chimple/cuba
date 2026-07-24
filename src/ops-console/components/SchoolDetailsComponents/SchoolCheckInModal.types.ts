import type { DefaultTFuncReturn } from 'i18next';
import type { SchoolVisitAction, SchoolVisitType } from '../../../common/constants';

export interface SchoolCheckInModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (
    lat?: number,
    lng?: number,
    distance?: number,
    numberOfParents?: number,
  ) => void;
  status: SchoolVisitAction;
  visitType?: SchoolVisitType;
  schoolName: string;
  isFirstTime?: boolean;
  schoolId?: string;
  schoolLocation?: { lat: number; lng: number };
  schoolAddress?: string;
  onLocationUpdated?: () => void;
}

export interface TargetLocation {
  lat: number;
  lng: number;
  address1: DefaultTFuncReturn;
  address2?: DefaultTFuncReturn;
  isMissing?: boolean;
}

export type LatLng = { lat: number; lng: number };
