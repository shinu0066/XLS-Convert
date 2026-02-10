
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { GeneralSiteSettings } from '@/types/site-settings';
import { subscribeToGeneralSettings } from '@/lib/firebase-settings-service';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const GENERIC_APP_NAME = "Our Company";
const GENERIC_EMAIL_DOMAIN_PART = "example.com";

// Helper to update meta tags
const updateMeta = (name: string, content: string) => {
    let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);

    const ogName = `og:${name}`;
     let ogTag = document.querySelector(`meta[property="${ogName}"]`) as HTMLMetaElement;
    if (!ogTag) {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', ogName);
        document.head.appendChild(ogTag);
    }
    ogTag.setAttribute('content', content);
};


export default function PrivacyPolicyPage() {
  const [displayedSiteTitle, setDisplayedSiteTitle] = useState<string>(GENERIC_APP_NAME);
  const [privacyEmail, setPrivacyEmail] = useState<string>(`privacy@${GENERIC_EMAIL_DOMAIN_PART}`);
  const [currentDate, setCurrentDate] = useState<string>('');
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = subscribeToGeneralSettings((settings) => {
      const currentSiteTitle = settings?.siteTitle || GENERIC_APP_NAME;
      const emailDomainPart = currentSiteTitle.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9-]/g, '') || GENERIC_EMAIL_DOMAIN_PART.split('.')[0];
      
      setDisplayedSiteTitle(currentSiteTitle);
      setPrivacyEmail(`privacy@${emailDomainPart}.com`);

      const seoData = settings?.seoSettings?.[pathname];
      const pageTitle = seoData?.title || `Privacy Policy - ${currentSiteTitle}`;
      const pageDescription = seoData?.description || `Read the privacy policy for ${currentSiteTitle}.`;
      
      document.title = pageTitle;
      updateMeta('description', pageDescription);
      
      let ogTitleTag = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
      if (!ogTitleTag) {
          ogTitleTag = document.createElement('meta');
          ogTitleTag.setAttribute('property', 'og:title');
          document.head.appendChild(ogTitleTag);
      }
      ogTitleTag.setAttribute('content', pageTitle);

      if (seoData?.keywords) {
        let keywordsTag = document.querySelector('meta[name="keywords"]');
        if (!keywordsTag) {
          keywordsTag = document.createElement('meta');
          keywordsTag.setAttribute('name', 'keywords');
          document.head.appendChild(keywordsTag);
        }
        keywordsTag.setAttribute('content', seoData.keywords);
      }
    });
    setCurrentDate(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    return () => unsubscribe();
  }, [pathname]);

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center py-10 bg-card rounded-t-lg">
          <h1 className="text-5xl font-extrabold text-primary">Privacy Policy</h1>
          <CardDescription className="text-xl text-muted-foreground max-w-2xl mx-auto mt-2">
            Your privacy is important to us.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-10 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to {displayedSiteTitle} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We are committed to protecting your personal information
              and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices
              with regards to your personal information, please contact us at <a href={`mailto:${privacyEmail}`} className="text-primary hover:underline">{privacyEmail}</a>.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              This privacy notice describes how we might use your information if you visit our website at <Link href="/" className="text-primary underline">[YourWebsiteURL.com]</Link>,
              use our web application, or otherwise engage with us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">2. What Information Do We Collect?</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Personal information you disclose to us:</strong> We collect personal information that you voluntarily provide to us when you
              register on the Services, express an interest in obtaining information about us or our products and Services,
              when you participate in activities on the Services, or otherwise when you contact us.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              The personal information that we collect depends on the context of your interactions with us and the Services,
              the choices you make, and the products and features you use. The personal information we collect may include
              the following: email address, password (hashed), and payment information (processed by third-party payment processors).
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong>Information automatically collected:</strong> We automatically collect certain information when you visit, use, or navigate the
              Services. This information does not reveal your specific identity (like your name or contact information) but
              may include device and usage information, such as your IP address, browser and device characteristics, operating
              system, language preferences, referring URLs, device name, country, location, information about how and when you
              use our Services, and other technical information.
            </p>
             <p className="text-muted-foreground leading-relaxed mt-2">
              <strong>Document Data:</strong> When you use our PDF to Excel conversion service, the content of the documents you upload
              is processed to perform the conversion. We do not store your original documents or the converted Excel files
              on our servers beyond the temporary processing required for the conversion and to allow you to download the result.
              Session data related to the conversion may be temporarily cached but is not permanently stored or analyzed for content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">3. How Do We Use Your Information?</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use personal information collected via our Services for a variety of business purposes described below.
              We process your personal information for these purposes in reliance on our legitimate business interests,
              in order to enter into or perform a contract with you, with your consent, and/or for compliance with our
              legal obligations.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4 mt-2">
              <li>To facilitate account creation and logon process.</li>
              <li>To manage user accounts.</li>
              <li>To send administrative information to you.</li>
              <li>To protect our Services (e.g., for fraud monitoring and prevention).</li>
              <li>To enforce our terms, conditions, and policies for business purposes, to comply with legal and regulatory requirements or in connection with our contract.</li>
              <li>To respond to legal requests and prevent harm.</li>
              <li>To deliver and facilitate delivery of services to the user.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">4. Will Your Information Be Shared With Anyone?</h2>
            <p className="text-muted-foreground leading-relaxed">
              We only share information with your consent, to comply with laws, to provide you with services,
              to protect your rights, or to fulfill business obligations. We may share your data with third-party
              vendors, service providers, contractors or agents who perform services for us or on our behalf and
              require access to such information to do that work. Examples include: payment processing, data analysis,
              email delivery, hosting services, customer service and marketing efforts.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Specifically for PDF processing, our AI models (e.g., hosted by Google AI or similar providers) process the content of your documents.
              Their usage is governed by their respective privacy policies and terms of service, which are designed for data security and confidentiality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">5. How Long Do We Keep Your Information?</h2>
            <p className="text-muted-foreground leading-relaxed">
              We will only keep your personal information for as long as it is necessary for the purposes set out in
              this privacy notice, unless a longer retention period is required or permitted by law (such as tax,
              accounting, or other legal requirements). No purpose in this notice will require us keeping your
              personal information for longer than the period of time in which users have an account with us.
            </p>
             <p className="text-muted-foreground leading-relaxed mt-2">
              As stated above, uploaded documents and their converted versions are not stored long-term.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">6. How Do We Keep Your Information Safe?</h2>
            <p className="text-muted-foreground leading-relaxed">
              We have implemented appropriate technical and organizational security measures designed to protect the
              security of any personal information we process. However, despite our safeguards and efforts to secure
              your information, no electronic transmission over the Internet or information storage technology can be
              guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other
              unauthorized third parties will not be able to defeat our security and improperly collect, access, steal,
              or modify your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">7. Do We Collect Information From Minors?</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not knowingly solicit data from or market to children under 18 years of age. By using the Services,
              you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent
              to such minor dependent’s use of the Services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">8. What Are Your Privacy Rights?</h2>
            <p className="text-muted-foreground leading-relaxed">
              In some regions (like the EEA and UK), you have certain rights under applicable data protection laws. These may
              include the right (i) to request access and obtain a copy of your personal information, (ii) to request
              rectification or erasure; (iii) to restrict the processing of your personal information; and (iv) if applicable,
              to data portability. In certain circumstances, you may also have the right to object to the processing of your
              personal information. To make such a request, please use the contact details provided below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">9. Updates To This Notice</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this privacy notice from time to time. The updated version will be indicated by an updated
              &quot;Revised&quot; date and the updated version will be effective as soon as it is accessible. We encourage you
              to review this privacy notice frequently to be informed of how we are protecting your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">10. How Can You Contact Us About This Notice?</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions or comments about this notice, you may email us at <a href={`mailto:${privacyEmail}`} className="text-primary hover:underline">{privacyEmail}</a> or by post to:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              {displayedSiteTitle}<br />
              Attn: Privacy Officer<br />
              123 Innovation Drive<br />
              Tech City, TX 75001, USA
            </p>
          </section>
          <p className="text-sm text-muted-foreground pt-4 text-center">Last updated: {currentDate || 'Loading date...'}</p>
        </CardContent>
      </Card>
    </div>
  );
}
