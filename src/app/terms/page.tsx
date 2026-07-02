import { LegalPage } from "@/components/playbeat/legal-page";

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      subtitle="The terms and conditions for using Playbeat Digital and purchasing digital products."
      lastUpdated="July 2, 2026"
      sections={[
        {
          heading: "1. Acceptance of Terms",
          body: (
            <>
              <p>
                By accessing or using playbeat.digital (&quot;the
                Service&quot;), you agree to be bound by these Terms of
                Service (&quot;Terms&quot;). If you do not agree to these
                Terms, please do not use the Service.
              </p>
              <p>
                These Terms form a legally binding agreement between you and
                Playbeat Digital Pvt Ltd (&quot;Playbeat&quot;,
                &quot;we&quot;, &quot;us&quot;).
              </p>
            </>
          ),
        },
        {
          heading: "2. Digital Products & Licenses",
          body: (
            <>
              <p>
                Playbeat sells digital products including software licenses,
                subscription accounts, game keys, gift cards, AI tools, and
                downloadable content. Each product is governed by its
                specific license type:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Subscriptions:</strong> granted for the paid period (monthly/annual). Access revokes when the subscription expires.</li>
                <li><strong>Software licenses:</strong> single-seat unless otherwise stated. Sharing license keys is prohibited.</li>
                <li><strong>Game keys & gift cards:</strong> one-time-use codes. Redeem promptly — we are not liable for expired or region-locked codes.</li>
                <li><strong>Digital downloads:</strong> lifetime access to the version purchased. Updates may require a new purchase.</li>
              </ul>
            </>
          ),
        },
        {
          heading: "3. Orders & Payment",
          body: (
            <>
              <p>
                All prices are listed in PKR (Pakistani Rupee) for customers
                in Pakistan and USD for international customers. Prices may
                change without notice.
              </p>
              <p>
                Payments are processed by Lemon Squeezy. By placing an order,
                you authorize Lemon Squeezy to charge your payment method for
                the full amount. Orders are confirmed instantly upon
                successful payment.
              </p>
            </>
          ),
        },
        {
          heading: "4. Instant Delivery",
          body: (
            <>
              <p>
                Most digital products are delivered instantly. Upon successful
                payment, your license key, download link, or account
                credentials will be available in your account dashboard and
                sent to your registered email.
              </p>
              <p>
                If you do not receive your product within 60 seconds, contact
                us via WhatsApp (0332 102 9333) with your order number.
              </p>
            </>
          ),
        },
        {
          heading: "5. Acceptable Use",
          body: (
            <>
              <p>You agree NOT to:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Resell, redistribute, or share purchased license keys or accounts.</li>
                <li>Use products for illegal activities or in violation of the product&apos;s own terms.</li>
                <li>Attempt to reverse-engineer, decompile, or hack any product.</li>
                <li>Use bots, scrapers, or automated tools to access the Service.</li>
                <li>Create multiple accounts to abuse promotions or discounts.</li>
              </ul>
              <p>
                Violation of these terms may result in immediate account
                suspension and revocation of licenses without refund.
              </p>
            </>
          ),
        },
        {
          heading: "6. Refunds",
          body: (
            <>
              <p>
                Refunds are governed by our separate{" "}
                <a href="/refund-policy" className="text-accent hover:underline">
                  Refund Policy
                </a>
                . In summary: digital products are non-refundable once
                delivered, except in cases of non-delivery, defective
                products, or duplicate charges.
              </p>
            </>
          ),
        },
        {
          heading: "7. Warranties & Disclaimers",
          body: (
            <>
              <p>
                Products are provided &quot;as is&quot; without warranties of
                any kind. We do not guarantee that any product will be
                error-free, uninterrupted, or compatible with your system.
              </p>
              <p>
                We are not liable for indirect, incidental, or consequential
                damages arising from the use of any product. Our total
                liability shall not exceed the amount you paid for the
                product in question.
              </p>
            </>
          ),
        },
        {
          heading: "8. Account Security",
          body: (
            <>
              <p>
                You are responsible for maintaining the confidentiality of
                your account credentials. Notify us immediately of any
                unauthorized use. We are not liable for losses from
                compromised accounts.
              </p>
            </>
          ),
        },
        {
          heading: "9. Termination",
          body: (
            <>
              <p>
                We may suspend or terminate your account at any time for
                violation of these Terms. Upon termination, your right to use
                the Service ceases, but your purchased licenses remain valid
                per their terms.
              </p>
            </>
          ),
        },
        {
          heading: "10. Governing Law",
          body: (
            <>
              <p>
                These Terms are governed by the laws of the Islamic Republic
                of Pakistan. Any disputes shall be resolved in the courts of
                Karachi, Pakistan.
              </p>
            </>
          ),
        },
        {
          heading: "11. Changes to Terms",
          body: (
            <>
              <p>
                We may update these Terms at any time. Continued use of the
                Service after changes constitutes acceptance of the new
                Terms. The &quot;Last updated&quot; date reflects the most
                recent revision.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
