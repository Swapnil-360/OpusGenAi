import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — OpusGen AI",
  description: "OpusGen AI refund and cancellation policy for subscriptions and credits.",
};

const S = {
  text: "rgba(255,255,255,0.78)",
  muted: "rgba(255,255,255,0.48)",
  dim: "rgba(255,255,255,0.28)",
  border: "rgba(255,255,255,0.08)",
  glass: "rgba(255,255,255,0.04)",
  red: "#f87171",
  redBg: "rgba(220,38,38,0.08)",
  green: "#4ade80",
  greenBg: "rgba(74,222,128,0.08)",
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

function InfoBox({ color, title, children }: { color: "green" | "red"; title: string; children: React.ReactNode }) {
  const c = color === "green" ? S.green : S.red;
  const bg = color === "green" ? S.greenBg : S.redBg;
  return (
    <div className="p-4 rounded-2xl text-sm leading-relaxed" style={{ background: bg, border: `1px solid ${c}33` }}>
      <p className="font-bold mb-1.5" style={{ color: c }}>{title}</p>
      <div style={{ color: S.muted }}>{children}</div>
    </div>
  );
}

export default function RefundPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">

      {/* Header */}
      <div className="mb-12">
        <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5 inline-block" style={{ background: S.redBg, border: `1px solid rgba(220,38,38,0.2)`, color: S.red }}>
          Legal
        </span>
        <h1 className="text-4xl font-black tracking-tight mb-3" style={{ color: "rgba(255,255,255,0.95)" }}>
          Refund Policy
        </h1>
        <p className="text-sm" style={{ color: S.muted }}>
          Last updated: June 13, 2026 &nbsp;·&nbsp; Effective: June 13, 2026
        </p>
      </div>

      {/* Quick summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        <InfoBox color="green" title="✓ Eligible for refund">
          <p>Billing errors · Duplicate charges · Technical failures preventing service use · First-time subscribers within 7 days</p>
        </InfoBox>
        <InfoBox color="red" title="✗ Not eligible for refund">
          <p>Used credits · Partially used subscription periods · Change of mind after use · Violating our Terms of Service</p>
        </InfoBox>
      </div>

      <Section title="1. Subscription Refunds">
        <P>OpusGen AI offers monthly subscription plans (Basic at $9.99/month and Pro at $18/month). Please read the following carefully before requesting a refund:</P>

        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>7-day satisfaction guarantee (first-time subscribers):</strong> If you are a first-time subscriber to a paid plan and are not satisfied with the Service, you may request a full refund within 7 days of your initial payment. This applies to your first subscription charge only.</P>

        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Renewal charges:</strong> Subscription fees are charged automatically at the start of each billing period. Renewal charges are non-refundable. It is your responsibility to cancel your subscription before the renewal date if you do not wish to continue.</P>

        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Cancellation:</strong> You may cancel your subscription at any time from your Account Settings. Cancellation takes effect at the end of the current billing period — you will retain access to paid features until that date. No partial refunds are issued for unused days in a billing period.</P>

        <UL items={[
          "Subscriptions cancelled mid-period are not refunded for the remaining days.",
          "Downgrading from Pro to Basic or Free mid-period does not trigger a refund.",
          "Refunds are not available for plans purchased during promotional or discounted pricing periods.",
        ]} />
      </Section>

      <Section title="2. Credit Refunds">
        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Monthly subscription credits:</strong> Credits included in your monthly plan are not refundable and do not roll over to the next billing cycle. Unused monthly credits expire at the end of each billing period.</P>

        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>One-time credit packs (add-ons):</strong> Credits purchased as one-time add-on packs do not expire and are non-refundable after purchase, except in cases of technical failure (see Section 3).</P>

        <P><strong style={{ color: "rgba(255,255,255,0.88)" }}>Failed generations:</strong> If a generation fails due to a technical error on our end and credits were deducted, those credits will be automatically restored to your balance within 24 hours. If automatic restoration does not occur, please contact support.</P>
      </Section>

      <Section title="3. Technical Issues & Service Outages">
        <P>If you experience a sustained service outage or a persistent technical issue that prevents you from using the Service you paid for, you may be eligible for a pro-rated credit or refund based on the downtime duration:</P>
        <UL items={[
          "Outages of less than 4 hours: no refund, but credit may be offered at our discretion.",
          "Outages of 4–24 hours: pro-rated credit applied to your account for the affected period.",
          "Outages exceeding 24 hours: pro-rated refund or credit at your choice.",
          "Scheduled maintenance windows published in advance do not qualify for refunds.",
        ]} />
        <P>To report an issue, email <a href="mailto:opusgenai.official@gmail.com" style={{ color: S.red }}>opusgenai.official@gmail.com</a> with your account email and a description of the problem.</P>
      </Section>

      <Section title="4. Billing Errors">
        <P>If you were charged an incorrect amount (e.g., charged twice, wrong plan amount), we will investigate and correct the error promptly. Billing errors are eligible for a full refund regardless of when they are reported, provided you notify us within 90 days of the charge.</P>
        <P>To report a billing error, email <a href="mailto:opusgenai.official@gmail.com" style={{ color: S.red }}>opusgenai.official@gmail.com</a> with your account details and the relevant charge information.</P>
      </Section>

      <Section title="5. How to Request a Refund">
        <P>To request a refund, follow these steps:</P>
        <UL items={[
          "Step 1: Email opusgenai.official@gmail.com with the subject line 'Refund Request — [your account email]'.",
          "Step 2: Include your account email, the charge date, the amount, and the reason for your request.",
          "Step 3: Our team will review your request and respond within 3 business days.",
          "Step 4: Approved refunds are processed back to your original payment method within 5–10 business days.",
        ]} />
        <P>Refunds are processed via Stripe and will appear on your statement as a reversal of the original charge. Processing times may vary depending on your bank or card issuer.</P>
      </Section>

      <Section title="6. Chargebacks">
        <P>We ask that you contact us directly before initiating a chargeback with your bank. Chargebacks that are filed without first contacting our support team may result in account suspension pending investigation.</P>
        <P>Fraudulent chargebacks may result in permanent account termination and referral to fraud prevention services.</P>
      </Section>

      <Section title="7. Jurisdiction-Specific Rights">
        <P>Depending on your location, you may have additional statutory rights under consumer protection laws. This refund policy does not override any rights you have under applicable local law.</P>
        <UL items={[
          "EU/UK consumers: 14-day right of withdrawal may apply to digital services under the Consumer Rights Directive. This right is waived when you begin using the Service during the withdrawal period.",
          "Australian consumers: Rights under the Australian Consumer Law (ACL) apply in addition to this policy.",
          "US consumers: State-specific consumer protection laws may apply.",
        ]} />
      </Section>

      <Section title="8. Contact Us">
        <P>For refund requests, billing questions, or disputes:</P>
        <div className="mt-4 p-5 rounded-2xl text-sm" style={{ background: S.glass, border: `1px solid ${S.border}` }}>
          <p className="font-bold mb-1" style={{ color: "rgba(255,255,255,0.88)" }}>OpusGen AI, Inc.</p>
          <p style={{ color: S.muted }}>Email: <a href="mailto:opusgenai.official@gmail.com" style={{ color: S.red }}>opusgenai.official@gmail.com</a></p>
          <p style={{ color: S.muted }}>Response time: within 3 business days</p>
          <p className="mt-2 text-xs" style={{ color: S.dim }}>Please include your account email and transaction details for faster processing.</p>
        </div>
      </Section>
    </div>
  );
}
