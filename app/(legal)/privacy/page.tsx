import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — OpusGen AI",
  description: "How OpusGen AI collects, uses, and protects your personal information.",
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

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">

      {/* Header */}
      <div className="mb-12">
        <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5 inline-block" style={{ background: S.redBg, border: `1px solid rgba(220,38,38,0.2)`, color: S.red }}>
          Legal
        </span>
        <h1 className="text-4xl font-black tracking-tight mb-3" style={{ color: "rgba(255,255,255,0.95)" }}>
          Privacy Policy
        </h1>
        <p className="text-sm" style={{ color: S.muted }}>
          Last updated: June 10, 2026 &nbsp;·&nbsp; Effective: June 10, 2026
        </p>
      </div>

      {/* Intro box */}
      <div className="p-5 rounded-2xl mb-12 text-sm leading-relaxed" style={{ background: S.glass, border: `1px solid ${S.border}`, color: S.muted }}>
        At <strong style={{ color: "rgba(255,255,255,0.85)" }}>OpusGen AI, Inc.</strong> (&quot;OpusGen AI&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website at <strong style={{ color: "rgba(255,255,255,0.85)" }}>opusgenai.com</strong> and our AI-powered product photography platform (collectively, the &quot;Service&quot;). Please read this policy carefully. By using the Service, you agree to the practices described here.
      </div>

      <Section title="1. Information We Collect">
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>a) Information you provide directly</strong></P>
        <UL items={[
          "Account information: name, email address, and password when you register.",
          "Payment information: billing address and payment method details processed securely via Stripe. We never store your full card number.",
          "Profile information: optional website URL, company name, or profile photo.",
          "Communications: messages you send us via support channels or email.",
        ]} />

        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>b) Information generated through your use of the Service</strong></P>
        <UL items={[
          "Images and files you upload for processing (background removal, upscaling, etc.).",
          "Text prompts and generation settings you submit.",
          "AI-generated images produced by the Service on your behalf.",
          "Credits consumed, generation history, and tool usage logs.",
        ]} />

        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>c) Automatically collected information</strong></P>
        <UL items={[
          "Log data: IP address, browser type, device type, pages visited, time and date of visits.",
          "Cookies and similar tracking technologies (see Section 5).",
          "Performance and error data to monitor service reliability.",
        ]} />
      </Section>

      <Section title="2. How We Use Your Information">
        <P>We use the information we collect for the following purposes:</P>
        <UL items={[
          "To create and manage your account and authenticate you.",
          "To process payments and manage your credit balance.",
          "To deliver AI-generated images and run the tools you request.",
          "To improve the quality, performance, and reliability of our models and infrastructure.",
          "To send transactional emails (receipts, generation notifications, password resets).",
          "To send marketing communications — only with your explicit consent, and you may opt out at any time.",
          "To comply with legal obligations and enforce our Terms of Service.",
          "To detect and prevent fraud, abuse, and security incidents.",
          "To respond to your support requests and feedback.",
        ]} />
        <P>
          <strong style={{ color: "rgba(255,255,255,0.88)" }}>Important:</strong> We do <em>not</em> use your uploaded images or generated outputs to train our AI models without your explicit opt-in consent. Your creative content belongs to you.
        </P>
      </Section>

      <Section title="3. How We Share Your Information">
        <P>We do not sell your personal information. We may share it only in these limited circumstances:</P>
        <UL items={[
          "Service providers: trusted third parties who assist in operating our platform (cloud hosting, payment processing via Stripe, email delivery via Resend, analytics via PostHog). These providers are contractually bound to protect your data.",
          "AI inference providers: images and prompts are transmitted to AI inference APIs (e.g., Replicate, Stability AI) to generate results. These are governed by their respective data processing agreements.",
          "Legal requirements: if required by law, court order, or to protect the rights, property, or safety of OpusGen AI, our users, or the public.",
          "Business transfers: in the event of a merger, acquisition, or sale of assets, your data may be transferred. We will provide notice before your information is transferred.",
        ]} />
      </Section>

      <Section title="4. Data Retention">
        <P>We retain your personal data for as long as your account is active or as needed to provide the Service. Specifically:</P>
        <UL items={[
          "Account data is retained while your account is open and for up to 90 days after deletion to allow recovery.",
          "Generated images are stored for 30 days after creation, then automatically deleted unless you explicitly save them.",
          "Uploaded source images used for tool processing are deleted within 24 hours of processing.",
          "Billing records are retained for 7 years as required by financial regulations.",
          "You may request immediate deletion of your account and associated data by contacting us at privacy@opusgenai.com.",
        ]} />
      </Section>

      <Section title="5. Cookies and Tracking Technologies">
        <P>We use the following types of cookies:</P>
        <UL items={[
          "Essential cookies: required for authentication, session management, and security. Cannot be disabled.",
          "Analytics cookies: help us understand how the Service is used (e.g., PostHog). You may opt out via our cookie settings.",
          "Preference cookies: remember your settings such as language and display preferences.",
        ]} />
        <P>You can manage cookie preferences through your browser settings or our Cookie Preferences panel. Note that disabling essential cookies will prevent you from using core features of the Service.</P>
      </Section>

      <Section title="6. Your Privacy Rights">
        <P>Depending on your location, you may have the following rights regarding your personal data:</P>
        <UL items={[
          "Right of access: request a copy of the personal data we hold about you.",
          "Right to rectification: request correction of inaccurate or incomplete data.",
          "Right to erasure ('right to be forgotten'): request deletion of your personal data, subject to legal retention requirements.",
          "Right to data portability: receive your data in a structured, machine-readable format.",
          "Right to restrict processing: request that we limit how we use your data.",
          "Right to object: object to processing based on legitimate interests or for direct marketing.",
          "Right to withdraw consent: withdraw any consent you have previously given at any time.",
        ]} />
        <P>To exercise any of these rights, email us at <strong style={{ color: S.red }}>privacy@opusgenai.com</strong>. We will respond within 30 days (or as required by applicable law). EU/UK residents may also lodge a complaint with their local data protection authority.</P>
      </Section>

      <Section title="7. International Data Transfers">
        <P>OpusGen AI is based in the United States. If you access our Service from outside the U.S., your information may be transferred to, stored, and processed in the U.S. or other countries where our service providers operate.</P>
        <P>For users in the European Economic Area (EEA), United Kingdom, or Switzerland, we implement appropriate safeguards for international transfers, including Standard Contractual Clauses (SCCs) approved by the European Commission, to ensure your data receives an adequate level of protection.</P>
      </Section>

      <Section title="8. Security">
        <P>We implement industry-standard technical and organisational measures to protect your information, including:</P>
        <UL items={[
          "AES-256 encryption for data at rest.",
          "TLS 1.3 for all data in transit.",
          "Role-based access controls limiting employee access to personal data.",
          "Regular security audits and penetration testing.",
          "SOC 2 Type II certified infrastructure.",
        ]} />
        <P>Despite these measures, no security system is impenetrable. In the event of a data breach that poses a risk to your rights, we will notify you as required by applicable law.</P>
      </Section>

      <Section title="9. Children's Privacy">
        <P>Our Service is not directed at children under the age of 13 (or 16 in the EEA/UK). We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately at <strong style={{ color: S.red }}>privacy@opusgenai.com</strong> and we will delete such information promptly.</P>
      </Section>

      <Section title="10. Third-Party Links">
        <P>Our Service may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties. We encourage you to review the privacy policies of any third-party sites you visit.</P>
      </Section>

      <Section title="11. Changes to This Policy">
        <P>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page with a new &quot;Last Updated&quot; date, and by sending an email notification to registered users at least 14 days before changes take effect.</P>
        <P>Your continued use of the Service after the effective date of any changes constitutes your acceptance of the revised policy.</P>
      </Section>

      <Section title="12. Contact Us">
        <P>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</P>
        <div className="mt-4 p-5 rounded-2xl text-sm" style={{ background: S.glass, border: `1px solid ${S.border}` }}>
          <p className="font-bold mb-1" style={{ color: "rgba(255,255,255,0.88)" }}>OpusGen AI, Inc.</p>
          <p style={{ color: S.muted }}>Email: <a href="mailto:privacy@opusgenai.com" style={{ color: S.red }}>privacy@opusgenai.com</a></p>
          <p style={{ color: S.muted }}>Data Protection Officer: <a href="mailto:dpo@opusgenai.com" style={{ color: S.red }}>dpo@opusgenai.com</a></p>
          <p className="mt-2" style={{ color: S.muted }}>Response time: within 30 business days</p>
        </div>
      </Section>
    </div>
  );
}
