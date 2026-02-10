
import { FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface AppLogoProps {
  logoUrl?: string | null;
  siteTitle?: string | null;
}

const DEFAULT_TITLE = "XLSConvert";

export default function AppLogo({ logoUrl, siteTitle }: AppLogoProps) {
  const displayTitle = siteTitle || DEFAULT_TITLE;

  return (
    <Link href="/" className="flex flex-shrink-0 items-center gap-2 text-primary hover:opacity-80 transition-opacity">
      {logoUrl ? (
        <Image 
          src={logoUrl} 
          alt={`${displayTitle} Logo`} 
          width={36} // Adjust width as needed, ensure aspect ratio is maintained or height is also set
          height={36} // Adjust height as needed
          className="h-9 w-auto object-contain" // h-9 to match approx size of 36px icon. "w-auto" to maintain aspect ratio.
          data-ai-hint="logo"
        />
      ) : (
        <FileSpreadsheet className="h-7 w-7" />
      )}
      <span className="text-2xl font-semibold whitespace-nowrap">{displayTitle}</span>
    </Link>
  );
}
