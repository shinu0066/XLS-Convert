import type { Timestamp, FieldValue } from 'firebase/firestore';

export type PopupType = 'bottom' | 'top-navbar' | 'center-screen';

export interface PopupConfig {
  id: string; // e.g., 'bottomPopup', 'topNavbarPopup', 'centerScreenPopup'
  type: PopupType;
  enabled: boolean;
  title?: string;
  message: string;
  ctaText?: string;
  ctaLink?: string;
  delaySeconds?: number; // For center popup, in seconds
  lastUpdated?: Timestamp | FieldValue; // Firestore serverTimestamp or Timestamp
}

// Defines the structure for storing all popup configurations together
export interface AllPopupSettings {
  bottomPopup: PopupConfig;
  topNavbarPopup: PopupConfig;
  centerScreenPopup: PopupConfig;
  // Potentially add a global lastUpdated timestamp for the whole config document
  lastUpdated?: Timestamp | FieldValue;
}

export const DEFAULT_POPUP_SETTINGS: AllPopupSettings = {
  bottomPopup: {
    id: 'bottomPopup',
    type: 'bottom',
    enabled: false,
    message: 'This is a bottom popup message!',
    ctaText: 'Click Me',
    ctaLink: '#',
  },
  topNavbarPopup: {
    id: 'topNavbarPopup',
    type: 'top-navbar',
    enabled: false,
    message: 'This is a top navbar announcement!',
    ctaText: 'Learn More',
    ctaLink: '#',
  },
  centerScreenPopup: {
    id: 'centerScreenPopup',
    type: 'center-screen',
    enabled: false,
    title: 'Welcome!',
    message: 'This is a center screen modal popup.',
    ctaText: 'Got it!',
    ctaLink: '#',
    delaySeconds: 3,
  },
};
