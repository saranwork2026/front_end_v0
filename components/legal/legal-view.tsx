'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

import { Icon } from '@/components/ui/icon'
import { LEGAL_INFO } from '@/src/data/legalContent'

/**
 * Terms of Service + Privacy Policy — SCAFFOLD (public, logged-out friendly).
 *
 * The prose is a structured DRAFT mirroring the existing app's legal pages, to
 * stop the /terms and /privacy-policy 404s (registration links to both). It is
 * NOT reviewed legal copy — [PLACEHOLDER: …] values in src/data/legalContent.ts
 * must be filled in and reviewed by counsel before launch.
 */

function DraftNotice() {
  return (
    <div role="note" className="flex items-start gap-3 rounded-xl border border-gold/40 bg-gold-soft p-4 text-sm text-foreground">
      <Icon name="shield" size={20} className="mt-0.5 shrink-0 text-gold-foreground" />
      <div className="space-y-1">
        <p className="font-semibold">Draft — pending legal review</p>
        <p className="text-muted-foreground">
          This page is a structured template. Sections marked [PLACEHOLDER: …] must be completed with
          real, business-approved content and reviewed by counsel before this is treated as binding.
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  )
}

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-brand-warm px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Effective date: {LEGAL_INFO.effectiveDate}</p>
        </div>
        <DraftNotice />
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 text-sm leading-relaxed text-foreground/90">
          {children}
        </div>
        <p>
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">
            ← Back to login
          </Link>
        </p>
      </div>
    </main>
  )
}

function TermsContent() {
  return (
    <>
      <Section title="1. Acceptance of Terms">
        <p>
          By registering for or using {LEGAL_INFO.brandName} (the &quot;Service&quot;), operated by{' '}
          {LEGAL_INFO.legalEntityName} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), you agree to be bound by these
          Terms of Service. If you do not agree, do not use the Service.
        </p>
      </Section>
      <Section title="2. Eligibility">
        <p>
          You must be at least 18 years old and legally eligible to marry under applicable law to create an account.
          You are responsible for ensuring the accuracy of the information you provide, including your date of birth.
        </p>
      </Section>
      <Section title="3. Account Registration & Verification">
        <p>
          Registration requires a valid mobile number and, where provided, a valid email address. We verify these via
          a One-Time Password (OTP) sent by SMS and/or email. You must keep your login credentials confidential and
          notify us immediately of any unauthorized use of your account.
        </p>
      </Section>
      <Section title="4. User Conduct">
        <ul className="list-disc space-y-1 pl-5">
          <li>Provide accurate, truthful profile information</li>
          <li>Do not impersonate any person or misrepresent your identity, age, or marital status</li>
          <li>Do not harass, abuse, or send unsolicited commercial content to other members</li>
          <li>Do not use the Service for any unlawful purpose</li>
        </ul>
        <p>
          We reserve the right to suspend or terminate accounts that violate these terms, and to moderate or reject
          profiles that do not meet our content standards.
        </p>
      </Section>
      <Section title="5. Subscriptions & Payments">
        <p>
          Certain features (such as contacting other members or viewing full contact details) require an active paid
          subscription plan. Subscription fees, quotas, and renewal terms are described on the Plans page at the time
          of purchase.
        </p>
        <p className="rounded bg-muted/60 p-3 text-muted-foreground">
          [PLACEHOLDER: Refund & cancellation policy — state whether fees are refundable, the cancellation window, and
          how refunds are processed. Must reflect your actual payment terms and comply with applicable consumer-protection law.]
        </p>
      </Section>
      <Section title="6. No Guarantee of Match">
        <p>
          The Service is a platform to help you connect with prospective matches. We do not guarantee that you will
          find a suitable match, and we are not responsible for the conduct, intentions, or representations of any
          member you interact with. You are solely responsible for exercising your own judgment and caution.
        </p>
      </Section>
      <Section title="7. Termination">
        <p>
          You may deactivate or permanently delete your account at any time from your account settings. We may suspend
          or terminate your access to the Service if you violate these terms or applicable law.
        </p>
      </Section>
      <Section title="8. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential
          damages arising from your use of the Service.
        </p>
      </Section>
      <Section title="9. Governing Law & Jurisdiction">
        <p>
          These Terms are governed by {LEGAL_INFO.governingLaw}. Any disputes arising from or relating to these Terms
          or the Service are subject to the exclusive jurisdiction of {LEGAL_INFO.jurisdiction}.
        </p>
      </Section>
      <Section title="10. Changes to These Terms">
        <p>
          We may update these Terms from time to time. Continued use of the Service after changes take effect
          constitutes acceptance of the revised Terms.
        </p>
      </Section>
      <Section title="11. Grievance Officer">
        <p>
          In accordance with applicable law, the Grievance Officer for the Service is {LEGAL_INFO.grievanceOfficerName},
          reachable at{' '}
          <a href={`mailto:${LEGAL_INFO.grievanceOfficerEmail}`} className="font-medium text-primary hover:underline">
            {LEGAL_INFO.grievanceOfficerEmail}
          </a>
          .
        </p>
      </Section>
      <Section title="12. Contact Us">
        <p>
          {LEGAL_INFO.legalEntityName}
          <br />
          {LEGAL_INFO.registeredAddress}
          <br />
          CIN: {LEGAL_INFO.cin} · GSTIN: {LEGAL_INFO.gstin}
        </p>
        <p>
          For questions about these Terms, contact us at{' '}
          <a href={`mailto:${LEGAL_INFO.supportEmail}`} className="font-medium text-primary hover:underline">
            {LEGAL_INFO.supportEmail}
          </a>
          .
        </p>
      </Section>
    </>
  )
}

