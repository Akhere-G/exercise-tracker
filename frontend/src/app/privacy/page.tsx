import type { Metadata } from "next";
import { LegalPage } from "@/src/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Gains",
  description: "How Gains collects, uses, and protects personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="15 November 2026">
      <section>
        <h2>1. Who is responsible for your data</h2>
        <p>
          Akhere I. operates Gains and is the controller of personal data
          described in this policy. This policy explains what Gains collects,
          why it is used, and the choices and rights available to you.
        </p>
      </section>

      <section>
        <h2>2. Data we collect</h2>
        <ul>
          <li>
            <strong>Account data:</strong> details such as your username, email
            address, encrypted authentication credentials, and account settings.
          </li>
          <li>
            <strong>Fitness data:</strong> routines, exercises, sets, weights,
            repetitions, workout history, goals, body-weight entries, and related
            preferences you choose to provide.
          </li>
          <li>
            <strong>AI feature inputs:</strong> information you submit when
            asking Gains to generate a routine or other content, together with
            the generated result.
          </li>
          <li>
            <strong>Technical and usage data:</strong> device and browser type,
            approximate location derived from network information, page routes,
            interactions, timestamps, and diagnostic information.
          </li>
          <li>
            <strong>Cookie preferences:</strong> your choice about optional
            analytics storage, saved locally on your device.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. How and why we use data</h2>
        <p>We use personal data to:</p>
        <ul>
          <li>provide, secure, and maintain your account and the Gains service;</li>
          <li>store and present your training history and preferences;</li>
          <li>generate features and suggestions you request;</li>
          <li>diagnose faults, prevent misuse, and protect users;</li>
          <li>understand how Gains is used and improve it; and</li>
          <li>comply with legal obligations and enforce our terms.</li>
        </ul>
        <p>
          We generally process account and fitness data because it is necessary
          to provide the service you request. We rely on legitimate interests
          for security, limited cookieless measurement, service improvement, and
          fraud prevention where those interests are not overridden by your
          rights. We use non-essential analytics cookies or local storage only
          with your consent, which you may withdraw at any time.
        </p>
      </section>

      <section>
        <h2>4. Cookies, local storage, and PostHog</h2>
        <p>
          Gains uses strictly necessary cookies or browser storage for sign-in,
          security, core application functions, and remembering your cookie
          choice. These are required for the service and cannot be disabled in
          the cookie controls.
        </p>
        <p>
          We use PostHog to understand product usage. Until you enable Analytics,
          PostHog runs in cookieless mode: it does not use cookies or local or
          session storage to identify your browser, and measurement uses a
          privacy-preserving server-generated hash. If you enable Analytics,
          PostHog may use first-party cookies and local storage to recognise a
          browser across visits and provide more complete usage measurement.
        </p>
        <p>
          You can accept optional analytics from the banner, reject it from the
          options panel, or change your choice later under Privacy and cookies
          in Settings. Withdrawing consent removes PostHog persistence and
          returns analytics to cookieless mode. Your preference remains stored
          locally so we do not ask on every visit.
        </p>
      </section>

      <section>
        <h2>5. Sharing and processors</h2>
        <p>
          We do not sell your personal data. We may share data with service
          providers that host, secure, analyse, or support Gains, including
          PostHog for product analytics and AI providers when you request an
          AI-powered feature. They may process data only to provide their
          services to us and under appropriate contractual safeguards. We may
          also disclose data where required by law or necessary to protect
          rights, safety, and security.
        </p>
      </section>

      <section>
        <h2>6. International transfers</h2>
        <p>
          Some providers may process data outside the United Kingdom. Where
          required, we use recognised safeguards such as adequacy regulations or
          approved contractual clauses to protect transferred data.
        </p>
      </section>

      <section>
        <h2>7. Retention</h2>
        <p>
          We keep account and fitness data while your account is active and for
          only as long afterwards as reasonably needed for legal, security,
          backup, and dispute-resolution purposes. Analytics and diagnostic data
          is retained according to configured provider retention periods. We may
          keep aggregated or anonymised information that no longer identifies
          you.
        </p>
      </section>

      <section>
        <h2>8. Security</h2>
        <p>
          We use technical and organisational safeguards designed to protect
          personal data, including access controls, encrypted connections, and
          password hashing. No internet service can guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>9. Your data protection rights</h2>
        <p>
          Depending on the circumstances, UK data protection law gives you the
          right to request access, correction, deletion, restriction, objection,
          or portability of your personal data and to withdraw consent without
          affecting earlier lawful processing. You may also complain to the UK
          Information Commissioner’s Office.
        </p>
        <p>
          Gains includes tools to export certain data. You can exercise your
          cookie choice at any time in Settings. Other privacy requests may be
          made to Akhere I. through the contact channel provided with the Gains
          service. We may need to verify your identity before completing a
          request.
        </p>
      </section>

      <section>
        <h2>10. Children</h2>
        <p>
          Gains is not intended for children under 18, and we do not knowingly
          collect their personal data. If you believe a child has provided data,
          please notify us so it can be investigated and removed where
          appropriate.
        </p>
      </section>

      <section>
        <h2>11. Changes to this policy</h2>
        <p>
          We may update this policy as Gains or applicable law changes. The date
          above shows the latest revision. Material changes will be communicated
          through the service where appropriate.
        </p>
      </section>
    </LegalPage>
  );
}
