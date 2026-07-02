import { LegalPage } from "@/components/playbeat/legal-page";

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund Policy"
      subtitle="Our policy for refunds, replacements, and chargebacks on digital products."
      lastUpdated="July 2, 2026"
      sections={[
        {
          heading: "1. Digital Products Are Non-Refundable",
          body: (
            <>
              <p>
                Due to the nature of digital products (license keys, game
                codes, subscriptions, downloadable files), all sales are
                final and <strong>non-refundable</strong> once the product
                has been delivered to you.
              </p>
              <p>
                Once a license key is displayed in your dashboard or emailed
                to you, it cannot be returned, resold, or revoked — therefore
                we cannot issue a refund.
              </p>
            </>
          ),
        },
        {
          heading: "2. Eligible Refund Cases",
          body: (
            <>
              <p>
                We will issue a full refund or replacement in the following
                situations:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>Non-delivery:</strong> You paid but never received
                  your product (no license key, no email, nothing in your
                  dashboard) within 24 hours.
                </li>
                <li>
                  <strong>Defective product:</strong> The license key or
                  download is invalid, already used, or doesn&apos;t match
                  the product description.
                </li>
                <li>
                  <strong>Duplicate charge:</strong> You were charged twice
                  for the same order.
                </li>
                <li>
                  <strong>Wrong product delivered:</strong> You received a
                  different product than what you ordered.
                </li>
              </ul>
              <p>
                Refund requests for eligible cases must be submitted within
                <strong> 7 days</strong> of the purchase date.
              </p>
            </>
          ),
        },
        {
          heading: "3. Non-Eligible Refund Cases",
          body: (
            <>
              <p>We will NOT issue refunds in the following cases:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>You changed your mind after receiving a working product.</li>
                <li>The product was delivered successfully and the key/code is valid.</li>
                <li>You purchased the wrong product or wrong region/edition.</li>
                <li>You failed to redeem a game key or gift card within the product&apos;s own validity period.</li>
                <li>The subscription was activated and used (even partially).</li>
                <li>You violated our Terms of Service and your account was suspended.</li>
              </ul>
            </>
          ),
        },
        {
          heading: "4. How to Request a Refund",
          body: (
            <>
              <p>To request a refund, contact us with:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Your order number (starts with <code className="rounded bg-muted px-1 text-xs">PB-</code>)</li>
                <li>A description of the issue</li>
                <li>Screenshot evidence (if the key is invalid or the product is defective)</li>
              </ul>
              <p>
                <strong>WhatsApp:</strong>{" "}
                <a href="https://wa.me/923321029333" className="text-accent hover:underline">
                  0332 102 9333
                </a>
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a href="mailto:info@playbeat.digital" className="text-accent hover:underline">
                  info@playbeat.digital
                </a>
              </p>
              <p>
                We will review your request within <strong>48 hours</strong>{" "}
                and respond with a decision.
              </p>
            </>
          ),
        },
        {
          heading: "5. Refund Method",
          body: (
            <>
              <p>
                Approved refunds are processed back to the original payment
                method via Lemon Squeezy. Depending on your bank, it may take
                <strong> 5–10 business days</strong> for the refund to appear
                on your statement.
              </p>
              <p>
                For Pakistani customers who paid via JazzCash, EasyPaisa, or
                bank transfer, refunds are sent to the original account
                within <strong>3–5 business days</strong>.
              </p>
            </>
          ),
        },
        {
          heading: "6. Replacements",
          body: (
            <>
              <p>
                If a license key or code is defective, we will first attempt
                to provide a <strong>replacement</strong> key before issuing
                a refund. If a replacement is not available, a full refund
                will be issued.
              </p>
            </>
          ),
        },
        {
          heading: "7. Chargebacks",
          body: (
            <>
              <p>
                Please contact us before initiating a chargeback with your
                bank or Lemon Squeezy. Unjustified chargebacks may result in:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Account suspension and revocation of all purchased licenses.</li>
                <li>Being blacklisted from future purchases.</li>
                <li>Legal action for payment fraud under Pakistani law.</li>
              </ul>
              <p>
                We work hard to resolve issues quickly — WhatsApp us first
                and we&apos;ll make it right.
              </p>
            </>
          ),
        },
        {
          heading: "8. Subscription Cancellations",
          body: (
            <>
              <p>
                Subscription products (e.g. Netflix, Spotify) can be
                cancelled at any time, but no partial refund is given for
                the remaining period. The subscription remains active until
                the end of the paid cycle.
              </p>
              <p>
                To stop a recurring subscription, contact us at least
                <strong> 3 days before</strong> your renewal date.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
