import { LegalPage } from "@/components/playbeat/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="How Playbeat Digital collects, uses, and protects your personal information."
      lastUpdated="July 2, 2026"
      sections={[
        {
          heading: "1. Introduction",
          body: (
            <>
              <p>
                Playbeat Digital Pvt Ltd (&quot;Playbeat&quot;, &quot;we&quot;,
                &quot;us&quot;, or &quot;our&quot;) operates a digital
                marketplace at playbeat.digital where customers can purchase
                digital products, subscriptions, game keys, gift cards, and
                software licenses. This Privacy Policy explains how we collect,
                use, disclose, and safeguard your information.
              </p>
              <p>
                By using our website or purchasing any product, you consent to
                the practices described in this policy.
              </p>
            </>
          ),
        },
        {
          heading: "2. Information We Collect",
          body: (
            <>
              <p>We collect the following types of information:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>Account information:</strong> name, email address,
                  and password (hashed) when you register.
                </li>
                <li>
                  <strong>Payment information:</strong> processed securely by
                  Lemon Squeezy. We do not store your card details — only the
                  transaction ID and payment status.
                </li>
                <li>
                  <strong>Order information:</strong> products purchased,
                  order numbers, license keys, and download history.
                </li>
                <li>
                  <strong>Communication data:</strong> messages you send via
                  WhatsApp, email, or our contact forms.
                </li>
                <li>
                  <strong>Technical data:</strong> IP address, browser type,
                  and usage data collected via cookies and analytics.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "3. How We Use Your Information",
          body: (
            <>
              <p>We use your information to:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Process and fulfill your orders, including instant delivery of digital products.</li>
                <li>Generate and deliver license keys and download links.</li>
                <li>Send order confirmations, receipts, and product updates.</li>
                <li>Provide customer support via WhatsApp and email.</li>
                <li>Detect and prevent fraud, abuse, and unauthorized access.</li>
                <li>Comply with legal obligations under Pakistani and international law.</li>
              </ul>
            </>
          ),
        },
        {
          heading: "4. Payment Processing",
          body: (
            <>
              <p>
                All payments are processed by <strong>Lemon Squeezy</strong>,
                our merchant of record. Lemon Squeezy handles card collection,
                3D Secure authentication, and PCI-DSS compliance. We never see
                or store your full card number, CVV, or banking credentials.
              </p>
              <p>
                For Pakistani customers, we also accept JazzCash, EasyPaisa,
                and local bank transfers via Lemon Squeezy&apos;s supported
                methods.
              </p>
            </>
          ),
        },
        {
          heading: "5. Cookies & Tracking",
          body: (
            <>
              <p>
                We use essential cookies to keep you logged in and remember
                your cart. We also use analytics cookies to understand how
                visitors use our site so we can improve it. You can disable
                cookies in your browser settings, but some features may not
                work correctly.
              </p>
            </>
          ),
        },
        {
          heading: "6. Data Sharing",
          body: (
            <>
              <p>
                We do not sell your personal information. We share data only
                with:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Lemon Squeezy</strong> — for payment processing and order fulfillment.</li>
                <li><strong>Hosting providers</strong> — for database and application hosting (Neon PostgreSQL).</li>
                <li><strong>Legal authorities</strong> — when required by law or to protect our rights.</li>
              </ul>
            </>
          ),
        },
        {
          heading: "7. Data Security",
          body: (
            <>
              <p>
                We protect your data with industry-standard measures including
                SSL/TLS encryption in transit, hashed passwords (bcrypt),
                JWT-based authentication, and role-based access control. Our
                database is hosted on Neon&apos;s secure PostgreSQL platform
                with encryption at rest.
              </p>
              <p>
                Despite these measures, no internet transmission is 100%
                secure. We cannot guarantee absolute security but we strive to
                protect your information.
              </p>
            </>
          ),
        },
        {
          heading: "8. Your Rights",
          body: (
            <>
              <p>You have the right to:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Access the personal data we hold about you.</li>
                <li>Request correction of inaccurate data.</li>
                <li>Request deletion of your account and associated data.</li>
                <li>Opt out of marketing communications at any time.</li>
                <li>Export your order history and license keys.</li>
              </ul>
              <p>
                To exercise these rights, email{" "}
                <a href="mailto:info@playbeat.digital" className="text-accent hover:underline">
                  info@playbeat.digital
                </a>
                .
              </p>
            </>
          ),
        },
        {
          heading: "9. Children's Privacy",
          body: (
            <>
              <p>
                Our services are not intended for individuals under 16. We do
                not knowingly collect personal information from children. If
                you believe a child has provided us with personal data, please
                contact us and we will delete it.
              </p>
            </>
          ),
        },
        {
          heading: "10. Changes to This Policy",
          body: (
            <>
              <p>
                We may update this Privacy Policy from time to time. Changes
                will be posted on this page with an updated &quot;Last
                updated&quot; date. We encourage you to review this policy
                periodically.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