function PrivacyContent() {
  return (
    <>
      <Section title="1. Introduction">
        <p>
          {LEGAL_INFO.brandName} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), operated by {LEGAL_INFO.legalEntityName}, is
          committed to protecting the privacy of everyone who uses our matrimony platform (the &quot;Service&quot;). This
          Privacy Policy explains what information we collect, why we collect it, and how it is used, stored, and protected.
        </p>
      </Section>
      <Section title="2. Information We Collect">
        <p>When you register and use the Service, we collect information you provide directly, including:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Identity details: name, mobile number, email address, date of birth, gender</li>
          <li>Profile details: religion, caste, sect, mother tongue, education, profession, family details, and photos, where provided</li>
          <li>Partner preference details you specify for matching</li>
          <li>Communications with other members (interests, chat messages) and with our support team</li>
          <li>Payment and subscription records for paid plans</li>
        </ul>
      </Section>
      <Section title="3. How We Use Your Information">
        <ul className="list-disc space-y-1 pl-5">
          <li>To create and operate your account, including One-Time Password (OTP) verification via SMS and/or email at registration, login recovery, and password reset</li>
          <li>To show your profile to other members and generate match suggestions based on your preferences</li>
          <li>To send transactional notifications relevant to your account and activity on the Service</li>
          <li>To moderate content and enforce our Terms of Service</li>
          <li>To improve the Service and investigate misuse, fraud, or abuse</li>
        </ul>
        <p>
          We do not sell your personal information to third parties, and we do not use your email or mobile number for
          unsolicited marketing.
        </p>
      </Section>
      <Section title="4. Email & SMS Communications">
        <p>
          We send transactional email and SMS messages only in direct response to actions you take — for example, a
          one-time OTP code when you register, log in from a new context, or reset your password. We do not send
          marketing newsletters or bulk email campaigns, and we do not maintain a mailing list. If you believe you
          received a message in error, contact us using the details in Section 10.
        </p>
      </Section>
      <Section title="5. Third-Party Service Providers">
        <p>
          We share information with third-party service providers only as needed to operate the Service, under
          appropriate confidentiality obligations. These currently include:
        </p>
        <p className="rounded bg-muted/60 p-3 text-muted-foreground">
          [PLACEHOLDER: List the actual sub-processors and what data each receives — e.g. cloud hosting/storage
          provider, transactional email provider, SMS/OTP provider, payment gateway. Name each provider and the data
          category it processes so this reflects your real data flows.]
        </p>
        <p>
          We may also disclose information if required by law or to protect the rights, safety, or property of our
          users or the public.
        </p>
      </Section>
      <Section title="6. Data Retention">
        <p>
          We retain your information for as long as your account is active. If you deactivate your account, your
          profile is hidden from search but retained in case you reactivate. If you delete your account, associated
          data is permanently removed, except where retention is required for legal or regulatory purposes.
        </p>
        <p className="rounded bg-muted/60 p-3 text-muted-foreground">
          [PLACEHOLDER: State specific retention periods where you have them — e.g. how long deleted-account data or
          payment records are kept for tax/legal reasons.]
        </p>
      </Section>
      <Section title="7. Your Rights">
        <p>
          You can access and update most of your profile information directly from your account. You may request
          account deactivation, reactivation, or permanent deletion at any time from your account settings, or by
          contacting support.
        </p>
        <p className="rounded bg-muted/60 p-3 text-muted-foreground">
          [PLACEHOLDER: If you serve users covered by specific data-protection regimes (e.g. India&apos;s DPDP Act,
          GDPR), describe the applicable rights — access, correction, erasure, grievance redressal — and how a user
          exercises each.]
        </p>
      </Section>
      <Section title="8. Security">
        <p>
          We use industry-standard safeguards to protect your information, including encrypted password storage and
          HTTPS for all data in transit. No method of transmission or storage is 100% secure, and we cannot guarantee
          absolute security.
        </p>
      </Section>
      <Section title="9. Grievance Officer">
        <p>
          For privacy-related complaints, our Grievance Officer is {LEGAL_INFO.grievanceOfficerName}, reachable at{' '}
          <a href={`mailto:${LEGAL_INFO.grievanceOfficerEmail}`} className="font-medium text-primary hover:underline">
            {LEGAL_INFO.grievanceOfficerEmail}
          </a>
          .
        </p>
      </Section>
      <Section title="10. Contact Us">
        <p>
          For privacy questions or data requests, contact us at{' '}
          <a href={`mailto:${LEGAL_INFO.supportEmail}`} className="font-medium text-primary hover:underline">
            {LEGAL_INFO.supportEmail}
          </a>
          .
        </p>
      </Section>
    </>
  )
}

export function LegalView({ doc }: { doc: 'terms' | 'privacy' }) {
  if (doc === 'privacy') {
    return (
      <Shell title="Privacy Policy">
        <PrivacyContent />
      </Shell>
    )
  }
  return (
    <Shell title="Terms of Service">
      <TermsContent />
    </Shell>
  )
}
