
"use client";

import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { firestore, storage, auth } from './firebase';
import type { GeneralSiteSettings, SocialLink, CustomScript, PageSEOInfo, PaymentGatewaySetting, PaymentGatewayType } from '@/types/site-settings';
import { DEFAULT_LIGHT_THEME_ID } from '@/config/themes';
import { PermissionError, isFirebaseSDKError } from '@/types/errors';
import { logError } from '@/lib/error-handler';
// import { Landmark, CreditCard } from 'lucide-react'; // Icons are set in default settings now

const SETTINGS_COLLECTION = 'site_settings';
const GENERAL_SETTINGS_DOC_ID = 'general_config';
const SHARED_LOGO_STORAGE_PATH = 'site_settings/shared_logo';

export const PREDEFINED_SOCIAL_MEDIA_PLATFORMS: Omit<SocialLink, 'url' | 'enabled'>[] = [
  { id: 'facebook', name: 'Facebook', iconName: 'Facebook' },
  { id: 'twitter', name: 'Twitter', iconName: 'Twitter' },
  { id: 'instagram', name: 'Instagram', iconName: 'Instagram' },
  { id: 'linkedin', name: 'Linkedin', iconName: 'Linkedin' },
  { id: 'youtube', name: 'Youtube', iconName: 'Youtube' },
  { id: 'github', name: 'Github', iconName: 'Github' },
];

// Define the known payment gateways and their static configuration
export const PREDEFINED_PAYMENT_GATEWAYS_CONFIG: Pick<PaymentGatewaySetting, 'id' | 'name' | 'iconName'>[] = [
  { id: 'paypal', name: 'PayPal', iconName: 'Landmark' }, // Landmark icon for PayPal
  { id: 'stripe', name: 'Stripe', iconName: 'CreditCard' },
];


const DEFAULT_ROBOTS_TXT_CONTENT = `User-agent: *
Allow: /
# Sitemap: Replace_this_with_your_full_sitemap_url/sitemap.xml
`;

