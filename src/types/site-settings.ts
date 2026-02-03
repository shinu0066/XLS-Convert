
export interface NavItem {
  id: string;
  label: string;
  href: string;
}

export interface SocialLink {
  id: string; // e.g., 'facebook', 'twitter'
  name: string; // e.g., 'Facebook', 'Twitter' (for display in admin)
  iconName: keyof typeof import('lucide-react'); // Lucide icon component name
  url: string;
  enabled: boolean;
}

export interface CustomScript {
  id: string; // Unique ID for the script
  name: string; // User-friendly name for the script (e.g., "Google Analytics")
  scriptContent: string; // The actual <script>...</script> tag or JS code
  enabled: boolean; // Whether the script should be injected
}

export interface PageSEOInfo {
  title?: string;
  description?: string;
  keywords?: string; // Comma-separated string
}

export type PaymentGatewayType = 'paypal' | 'stripe';

export interface PaymentGatewayCredentials {
  clientId?: string; // PayPal Client ID / Stripe Publishable Key
  clientSecret?: string; // PayPal Secret (WARN: PROD INSECURE) / Stripe Secret Key (WARN: PROD INSECURE)
  webhookSecret?: string; // Stripe Webhook Secret (WARN: PROD INSECURE)
  // Add other gateway-specific fields as needed
}

export interface PaymentGatewaySetting {
  id: PaymentGatewayType;
  name: string;
  iconName: keyof typeof import('lucide-react');
  enabled: boolean;
  credentials: PaymentGatewayCredentials;
}

export interface GeneralSiteSettings {
  siteTitle?: string;
  logoUrl?: string | null;
  navItems?: NavItem[];
  adLoaderScript?: string; // For primary ad network script
  socialLinks?: SocialLink[];
  customScripts?: CustomScript[]; // For multiple custom scripts like GA, etc.
  activeThemeId?: string; // ID of the currently active theme
  seoSettings?: Record<string, PageSEOInfo>; // Key is page path (e.g., "/", "/about")
  robotsTxtContent?: string;
  sitemapXmlContent?: string;
  maintenanceModeEnabled?: boolean;
  paymentGateways?: PaymentGatewaySetting[]; // Added for payment gateways
  // future settings can be added here
}
