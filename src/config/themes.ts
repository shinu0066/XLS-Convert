
export interface ThemeColors {
  background: string; // HSL string e.g., "0 0% 100%"
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  // Chart colors can also be themed if desired
  chart1?: string;
  chart2?: string;
  chart3?: string;
  chart4?: string;
  chart5?: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  isDark?: boolean;
}

export const DEFAULT_LIGHT_THEME_ID = "default-light";
export const DEFAULT_DARK_THEME_ID = "default-dark";

export const PREDEFINED_THEMES: Theme[] = [
  {
    id: DEFAULT_LIGHT_THEME_ID,
    name: "Default Light",
    isDark: false,
    colors: {
      background: "270 33% 95%",
      foreground: "240 10% 3.9%",
      card: "270 33% 95%",
      cardForeground: "240 10% 3.9%",
      popover: "270 33% 95%",
      popoverForeground: "240 10% 3.9%",
      primary: "267 38% 67%",
      primaryForeground: "0 0% 98%",
      secondary: "270 20% 90%",
      secondaryForeground: "240 10% 3.9%",
      muted: "270 15% 85%",
      mutedForeground: "240 5% 45%",
      accent: "179 31% 54%",
      accentForeground: "0 0% 98%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 98%",
      border: "270 15% 80%",
      input: "270 15% 88%",
      ring: "267 38% 67%",
      chart1: "12 76% 61%",
      chart2: "173 58% 39%",
      chart3: "197 37% 24%",
      chart4: "43 74% 66%",
      chart5: "27 87% 67%",
    },
  },
  {
    id: DEFAULT_DARK_THEME_ID,
    name: "Default Dark",
    isDark: true,
    colors: {
      background: "240 10% 3.9%",
      foreground: "0 0% 98%",
      card: "240 10% 3.9%",
      cardForeground: "0 0% 98%",
      popover: "240 10% 3.9%",
      popoverForeground: "0 0% 98%",
      primary: "267 38% 67%",
      primaryForeground: "0 0% 98%",
      secondary: "240 3.7% 15.9%",
      secondaryForeground: "0 0% 98%",
      muted: "240 3.7% 15.9%",
      mutedForeground: "0 0% 63.9%",
      accent: "179 31% 54%",
      accentForeground: "0 0% 98%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "0 0% 98%",
      border: "240 3.7% 15.9%",
      input: "240 3.7% 15.9%",
      ring: "267 38% 67%",
      chart1: "220 70% 50%",
      chart2: "160 60% 45%",
      chart3: "30 80% 55%",
      chart4: "280 65% 60%",
      chart5: "340 75% 55%",
    },
  },
  {
    id: "blue-theme",
    name: "Ocean Blue",
    isDark: false,
    colors: {
      background: "210 40% 96%", // Light blue-grey
      foreground: "210 20% 20%", // Dark slate blue
      card: "210 40% 98%", // Very light blue
      cardForeground: "210 20% 20%",
      popover: "210 40% 98%",
      popoverForeground: "210 20% 20%",
      primary: "211 100% 50%", // #007BFF
      primaryForeground: "0 0% 100%", // White
      secondary: "208 7% 45%", // #6C757D (Greyish blue)
      secondaryForeground: "0 0% 100%", // White
      muted: "210 30% 90%", // Light grey-blue
      mutedForeground: "210 15% 50%", // Muted slate blue
      accent: "180 60% 45%", // Teal
      accentForeground: "0 0% 100%", // White
      destructive: "0 70% 55%", // Red
      destructiveForeground: "0 0% 100%",
      border: "210 25% 85%", // Softer blue-grey border
      input: "210 30% 92%", // Light input background
      ring: "211 100% 50%",
    }
  },
  {
    id: "green-theme",
    name: "Forest Green",
    isDark: false,
    colors: {
      background: "120 20% 95%", // Pale green
      foreground: "120 25% 15%", // Dark forest green
      card: "120 20% 98%", // Very pale green
      cardForeground: "120 25% 15%",
      popover: "120 20% 98%",
      popoverForeground: "120 25% 15%",
      primary: "136 60% 40%", // #28A745
      primaryForeground: "0 0% 100%", // White
      secondary: "134 60% 33%", // #218838 (Darker green)
      secondaryForeground: "0 0% 100%",
      muted: "120 15% 88%", // Light muted green
      mutedForeground: "120 20% 40%", // Muted forest green
      accent: "45 70% 55%", // Gold/Yellow
      accentForeground: "0 0% 0%", // Black
      destructive: "0 70% 55%", // Red
      destructiveForeground: "0 0% 100%",
      border: "120 15% 80%", // Softer green border
      input: "120 15% 92%", // Light input background
      ring: "136 60% 40%",
    }
  },
  {
    id: "red-theme",
    name: "Crimson Red",
    isDark: false,
    colors: {
      background: "0 20% 96%", // Very light pink/grey
      foreground: "0 30% 20%", // Dark desaturated red
      card: "0 20% 98%", // Almost white with red hint
      cardForeground: "0 30% 20%",
      popover: "0 20% 98%",
      popoverForeground: "0 30% 20%",
      primary: "354 70% 53%", // #DC3545
      primaryForeground: "0 0% 100%", // White
      secondary: "355 69% 47%", // #C82333 (Darker red)
      secondaryForeground: "0 0% 100%",
      muted: "0 15% 90%", // Light grey-pink
      mutedForeground: "0 20% 50%", // Muted desaturated red
      accent: "25 80% 55%", // Orange
      accentForeground: "0 0% 100%", // White
      destructive: "120 60% 45%", // Green (for contrast on a red theme)
      destructiveForeground: "0 0% 100%",
      border: "0 15% 85%", // Softer pink-grey border
      input: "0 15% 92%", // Light input background
      ring: "354 70% 53%",
    }
  },
  {
    id: "purple-theme",
    name: "Royal Purple",
    isDark: true, // Example of a dark variant for a specific color
    colors: {
      background: "260 20% 15%", // Deep purple-black
      foreground: "260 15% 90%", // Light lavender grey
      card: "260 20% 20%", // Dark purple
      cardForeground: "260 15% 90%",
      popover: "260 20% 20%",
      popoverForeground: "260 15% 90%",
      primary: "258 52% 51%", // #6F42C1
      primaryForeground: "0 0% 100%", // White
      secondary: "259 53% 42%", // #5A32A3 (Darker purple)
      secondaryForeground: "0 0% 100%",
      muted: "260 15% 30%", // Muted dark purple
      mutedForeground: "260 10% 70%", // Muted lavender
      accent: "300 70% 65%", // Magenta/Pink
      accentForeground: "0 0% 0%", // Black
      destructive: "0 60% 55%", // Bright Red
      destructiveForeground: "0 0% 100%",
      border: "260 15% 25%", // Dark purple border
      input: "260 15% 22%", // Dark input background
      ring: "258 52% 51%",
    }
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    isDark: false,
    colors: {
      background: "30 100% 97%", // Very light orange
      foreground: "25 50% 25%",  // Dark brown-orange
      card: "30 100% 98%",       // Almost white with orange hint
      cardForeground: "25 50% 25%",
      popover: "30 100% 98%",
      popoverForeground: "25 50% 25%",
      primary: "24 96% 53%",     // Bright orange (#FF6600)
      primaryForeground: "0 0% 100%", // White
      secondary: "39 89% 50%",    // Lighter orange/yellow (#FFA500)
      secondaryForeground: "25 50% 25%", // Dark brown-orange for contrast
      muted: "30 80% 92%",        // Light orange
      mutedForeground: "25 40% 50%", // Muted brown-orange
      accent: "190 70% 50%",     // Contrasting teal
      accentForeground: "0 0% 100%", // White
      destructive: "0 70% 55%",    // Red
      destructiveForeground: "0 0% 100%",
      border: "30 70% 88%",       // Softer orange border
      input: "30 80% 94%",        // Light orange input background
      ring: "24 96% 53%",
    }
  },
  {
    id: "oceanic-teal",
    name: "Oceanic Teal",
    isDark: false,
    colors: {
      background: "180 30% 96%", // Very light teal
      foreground: "180 25% 20%",  // Dark teal
      card: "180 30% 98%",       // Almost white with teal hint
      cardForeground: "180 25% 20%",
      popover: "180 30% 98%",
      popoverForeground: "180 25% 20%",
      primary: "174 72% 45%",     // Teal (#20C997)
      primaryForeground: "0 0% 100%", // White
      secondary: "180 40% 60%",    // Lighter teal/cyan
      secondaryForeground: "180 25% 20%", // Dark teal for contrast
      muted: "180 25% 90%",        // Light muted teal
      mutedForeground: "180 20% 50%", // Muted teal
      accent: "210 80% 60%",     // Contrasting blue
      accentForeground: "0 0% 100%", // White
      destructive: "0 70% 55%",    // Red
      destructiveForeground: "0 0% 100%",
      border: "180 20% 85%",       // Softer teal border
      input: "180 25% 92%",        // Light teal input background
      ring: "174 72% 45%",
    }
  },
  {
    id: "rose-quartz-pink",
    name: "Rose Quartz Pink",
    isDark: false,
    colors: {
      background: "330 60% 97%", // Very light pink
      foreground: "330 30% 30%",  // Dark dusty rose
      card: "330 60% 98%",       // Almost white with pink hint
      cardForeground: "330 30% 30%",
      popover: "330 60% 98%",
      popoverForeground: "330 30% 30%",
      primary: "336 70% 65%",     // Soft pink (#F080AA)
      primaryForeground: "330 30% 30%", // Dark dusty rose
      secondary: "330 40% 80%",    // Lighter pastel pink
      secondaryForeground: "330 30% 30%",
      muted: "330 50% 92%",        // Light pink
      mutedForeground: "330 25% 55%", // Muted rose
      accent: "260 60% 70%",     // Contrasting lavender
      accentForeground: "0 0% 100%",
      destructive: "0 70% 55%",    // Red
      destructiveForeground: "0 0% 100%",
      border: "330 40% 88%",       // Softer pink border
      input: "330 50% 94%",        // Light pink input background
      ring: "336 70% 65%",
    }
  },
  {
    id: "espresso-brown",
    name: "Espresso Brown",
    isDark: true,
    colors: {
      background: "30 20% 10%",  // Very dark brown
      foreground: "30 15% 85%",   // Light beige/cream
      card: "30 20% 15%",        // Dark brown
      cardForeground: "30 15% 85%",
      popover: "30 20% 15%",
      popoverForeground: "30 15% 85%",
      primary: "35 60% 55%",      // Rich coffee brown (#A0522D - sienna, adjusted HSL)
      primaryForeground: "30 15% 95%", // Off-white
      secondary: "30 30% 40%",     // Medium dark brown
      secondaryForeground: "30 15% 90%",
      muted: "30 15% 25%",         // Muted dark brown
      mutedForeground: "30 10% 65%",  // Muted beige
      accent: "45 70% 60%",      // Contrasting gold/amber
      accentForeground: "30 20% 10%",
      destructive: "0 60% 50%",     // Deep red
      destructiveForeground: "30 15% 95%",
      border: "30 15% 20%",        // Dark brown border
      input: "30 15% 18%",         // Dark input background
      ring: "35 60% 55%",
    }
  },
  {
    id: "graphite-mono",
    name: "Graphite Mono",
    isDark: true,
    colors: {
      background: "240 6% 10%",  // Very dark grey
      foreground: "240 5% 90%",   // Light grey
      card: "240 6% 12%",        // Darker grey
      cardForeground: "240 5% 90%",
      popover: "240 6% 12%",
      popoverForeground: "240 5% 90%",
      primary: "240 3% 75%",      // Medium-light grey (for primary actions)
      primaryForeground: "240 6% 10%",  // Very dark grey (for text on primary)
      secondary: "240 4% 30%",     // Medium dark grey
      secondaryForeground: "240 5% 85%",
      muted: "240 5% 20%",         // Muted dark grey
      mutedForeground: "240 4% 60%",  // Muted medium grey
      accent: "0 0% 100%",       // White (as a stark accent)
      accentForeground: "240 6% 10%",
      destructive: "0 70% 50%",     // Red (for destructive actions)
      destructiveForeground: "240 5% 90%",
      border: "240 5% 18%",        // Dark grey border
      input: "240 5% 16%",         // Dark input background
      ring: "240 3% 75%",
    }
  },
  // New Themes Start Here
  {
    id: "minty-fresh-light",
    name: "Minty Fresh Light",
    isDark: false,
    colors: {
      background: "150 50% 96%", // Pale mint
      foreground: "150 25% 20%", // Dark mint-green
      card: "150 50% 98%",       // Very pale mint
      cardForeground: "150 25% 20%",
      popover: "150 50% 98%",
      popoverForeground: "150 25% 20%",
      primary: "160 60% 45%",     // Bright mint
      primaryForeground: "0 0% 100%",
      secondary: "155 40% 70%",    // Lighter mint
      secondaryForeground: "150 25% 20%",
      muted: "150 30% 90%",        // Light muted mint
      mutedForeground: "150 20% 50%",
      accent: "200 70% 60%",     // Sky blue
      accentForeground: "0 0% 100%",
      destructive: "0 70% 55%",
      destructiveForeground: "0 0% 100%",
      border: "150 30% 85%",
      input: "150 40% 92%",
      ring: "160 60% 45%",
    }
  },
  {
    id: "charcoal-slate-dark",
    name: "Charcoal Slate Dark",
    isDark: true,
    colors: {
      background: "220 15% 10%", // Very dark blue-grey
      foreground: "220 10% 85%", // Light grey-blue
      card: "220 15% 15%",       // Dark blue-grey
      cardForeground: "220 10% 85%",
      popover: "220 15% 15%",
      popoverForeground: "220 10% 85%",
      primary: "210 60% 55%",     // Medium slate blue
      primaryForeground: "0 0% 100%",
      secondary: "220 10% 30%",    // Darker slate
      secondaryForeground: "220 10% 80%",
      muted: "220 10% 25%",
      mutedForeground: "220 8% 60%",
      accent: "30 70% 60%",      // Amber/Orange
      accentForeground: "0 0% 0%",
      destructive: "0 60% 50%",
      destructiveForeground: "0 0% 100%",
      border: "220 10% 20%",
      input: "220 10% 18%",
      ring: "210 60% 55%",
    }
  },
  {
    id: "lavender-dream-light",
    name: "Lavender Dream Light",
    isDark: false,
    colors: {
      background: "270 60% 97%", // Very light lavender
      foreground: "270 30% 30%", // Dark muted purple
      card: "270 60% 98%",
      cardForeground: "270 30% 30%",
      popover: "270 60% 98%",
      popoverForeground: "270 30% 30%",
      primary: "265 70% 65%",     // Soft lavender
      primaryForeground: "0 0% 100%",
      secondary: "275 50% 80%",    // Lighter pastel purple
      secondaryForeground: "270 30% 30%",
      muted: "270 40% 92%",
      mutedForeground: "270 25% 55%",
      accent: "330 70% 70%",     // Soft pink
      accentForeground: "0 0% 0%",
      destructive: "0 70% 55%",
      destructiveForeground: "0 0% 100%",
      border: "270 40% 88%",
      input: "270 50% 94%",
      ring: "265 70% 65%",
    }
  },
  {
    id: "midnight-blue-dark",
    name: "Midnight Blue Dark",
    isDark: true,
    colors: {
      background: "225 30% 8%",  // Very dark desaturated blue
      foreground: "220 20% 90%", // Light cool grey
      card: "225 30% 12%",       // Dark blue
      cardForeground: "220 20% 90%",
      popover: "225 30% 12%",
      popoverForeground: "220 20% 90%",
      primary: "215 70% 50%",     // Bright blue
      primaryForeground: "0 0% 100%",
      secondary: "230 20% 25%",    // Darker muted blue
      secondaryForeground: "220 15% 85%",
      muted: "230 15% 20%",
      mutedForeground: "220 10% 60%",
      accent: "180 60% 50%",     // Teal accent
      accentForeground: "0 0% 0%",
      destructive: "0 65% 55%",
      destructiveForeground: "0 0% 100%",
      border: "230 15% 18%",
      input: "230 15% 16%",
      ring: "215 70% 50%",
    }
  },
  {
    id: "sandstone-warm-light",
    name: "Sandstone Warm Light",
    isDark: false,
    colors: {
      background: "35 40% 95%", // Pale sandy beige
      foreground: "30 25% 25%", // Dark warm brown
      card: "35 40% 97%",
      cardForeground: "30 25% 25%",
      popover: "35 40% 97%",
      popoverForeground: "30 25% 25%",
      primary: "30 70% 50%",      // Terracotta orange
      primaryForeground: "0 0% 100%",
      secondary: "40 50% 75%",     // Light sand
      secondaryForeground: "30 25% 25%",
      muted: "35 30% 90%",
      mutedForeground: "30 20% 55%",
      accent: "120 40% 50%",     // Olive green
      accentForeground: "0 0% 100%",
      destructive: "0 70% 55%",
      destructiveForeground: "0 0% 100%",
      border: "35 30% 85%",
      input: "35 35% 92%",
      ring: "30 70% 50%",
    }
  },
  {
    id: "deep-forest-dark",
    name: "Deep Forest Dark",
    isDark: true,
    colors: {
      background: "120 25% 8%",  // Very dark green
      foreground: "100 15% 88%", // Light desaturated green-grey
      card: "120 25% 12%",       // Dark forest green
      cardForeground: "100 15% 88%",
      popover: "120 25% 12%",
      popoverForeground: "100 15% 88%",
      primary: "130 50% 45%",     // Rich forest green
      primaryForeground: "0 0% 100%",
      secondary: "110 20% 25%",    // Darker muted green
      secondaryForeground: "100 10% 80%",
      muted: "110 15% 20%",
      mutedForeground: "100 10% 60%",
      accent: "40 60% 55%",      // Goldenrod
      accentForeground: "0 0% 0%",
      destructive: "0 60% 50%",
      destructiveForeground: "0 0% 100%",
      border: "110 15% 18%",
      input: "110 15% 16%",
      ring: "130 50% 45%",
    }
  },
  {
    id: "coral-peach-light",
    name: "Coral Peach Light",
    isDark: false,
    colors: {
      background: "20 80% 96%", // Pale peach
      foreground: "10 40% 30%", // Dark brownish-red
      card: "20 80% 98%",
      cardForeground: "10 40% 30%",
      popover: "20 80% 98%",
      popoverForeground: "10 40% 30%",
      primary: "10 80% 60%",      // Bright coral
      primaryForeground: "0 0% 100%",
      secondary: "25 70% 80%",     // Lighter peach
      secondaryForeground: "10 40% 30%",
      muted: "20 60% 92%",
      mutedForeground: "10 30% 55%",
      accent: "170 50% 55%",     // Seafoam green
      accentForeground: "0 0% 0%",
      destructive: "350 70% 55%",
      destructiveForeground: "0 0% 100%",
      border: "20 60% 88%",
      input: "20 70% 94%",
      ring: "10 80% 60%",
    }
  },
  {
    id: "steel-blue-dark",
    name: "Steel Blue Dark",
    isDark: true,
    colors: {
      background: "210 20% 12%", // Dark steel blue
      foreground: "200 15% 88%", // Light grey-blue
      card: "210 20% 18%",
      cardForeground: "200 15% 88%",
      popover: "210 20% 18%",
      popoverForeground: "200 15% 88%",
      primary: "205 65% 50%",     // Medium steel blue
      primaryForeground: "0 0% 100%",
      secondary: "215 15% 30%",    // Darker muted steel blue
      secondaryForeground: "200 10% 80%",
      muted: "215 12% 25%",
      mutedForeground: "200 10% 65%",
      accent: "0 0% 75%",       // Light grey accent
      accentForeground: "0 0% 0%",
      destructive: "0 55% 50%",
      destructiveForeground: "0 0% 100%",
      border: "215 12% 22%",
      input: "215 12% 20%",
      ring: "205 65% 50%",
    }
  },
  {
    id: "cream-coffee-light",
    name: "Cream & Coffee Light",
    isDark: false,
    colors: {
      background: "40 50% 96%", // Creamy off-white
      foreground: "30 30% 20%", // Dark coffee brown
      card: "40 50% 98%",
      cardForeground: "30 30% 20%",
      popover: "40 50% 98%",
      popoverForeground: "30 30% 20%",
      primary: "35 50% 45%",      // Medium coffee brown
      primaryForeground: "0 0% 100%",
      secondary: "45 40% 85%",     // Light beige
      secondaryForeground: "30 30% 20%",
      muted: "40 30% 92%",
      mutedForeground: "30 25% 50%",
      accent: "200 50% 55%",     // Dusty blue
      accentForeground: "0 0% 100%",
      destructive: "0 70% 55%",
      destructiveForeground: "0 0% 100%",
      border: "40 30% 88%",
      input: "40 40% 94%",
      ring: "35 50% 45%",
    }
  },
  {
    id: "nightshade-purple-dark",
    name: "Nightshade Purple Dark",
    isDark: true,
    colors: {
      background: "270 25% 10%", // Very dark purple
      foreground: "280 15% 88%", // Light lavender-grey
      card: "270 25% 15%",
      cardForeground: "280 15% 88%",
      popover: "270 25% 15%",
      popoverForeground: "280 15% 88%",
      primary: "275 60% 55%",     // Rich purple
      primaryForeground: "0 0% 100%",
      secondary: "265 20% 28%",    // Darker muted purple
      secondaryForeground: "280 10% 80%",
      muted: "265 15% 22%",
      mutedForeground: "280 10% 65%",
      accent: "240 70% 65%",     // Electric blue
      accentForeground: "0 0% 0%",
      destructive: "350 60% 50%",
      destructiveForeground: "0 0% 100%",
      border: "265 15% 20%",
      input: "265 15% 18%",
      ring: "275 60% 55%",
    }
  }
  // Add more themes here if needed
];

    

