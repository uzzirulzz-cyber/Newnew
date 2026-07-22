import { NextRequest, NextResponse } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import {
  isJazzCashConfigured,
  generateTxnRefNo,
  buildSdkConfig,
} from "@/lib/jazzcash";

/**
 * GET /api/v1/payments/jazzcash/sdk
 *
 * JazzCash Mobile SDK / JS Button integration.
 * Serves an HTML page with a jazzCashButton.init() payment button.
 *
 * The SDK button handles the entire payment flow inline and calls
 * onSuccess/onFailure callbacks with a transactionResponse:
 *   { transactionReferenceNumber, responseCode, responseDescription, rrn }
 *
 * Response codes: "200" = success (SDK mode), others = failure
 *
 * Query params:
 *   amount       — PKR amount (e.g. 1000)
 *   description  — transaction description
 *   billRef      — invoice/bill reference
 *   email        — customer email (optional)
 *   mobile       — customer mobile (optional)
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  if (!isJazzCashConfigured()) {
    return error(
      "JazzCash is not configured. Set JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, and JAZZCASH_INTEGRITY_SALT in .env",
      503,
    );
  }

  const { searchParams } = new URL(request.url);
  const amount = Number(searchParams.get("amount") || "0");
  const description = searchParams.get("description") || "Payment";
  const billRef = searchParams.get("billRef") || `INV-${Date.now()}`;
  const email = searchParams.get("email") || "";
  const mobile = searchParams.get("mobile") || "";

  if (amount <= 0) {
    return error("A valid amount query param is required (e.g. ?amount=1000)", 422);
  }

  const txnRefNo = generateTxnRefNo();
  const { config, sdkJsUrl } = buildSdkConfig({
    txnRefNo,
    amount,
    description,
    billReference: billRef,
    customerEmail: email,
    customerMobile: mobile,
    invoiceRefNumber: billRef,
  });

  const returnUrl =
    process.env.JAZZCASH_RETURN_URL ||
    `${request.nextUrl.origin}/api/v1/payments/jazzcash/return`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pay with JazzCash</title>
  <script src="https://code.jquery.com/jquery-2.2.4.min.js"></script>
  <script src="${sdkJsUrl}"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f0f1a; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; max-width: 420px; width: 100%; backdrop-filter: blur(20px); text-align: center; }
    h2 { font-size: 22px; margin-bottom: 8px; }
    .subtitle { color: #94a3b8; font-size: 13px; margin-bottom: 24px; }
    .amount-display .label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
    .amount-display .value { font-size: 36px; font-weight: 700; color: #3b82f6; margin-top: 4px; margin-bottom: 24px; }
    #button { margin: 0 auto; }
    #result { margin-top: 24px; padding: 16px; border-radius: 8px; display: none; }
    #result.success { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); }
    #result.failure { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); }
    #result .code { font-size: 14px; margin-top: 4px; }
    #result .rrn { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .secure-badge { margin-top: 16px; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Pay with JazzCash</h2>
    <p class="subtitle">Secure payment via JazzCash SDK</p>

    <div class="amount-display">
      <div class="label">Amount Due</div>
      <div class="value">Rs ${amount.toLocaleString()}</div>
    </div>

    <!-- JazzCash SDK button container -->
    <div id="button"></div>

    <!-- Result display -->
    <div id="result"></div>

    <div class="secure-badge">&#x1F512; Secured by JazzCash · 3D Secure · PCI Compliant</div>
  </div>

  <script>
    // Sample paymentConfig — generated server-side
    var paymentConfig = ${JSON.stringify(config, null, 4)};

    // Initialize the JazzCash payment button
    jazzCashButton.init('button', paymentConfig);

    // onSuccess callback — transaction completed successfully
    jazzCashButton.onSuccess = function (transactionResponse) {
      var resultDiv = document.getElementById('result');
      resultDiv.className = 'success';
      resultDiv.style.display = 'block';
      resultDiv.innerHTML =
        '<p style="font-size:16px;font-weight:600;color:#22c55e;">&#x2705; Payment Successful</p>' +
        '<div class="code">Response: ' + transactionResponse.responseDescription + '</div>' +
        '<div class="code">Code: ' + transactionResponse.responseCode + '</div>' +
        '<div class="rrn">RRN: ' + transactionResponse.rrn + '</div>' +
        '<div class="rrn">Ref: ' + transactionResponse.transactionReferenceNumber + '</div>';

      // Redirect to return URL after 3 seconds
      setTimeout(function() {
        window.location.href = '${returnUrl}?pp_ResponseCode=' + transactionResponse.responseCode +
          '&pp_ResponseMessage=' + encodeURIComponent(transactionResponse.responseDescription) +
          '&pp_TxnRefNo=' + transactionResponse.transactionReferenceNumber +
          '&pp_RetreivalReferenceNo=' + transactionResponse.rrn;
      }, 3000);
    };

    // onFailure callback — transaction failed
    jazzCashButton.onFailure = function (transactionResponse) {
      var resultDiv = document.getElementById('result');
      resultDiv.className = 'failure';
      resultDiv.style.display = 'block';
      resultDiv.innerHTML =
        '<p style="font-size:16px;font-weight:600;color:#ef4444;">&#x274C; Payment Failed</p>' +
        '<div class="code">Response: ' + transactionResponse.responseDescription + '</div>' +
        '<div class="code">Code: ' + transactionResponse.responseCode + '</div>' +
        '<div class="rrn">Ref: ' + transactionResponse.transactionReferenceNumber + '</div>';
    };
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