const DEFAULT_SITEMAP_XML_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>REPLACE_THIS_WITH_YOUR_DOMAIN/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- Add more URLs here -->
</urlset>
`;

const GOOGLE_ANALYTICS_SCRIPT_CONTENT = `
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-13ZT6MJBS2"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-13ZT6MJBS2');
</script>
`;

const DEFAULT_GENERAL_SETTINGS: GeneralSiteSettings = {
  siteTitle: 'XLSConvert',
  logoUrl: null, // Changed from undefined to null
  navItems: [],
  adLoaderScript: '',
  socialLinks: PREDEFINED_SOCIAL_MEDIA_PLATFORMS.map(p => ({ ...p, url: '', enabled: false })),
  customScripts: [
    {
        id: 'default-ga-script',
        name: 'Google Analytics',
        scriptContent: GOOGLE_ANALYTICS_SCRIPT_CONTENT,
        enabled: true,
    }
  ],
  activeThemeId: DEFAULT_LIGHT_THEME_ID,
  seoSettings: {},
  robotsTxtContent: DEFAULT_ROBOTS_TXT_CONTENT,
  sitemapXmlContent: DEFAULT_SITEMAP_XML_CONTENT,
  maintenanceModeEnabled: false,
  paymentGateways: [ // Default structure for known payment gateways
    {
      id: 'paypal',
      name: 'PayPal',
      iconName: 'Landmark',
      enabled: false,
      credentials: { clientId: '' },
    },
    {
      id: 'stripe',
      name: 'Stripe',
      iconName: 'CreditCard',
      enabled: false,
      credentials: { clientId: '', clientSecret: '' },
    },
  ],
};


// Helper function to merge settings safely
function mergeSettings(savedData?: Partial<GeneralSiteSettings>): GeneralSiteSettings {
    const data = savedData || {};

    // Merge custom scripts: Start with defaults, then add any *new* saved scripts.
    const defaultScripts = DEFAULT_GENERAL_SETTINGS.customScripts || [];
    const defaultScriptIds = new Set(defaultScripts.map(s => s.id));
    const savedScripts = data.customScripts || [];
    const uniqueSavedScripts = savedScripts.filter(s => !defaultScriptIds.has(s.id));
    
    const combinedScripts = [...defaultScripts];
    // For scripts with same ID, saved one overrides default one
    savedScripts.forEach(savedScript => {
        const index = combinedScripts.findIndex(ds => ds.id === savedScript.id);
        if (index > -1) {
            combinedScripts[index] = savedScript; // Update default with saved
        } else {
            combinedScripts.push(savedScript); // Add new saved script
        }
    });

    return {
        ...DEFAULT_GENERAL_SETTINGS, // Start with all defaults
        ...data, // Overlay with saved data
        customScripts: combinedScripts,
        socialLinks: PREDEFINED_SOCIAL_MEDIA_PLATFORMS.map(defaultPlatform => {
            const savedLink = data.socialLinks?.find(sl => sl.id === defaultPlatform.id);
            return savedLink ? { ...defaultPlatform, ...savedLink } : { ...defaultPlatform, url: '', enabled: false };
        }),
        paymentGateways: PREDEFINED_PAYMENT_GATEWAYS_CONFIG.map(defaultGatewayConfig => {
            const defaultFullGateway = DEFAULT_GENERAL_SETTINGS.paymentGateways!.find(dfg => dfg.id === defaultGatewayConfig.id)!;
            const savedGateway = data.paymentGateways?.find(sg => sg.id === defaultGatewayConfig.id);
            return {
                ...defaultFullGateway,
                ...savedGateway,
                credentials: {
                    ...defaultFullGateway.credentials,
                    ...(savedGateway?.credentials || {}),
                },
            };
        }),
        siteTitle: data.siteTitle || DEFAULT_GENERAL_SETTINGS.siteTitle,
        activeThemeId: data.activeThemeId || DEFAULT_GENERAL_SETTINGS.activeThemeId,
        robotsTxtContent: data.robotsTxtContent === undefined ? DEFAULT_GENERAL_SETTINGS.robotsTxtContent : data.robotsTxtContent,
        sitemapXmlContent: data.sitemapXmlContent === undefined ? DEFAULT_GENERAL_SETTINGS.sitemapXmlContent : data.sitemapXmlContent,
        maintenanceModeEnabled: data.maintenanceModeEnabled === undefined ? DEFAULT_GENERAL_SETTINGS.maintenanceModeEnabled : data.maintenanceModeEnabled,
        logoUrl: data.logoUrl ?? DEFAULT_GENERAL_SETTINGS.logoUrl,
    };
}


// Firestore functions
export async function getGeneralSettings(): Promise<GeneralSiteSettings> {
  try {
    const docRef = doc(firestore, SETTINGS_COLLECTION, GENERAL_SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return mergeSettings(docSnap.data() as Partial<GeneralSiteSettings>);
    }
    return mergeSettings(); // Return fully merged defaults
  } catch (error) {
    logError(error, { operation: 'getGeneralSettings' });
    
    if (isFirebaseSDKError(error)) {
      if (error.code === 'firestore/permission-denied') {
        throw new PermissionError("You do not have permission to access settings.", 'site_settings', 'read');
      }
    }
    
    throw error;
  }
}

export async function updateGeneralSettings(settings: Partial<GeneralSiteSettings>): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new PermissionError("Authentication required to update general settings.", 'site_settings', 'update');
  }
  
  try {
    console.log("Attempting to update general settings. Admin UID:", currentUser.uid, "Settings:", settings);

    const docRef = doc(firestore, SETTINGS_COLLECTION, GENERAL_SETTINGS_DOC_ID);
    const cleanedSettings: Partial<GeneralSiteSettings> = {};
    for (const key in settings) {
      if (Object.prototype.hasOwnProperty.call(settings, key)) {
        const k = key as keyof GeneralSiteSettings;
        const value = settings[k];
        if (value !== undefined) {
          (cleanedSettings as Record<string, unknown>)[k] = value;
        }
      }
    }
    
    if (cleanedSettings.paymentGateways !== undefined && !Array.isArray(cleanedSettings.paymentGateways)) {
        console.warn("PaymentGateways provided but not an array, defaulting to empty array for update.", cleanedSettings.paymentGateways);
        cleanedSettings.paymentGateways = [];
    }


    const settingsToSave = {
      ...cleanedSettings,
      lastUpdated: serverTimestamp()
    };

    if (Object.keys(cleanedSettings).length === 0 && Object.keys(settings).length > 0) {
        console.warn("UpdateGeneralSettings called with only undefined values. Only 'lastUpdated' will be set.");
    }

    await setDoc(docRef, settingsToSave, { merge: true });
    console.log("Successfully updated general settings.");
  } catch (error) {
    logError(error, { 
      operation: 'updateGeneralSettings', 
      userId: currentUser.uid 
    });
    
    if (isFirebaseSDKError(error)) {
      if (error.code === 'firestore/permission-denied') {
        throw new PermissionError("You do not have permission to update settings.", 'site_settings', 'update');
      }
    }
    
    throw error;
  }
}

export function subscribeToGeneralSettings(
  callback: (settings: GeneralSiteSettings) => void
): Unsubscribe {
  const docRef = doc(firestore, SETTINGS_COLLECTION, GENERAL_SETTINGS_DOC_ID);
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const merged = mergeSettings(docSnap.data() as Partial<GeneralSiteSettings>);
      callback(merged);
    } else {
      callback(mergeSettings()); // Return fully merged defaults
    }
  }, (error) => {
    console.error("Error in general settings subscription:", error);
    callback(mergeSettings()); // Fallback to defaults on error
  });
  return unsubscribe;
}

// Firebase Storage functions for the shared logo
export async function uploadSharedSiteLogo(file: File): Promise<string> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Authentication required to upload site logo.");
    }
    console.log("Attempting to upload site logo. Admin UID:", currentUser.uid);

    const fileExtension = file.name.split('.').pop();
    const logoFileName = `shared_logo_${Date.now()}.${fileExtension}`;
    const storageRefInstance = ref(storage, `${SHARED_LOGO_STORAGE_PATH}/${logoFileName}`);
    const snapshot = await uploadBytes(storageRefInstance, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading shared site logo:", error);
    throw error;
  }
}

export async function deleteSharedSiteLogo(logoUrl: string): Promise<void> {
  if (!logoUrl || logoUrl.startsWith('blob:')) {
    console.warn("Attempted to delete an invalid or blob URL (shared logo) from Firebase Storage:", logoUrl);
    return; 
  }
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Authentication required to delete shared site logo.");
    }
    console.log("Attempting to delete shared site logo. Admin UID:", currentUser.uid, "URL:", logoUrl);
    const storageRefInstance = ref(storage, logoUrl);
    await deleteObject(storageRefInstance);
    console.log("Successfully deleted old shared logo from Firebase Storage:", logoUrl);
  } catch (error: unknown) {
    const errorCode = 
      error && 
      typeof error === 'object' && 
      'code' in error && 
      typeof error.code === 'string'
        ? error.code
        : undefined;
    
    if (errorCode === 'storage/object-not-found') {
      console.warn('Old shared logo not found in storage, skipping deletion:', logoUrl);
    } else {
      console.error("Error deleting shared logo from Firebase Storage:", error);
      throw error; 
    }
  }
}
