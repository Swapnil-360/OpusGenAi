import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — OpusGen AI",
  description: "Terms and conditions governing your use of OpusGen AI.",
};

const S = {
  text: "rgba(255,255,255,0.78)",
  muted: "rgba(255,255,255,0.48)",
  dim: "rgba(255,255,255,0.28)",
  border: "rgba(255,255,255,0.08)",
  glass: "rgba(255,255,255,0.04)",
  red: "#f87171",
  redBg: "rgba(220,38,38,0.08)",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-black tracking-tight mb-4 pb-3" style={{ color: "rgba(255,255,255,0.92)", borderBottom: `1px solid ${S.border}` }}>
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: S.text }}>
        {children}
      </div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function UL({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 pl-1">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: S.red }} />
          <span style={{ color: S.muted }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">

      {/* Header */}
      <div className="mb-12">
        <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5 inline-block" style={{ background: S.redBg, border: `1px solid rgba(220,38,38,0.2)`, color: S.red }}>
          Legal
        </span>
        <h1 className="text-4xl font-black tracking-tight mb-3" style={{ color: "rgba(255,255,255,0.95)" }}>
          Terms of Service
        </h1>
        <p className="text-sm" style={{ color: S.muted }}>
          Last updated: June 10, 2026 &nbsp;·&nbsp; Effective: June 10, 2026
        </p>
      </div>

      {/* Intro box */}
      <div className="p-5 rounded-2xl mb-12 text-sm leading-relaxed" style={{ background: S.glass, border: `1px solid ${S.border}`, color: S.muted }}>
        These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot;, &quot;you&quot;, or &quot;your&quot;) and <strong style={{ color: "rgba(255,255,255,0.85)" }}>OpusGen AI, Inc.</strong> (&quot;OpusGen AI&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) governing your access to and use of the OpusGen AI platform, website, and related services (collectively, the &quot;Service&quot;). By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
      </div>

      <Section title="1. Acceptance of Terms">
        <P>By accessing or using OpusGen AI, you confirm that you are at least 18 years of age (or the age of majority in your jurisdiction), have the legal capacity to enter into these Terms, and agree to comply with all applicable laws and regulations.</P>
        <P>If you are using the Service on behalf of a company or organisation, you represent that you have the authority to bind that entity to these Terms, and references to &quot;you&quot; include that entity.</P>
      </Section>

      <Section title="2. Description of Service">
        <P>OpusGen AI provides an AI-powered product photography platform that enables users to:</P>
        <UL items={[
          "Generate studio-quality product images from text prompts using AI image generation models.",
          "Process existing images through tools including background removal, background replacement, image cleanup, upscaling (up to 4×), and outpainting (uncrop).",
          "Generate social media captions, hashtags, and marketing copy to accompany product visuals.",
          "Access a library of curated templates for common product photography styles.",
        ]} />
        <P>The Service is provided on an &quot;as-is&quot; basis and we reserve the right to modify, suspend, or discontinue any feature at any time with reasonable notice.</P>
      </Section>

      <Section title="3. Account Registration">
        <P>To access most features of the Service, you must create an account. You agree to:</P>
        <UL items={[
          "Provide accurate, complete, and current registration information.",
          "Maintain the security of your password and restrict access to your account.",
          "Notify us immediately at support@opusgenai.com of any unauthorised access or security breach.",
          "Accept responsibility for all activity that occurs under your account.",
        ]} />
        <P>We reserve the right to suspend or terminate accounts that violate these Terms, contain false information, or are associated with fraudulent activity.</P>
      </Section>

      <Section title="4. Credits, Plans, and Billing">
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Credits system:</strong> The Service operates on a credit-based system. Each generation or tool usage consumes a defined number of credits based on the operation performed. Credits are non-transferable between accounts.</P>
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Plans:</strong> We offer the following subscription tiers:</P>
        <UL items={[
          "Free: 10 credits upon registration, standard quality, JPG download.",
          "Basic ($9.99/month): 35 credits per month, HD quality, PNG and JPG downloads, all templates.",
          "Pro ($18/month): 100 credits per month, 4K upscale, batch processing, priority queue, full caption studio.",
        ]} />
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Billing:</strong> Paid plans are billed monthly in advance. All payments are processed securely by Stripe. By providing payment details, you authorise us to charge your payment method for all fees incurred.</P>
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Refunds:</strong> Monthly subscription fees are non-refundable except where required by applicable law. Unused credits do not roll over between billing cycles and expire at period end. Credits purchased as one-time add-ons do not expire.</P>
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Price changes:</strong> We reserve the right to change pricing with at least 30 days' notice to existing subscribers. Continued use after the effective date constitutes acceptance.</P>
      </Section>

      <Section title="5. Acceptable Use Policy">
        <P>You agree to use the Service only for lawful purposes. The following are expressly prohibited:</P>
        <UL items={[
          "Generating content that is sexually explicit, pornographic, or involves minors in any inappropriate context.",
          "Creating deepfakes, non-consensual intimate imagery, or content designed to harass, defame, or threaten individuals.",
          "Generating images that infringe upon the intellectual property, trademarks, or copyrights of third parties.",
          "Using the Service to impersonate brands, public figures, or organisations in a misleading manner.",
          "Attempting to reverse-engineer, circumvent, or exploit the AI models or underlying infrastructure.",
          "Automating access to the Service in ways that violate our API rate limits without explicit written permission.",
          "Using the Service to generate content that promotes violence, terrorism, or illegal activities.",
          "Reselling, sublicensing, or providing the Service as a white-label product without a written agreement.",
        ]} />
        <P>We reserve the right to remove content, suspend accounts, and report illegal activity to appropriate authorities without prior notice.</P>
      </Section>

      <Section title="6. Intellectual Property and Ownership of Generated Content">
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Your content:</strong> You retain full ownership of images you upload to the Service and text prompts you provide.</P>
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Generated outputs:</strong> Subject to your compliance with these Terms and payment of applicable fees, OpusGen AI grants you a worldwide, royalty-free, non-exclusive licence to use, reproduce, distribute, and commercially exploit images generated through the Service. You may use generated images for commercial purposes including advertising, e-commerce listings, and product marketing.</P>
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Platform ownership:</strong> OpusGen AI, its logo, user interface, AI models, technology infrastructure, and all related intellectual property are owned exclusively by OpusGen AI, Inc. and are protected by copyright, trademark, and other laws. You may not copy, reproduce, or create derivative works of our platform.</P>
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Licence to us:</strong> By uploading content to the Service, you grant OpusGen AI a limited, non-exclusive licence to process, store, and transmit that content solely to provide the Service to you. We do not claim ownership of your uploaded content and will not use it to train AI models without your explicit consent.</P>
      </Section>

      <Section title="7. Privacy">
        <P>Your use of the Service is also governed by our <a href="/privacy" style={{ color: S.red }}>Privacy Policy</a>, which is incorporated by reference into these Terms. By using the Service, you consent to the data practices described therein.</P>
      </Section>

      <Section title="8. Third-Party Services">
        <P>The Service integrates with third-party AI providers, payment processors, and analytics services. Your use of those services is subject to their respective terms of service and privacy policies. OpusGen AI is not responsible for the practices, policies, or availability of third-party services.</P>
      </Section>

      <Section title="9. Disclaimer of Warranties">
        <P>THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR UNINTERRUPTED SERVICE.</P>
        <P>We do not warrant that: (a) the Service will meet your specific requirements; (b) generated images will be free from defects or fully accurate; (c) results will be suitable for any particular commercial use without independent review; or (d) the Service will be available at all times without interruption.</P>
      </Section>

      <Section title="10. Limitation of Liability">
        <P>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, OPUSGEN AI, INC. AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY:</P>
        <UL items={[
          "Indirect, incidental, special, consequential, or punitive damages.",
          "Loss of profits, revenue, data, goodwill, or business opportunities.",
          "Damages arising from reliance on AI-generated content.",
          "Costs of procurement of substitute services.",
        ]} />
        <P>IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU EXCEED THE GREATER OF (a) THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM OR (b) USD $100.</P>
        <P>Some jurisdictions do not allow the exclusion or limitation of certain damages, so the above limitations may not apply to you.</P>
      </Section>

      <Section title="11. Indemnification">
        <P>You agree to indemnify, defend, and hold harmless OpusGen AI, Inc. and its officers, directors, employees, agents, and successors from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising from:</P>
        <UL items={[
          "Your use of or access to the Service.",
          "Your violation of these Terms.",
          "Your violation of any third-party right, including intellectual property, privacy, or publicity rights.",
          "Any content you upload, generate, or distribute using the Service.",
        ]} />
      </Section>

      <Section title="12. Termination">
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>By you:</strong> You may close your account at any time from your Account Settings page. Closing your account cancels any active subscription effective at the end of the current billing period.</P>
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>By us:</strong> We may suspend or terminate your account immediately if you breach these Terms, engage in fraudulent activity, or pose a security risk. We may also discontinue the Service entirely with 30 days&apos; notice, in which case we will provide a pro-rated refund for unused subscription time.</P>
        <P>Upon termination, your right to use the Service ceases immediately. Sections 6, 9, 10, 11, and 14 survive termination.</P>
      </Section>

      <Section title="13. Governing Law and Dispute Resolution">
        <P>These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.</P>
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Arbitration:</strong> Any dispute arising from these Terms or the Service that cannot be resolved informally shall be settled by binding arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules. The arbitration shall be conducted in English, and judgment may be entered in any court of competent jurisdiction.</P>
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Class action waiver:</strong> You waive any right to bring claims as a class action, collective action, or representative action.</P>
        <P>Notwithstanding the above, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent irreparable harm.</P>
      </Section>

      <Section title="14. General Provisions">
        <UL items={[
          "Entire agreement: These Terms, together with our Privacy Policy, constitute the entire agreement between you and OpusGen AI regarding the Service.",
          "Severability: If any provision is found unenforceable, it will be modified to the minimum extent necessary, and the remaining provisions will remain in full force.",
          "Waiver: Our failure to enforce any right or provision shall not constitute a waiver of that right or provision.",
          "Assignment: You may not assign or transfer your rights under these Terms without our prior written consent. We may assign our rights without restriction.",
          "Force majeure: We are not liable for delays or failures caused by circumstances beyond our reasonable control.",
          "Updates: We may revise these Terms at any time. Material changes will be communicated via email or in-app notification with at least 14 days' notice.",
        ]} />
      </Section>

      <Section title="15. Contact Us">
        <P>For questions about these Terms or to report violations:</P>
        <div className="mt-4 p-5 rounded-2xl text-sm" style={{ background: S.glass, border: `1px solid ${S.border}` }}>
          <p className="font-bold mb-1" style={{ color: "rgba(255,255,255,0.88)" }}>OpusGen AI, Inc.</p>
          <p style={{ color: S.muted }}>Legal enquiries: <a href="mailto:legal@opusgenai.com" style={{ color: S.red }}>legal@opusgenai.com</a></p>
          <p style={{ color: S.muted }}>General support: <a href="mailto:support@opusgenai.com" style={{ color: S.red }}>support@opusgenai.com</a></p>
          <p className="mt-2" style={{ color: S.muted }}>Response time: within 5 business days for legal matters</p>
        </div>
      </Section>
    </div>
  );
}
