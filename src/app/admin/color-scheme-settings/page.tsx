
"use client";

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import type { GeneralSiteSettings } from '@/types/site-settings';
import { getGeneralSettings, updateGeneralSettings } from '@/lib/firebase-settings-service';
import LoadingSpinner from '@/components/core/loading-spinner';
import { PREDEFINED_THEMES, DEFAULT_LIGHT_THEME_ID, type Theme, type ThemeColors } from '@/config/themes';

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div 
        className="h-6 w-6 rounded border border-border" 
        style={{ backgroundColor: `hsl(${color})` }}
        title={`${label}: hsl(${color})`}
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default function ColorSchemeSettingsPage() {
  const { toast } = useToast();
  const [activeThemeId, setActiveThemeId] = useState<string>(DEFAULT_LIGHT_THEME_ID);
  const [initialSettings, setInitialSettings] = useState<Partial<GeneralSiteSettings>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentSettings = await getGeneralSettings();
      if (currentSettings) {
        setInitialSettings(currentSettings);
        setActiveThemeId(currentSettings.activeThemeId || DEFAULT_LIGHT_THEME_ID);
      } else {
        // Should be handled by getGeneralSettings returning defaults
        setActiveThemeId(DEFAULT_LIGHT_THEME_ID);
      }
    } catch (error) {
      console.error("Error fetching color scheme settings:", error);
      toast({ variant: 'destructive', title: 'Error Fetching Settings', description: 'Could not load color scheme settings.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const settingsToUpdate: Partial<GeneralSiteSettings> = {
        ...initialSettings, // Preserve other general settings
        activeThemeId: activeThemeId,
      };
      await updateGeneralSettings(settingsToUpdate);
      setInitialSettings(settingsToUpdate); // Update initial settings to reflect save
      toast({ title: 'Color Scheme Saved', description: 'Your website color scheme has been updated successfully.' });
    } catch (error) {
      console.error("Error saving color scheme settings:", error);
      toast({ variant: 'destructive', title: 'Save Error', description: 'Could not save color scheme settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><LoadingSpinner message="Loading Color Scheme Settings..." /></div>;
  }

  const selectedThemeForPreview = PREDEFINED_THEMES.find(t => t.id === activeThemeId) || PREDEFINED_THEMES.find(t => t.id === DEFAULT_LIGHT_THEME_ID);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Color Scheme Settings</CardTitle>
          <CardDescription>
            Select a predefined color scheme for your website. Changes will apply globally after saving.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={activeThemeId} onValueChange={setActiveThemeId} className="space-y-4">
            {PREDEFINED_THEMES.map((theme) => (
              <Label 
                key={theme.id}
                htmlFor={`theme-${theme.id}`}
                className={
                  `flex flex-col items-start space-y-3 rounded-md border-2 p-4 hover:bg-accent/50 hover:text-accent-foreground 
                  ${activeThemeId === theme.id ? 'border-primary ring-2 ring-primary' : 'border-muted'}`
                }
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-lg text-foreground">{theme.name}</span>
                  <RadioGroupItem value={theme.id} id={`theme-${theme.id}`} className="shrink-0" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {theme.isDark ? "A dark theme variant." : "A light theme variant."}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 mt-2 pt-2 border-t border-border/50 w-full">
                  <ColorSwatch color={theme.colors.primary} label="Primary" />
                  <ColorSwatch color={theme.colors.secondary} label="Secondary" />
                  <ColorSwatch color={theme.colors.accent} label="Accent" />
                  <ColorSwatch color={theme.colors.background} label="Background" />
                  <ColorSwatch color={theme.colors.foreground} label="Text" />
                  <ColorSwatch color={theme.colors.card} label="Card BG" />
                  <ColorSwatch color={theme.colors.border} label="Border" />
                  {theme.isDark && <div className="col-span-full text-xs text-accent-foreground/70 bg-accent/30 p-1 rounded-sm">Dark Theme Base</div>}
                </div>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSaving || isLoading}>
            {isSaving ? <LoadingSpinner message="Saving..." /> : 'Save Color Scheme'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
