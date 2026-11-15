import type { Metadata } from "next";
import { LegalPage } from "@/src/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms | Gains",
  description: "The terms governing use of Gains.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="15 November 2026">
      <section>
        <h2>1. About these terms</h2>
        <p>
          These Terms of Service govern your access to and use of Gains, a
          fitness tracking service operated by Akhere I. By creating an account
          or using Gains, you agree to these terms. If you do not agree, do not
          use the service.
        </p>
      </section>

      <section>
        <h2>2. Eligibility and accounts</h2>
        <p>
          You must be at least 18 years old to create an account. You are
          responsible for providing accurate information, keeping your login
          details secure, and all activity under your account. Tell us promptly
          if you believe your account has been accessed without permission.
        </p>
      </section>

      <section>
        <h2>3. Fitness and health disclaimer</h2>
        <p>
          Gains provides tools for recording workouts and general fitness
          information. It does not provide medical advice, diagnosis, or
          treatment. Recommendations, progression suggestions, burnout signals,
          and generated workout plans are informational and may not be suitable
          for you.
        </p>
        <p>
          Consult a qualified healthcare professional before starting or
          changing an exercise programme, particularly if you have an injury,
          medical condition, or other concern. Stop exercising and seek
          appropriate help if you experience pain, dizziness, breathing
          difficulty, or other concerning symptoms. You remain responsible for
          exercising safely and within your abilities.
        </p>
      </section>

      <section>
        <h2>4. AI-generated content</h2>
        <p>
          Some features may use artificial intelligence to generate routines or
          other suggestions. AI output can be incomplete, inaccurate, or
          unsuitable. Review it before use and do not rely on it as professional
          medical or coaching advice.
        </p>
      </section>

      <section>
        <h2>5. Acceptable use</h2>
        <p>You must not:</p>
        <ul>
          <li>use Gains unlawfully or to harm another person;</li>
          <li>attempt to gain unauthorised access to the service or its data;</li>
          <li>interfere with the service, security controls, or other users;</li>
          <li>upload malicious code or misuse automated access; or</li>
          <li>copy, resell, or exploit Gains except as the law permits.</li>
        </ul>
      </section>

      <section>
        <h2>6. Your content and data</h2>
        <p>
          You retain ownership of information you enter into Gains. You give us
          permission to host, process, back up, and display that information as
          needed to operate and improve the service. Our Privacy Policy explains
          how personal data is handled.
        </p>
      </section>

      <section>
        <h2>7. Service availability and changes</h2>
        <p>
          We may update, suspend, or discontinue features. We aim to keep Gains
          available and accurate, but do not guarantee uninterrupted access,
          error-free operation, or that stored data will never be lost. Keep
          copies of information that is important to you.
        </p>
      </section>

      <section>
        <h2>8. Intellectual property</h2>
        <p>
          Gains, including its software, design, branding, and service content,
          belongs to Akhere I. or its licensors and is protected by applicable
          intellectual property law. These terms give you a personal,
          non-exclusive, non-transferable right to use the service.
        </p>
      </section>

      <section>
        <h2>9. Suspension and termination</h2>
        <p>
          You may stop using Gains at any time. We may restrict or terminate
          access where reasonably necessary to protect the service or others,
          comply with law, or respond to a serious or repeated breach of these
          terms.
        </p>
      </section>

      <section>
        <h2>10. Liability</h2>
        <p>
          Nothing in these terms excludes liability that cannot lawfully be
          excluded, including liability for death or personal injury caused by
          negligence, fraud, or fraudulent misrepresentation. Subject to that,
          Gains is provided on an “as available” basis and Akhere I. is not
          responsible for indirect or unforeseeable loss arising from your use
          of the service.
        </p>
        <p>
          If you use Gains as a consumer, your statutory rights are not affected.
        </p>
      </section>

      <section>
        <h2>11. Changes to these terms</h2>
        <p>
          We may update these terms to reflect changes to Gains, the law, or our
          practices. The date above shows when they were last updated. Material
          changes will be communicated through the service where appropriate.
        </p>
      </section>

      <section>
        <h2>12. Governing law</h2>
        <p>
          These terms are governed by the laws of England and Wales. If you are
          a consumer, you may also benefit from mandatory protections and bring
          proceedings in the part of the United Kingdom where you live.
        </p>
      </section>
    </LegalPage>
  );
}
