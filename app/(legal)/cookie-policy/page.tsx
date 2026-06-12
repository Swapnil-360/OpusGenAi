import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — OpusGen AI",
  description: "How OpusGen AI uses cookies and similar tracking technologies.",
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

function CookieTable({ rows }: { rows: { name: string; type: string; purpose: string; duration: string }[] }) {
  return (
    <div className="overflow-x-auto mt-3">
      <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${S.border}` }}>
            {["Cookie name", "Type", "Purpose", "Duration"].map((h) => (
              <th key={h} className="text-left py-2 pr-4 font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
              <td className="py-2 pr-4 font-mono" style={{ color: S.red }}>{row.name}</td>
              <td className="py-2 pr-4" style={{ color: S.muted }}>{row.type}</td>
              <td className="py-2 pr-4" style={{ color: S.muted }}>{row.purpose}</td>
              <td className="py-2 pr-4" style={{ color: S.dim }}>{row.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CookiePolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">

      {/* Header */}
      <div className="mb-12">
        <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5 inline-block" style={{ background: S.redBg, border: `1px solid rgba(220,38,38,0.2)`, color: S.red }}>
          Legal
        </span>
        <h1 className="text-4xl font-black tracking-tight mb-3" style={{ color: "rgba(255,255,255,0.95)" }}>
          Cookie Policy
        </h1>
        <p className="text-sm" style={{ color: S.muted }}>
          Last updated: June 13, 2026 &nbsp;·&nbsp; Effective: June 13, 2026
        </p>
      </div>

      {/* Intro */}
      <div className="p-5 rounded-2xl mb-12 text-sm leading-relaxed" style={{ background: S.glass, border: `1px solid ${S.border}`, color: S.muted }}>
        This Cookie Policy explains how <strong style={{ color: "rgba(255,255,255,0.85)" }}>OpusGen AI, Inc.</strong> uses cookies and similar tracking technologies when you visit our website at <strong style={{ color: "rgba(255,255,255,0.85)" }}>opusgenai.com</strong> or use our platform. By using the Service, you consent to the use of cookies as described in this policy.
      </div>

      <Section title="1. What Are Cookies?">
        <P>Cookies are small text files placed on your device (computer, tablet, or mobile) when you visit a website. They are widely used to make websites work efficiently, remember your preferences, and provide information to site owners.</P>
        <P>We also use similar technologies such as web beacons, pixel tags, and local storage that function in a comparable way. References to &quot;cookies&quot; in this policy cover all such technologies unless otherwise specified.</P>
      </Section>

      <Section title="2. Types of Cookies We Use">
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Essential cookies</strong> — These are strictly necessary for the website to function. They enable core features such as user authentication, session management, and security. You cannot opt out of these cookies.</P>
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Performance &amp; analytics cookies</strong> — These help us understand how visitors interact with our platform by collecting aggregated, anonymous data. We use this information to improve our product and user experience.</P>
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Preference cookies</strong> — These remember your settings and choices (such as language, display mode, and notification preferences) so you do not have to re-enter them on each visit.</P>
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Marketing cookies</strong> — These track your browsing habits to display relevant advertisements and measure campaign effectiveness. We use these only with your explicit consent.</P>
      </Section>

      <Section title="3. Specific Cookies We Use">
        <CookieTable rows={[
          { name: "session_id", type: "Essential", purpose: "Maintains your login session securely", duration: "Session" },
          { name: "csrf_token", type: "Essential", purpose: "Prevents cross-site request forgery attacks", duration: "Session" },
          { name: "user_prefs", type: "Preference", purpose: "Stores your display and notification preferences", duration: "1 year" },
          { name: "_posthog", type: "Analytics", purpose: "Tracks product usage for feature improvements (PostHog)", duration: "1 year" },
          { name: "_ga", type: "Analytics", purpose: "Google Analytics — measures site traffic (anonymous)", duration: "2 years" },
          { name: "cookie_consent", type: "Essential", purpose: "Records your cookie consent choices", duration: "1 year" },
        ]} />
      </Section>

      <Section title="4. Third-Party Cookies">
        <P>Some cookies are placed by third-party services that appear on our pages. These include:</P>
        <UL items={[
          "PostHog — analytics and product telemetry. See posthog.com/privacy for their policy.",
          "Google Analytics — aggregated traffic statistics. See policies.google.com/privacy.",
          "Stripe — payment processing cookies used on checkout pages. See stripe.com/privacy.",
          "Intercom — customer support widget (if enabled). See intercom.com/legal/privacy.",
        ]} />
        <P>We do not control these third-party cookies. Please review their respective privacy policies for more information.</P>
      </Section>

      <Section title="5. How to Manage Cookies">
        <P>You have several options to control or delete cookies:</P>
        <UL items={[
          "Cookie banner: When you first visit OpusGen AI, you will be presented with a cookie consent banner allowing you to accept or reject non-essential cookies.",
          "Browser settings: Most web browsers allow you to manage cookies through their settings. You can block all cookies, delete existing cookies, or be notified when cookies are set.",
          "Opt-out tools: For analytics cookies, you can use the Google Analytics opt-out browser add-on (tools.google.com/dlpage/gaoptout).",
          "Do Not Track: We respect browser Do Not Track (DNT) signals for analytics cookies.",
        ]} />
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Please note:</strong> Disabling essential cookies will prevent you from logging in and using core features of the platform.</P>
        <div className="mt-3 p-4 rounded-xl text-xs leading-relaxed" style={{ background: S.glass, border: `1px solid ${S.border}`, color: S.muted }}>
          <p className="font-bold mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>Browser cookie settings quick links:</p>
          <p>Chrome: Settings → Privacy and Security → Cookies</p>
          <p>Firefox: Settings → Privacy &amp; Security → Cookies and Site Data</p>
          <p>Safari: Preferences → Privacy → Manage Website Data</p>
          <p>Edge: Settings → Cookies and Site Permissions</p>
        </div>
      </Section>

      <Section title="6. Cookies and Your Personal Data">
        <P>Some cookies we use may be considered personal data under applicable privacy laws (e.g., GDPR, CCPA) when they can be linked to you as an individual. Our handling of such data is described in our <a href="/privacy" style={{ color: S.red }}>Privacy Policy</a>.</P>
        <P>We only use cookies that identify you personally when you are logged in, and we apply appropriate security measures to protect that data.</P>
      </Section>

      <Section title="7. Updates to This Policy">
        <P>We may update this Cookie Policy from time to time to reflect changes in our practices or applicable law. The &quot;Last updated&quot; date at the top of this page indicates when it was last revised. We encourage you to review this policy periodically.</P>
      </Section>

      <Section title="8. Contact Us">
        <P>If you have questions about our use of cookies or this policy, please contact us:</P>
        <div className="mt-4 p-5 rounded-2xl text-sm" style={{ background: S.glass, border: `1px solid ${S.border}` }}>
          <p className="font-bold mb-1" style={{ color: "rgba(255,255,255,0.88)" }}>OpusGen AI, Inc.</p>
          <p style={{ color: S.muted }}>Email: <a href="mailto:opusgenai.official@gmail.com" style={{ color: S.red }}>opusgenai.official@gmail.com</a></p>
          <p style={{ color: S.muted }}>Privacy: <a href="mailto:privacy@opusgenai.com" style={{ color: S.red }}>privacy@opusgenai.com</a></p>
        </div>
      </Section>
    </div>
  );
}
