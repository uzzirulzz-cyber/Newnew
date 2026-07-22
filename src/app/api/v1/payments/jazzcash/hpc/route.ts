import { NextRequest, NextResponse } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import {
  isJazzCashConfigured,
  generateTxnRefNo,
  computeHpcSecureHash,
  computeSecureHash,
} from "@/lib/jazzcash";

/**
 * GET /api/v1/payments/jazzcash/hpc
 *
 * JazzCash Hosted Payment Checkout (HPC V1.1) — serves an HTML checkout page
 * that uses PayChk3DS.js to embed the payment form directly on the merchant's
 * page (inline checkout with 3D Secure).
 *
 * This mirrors the OFFICIAL .NET MVC HPC Card implementation exactly:
 *   1. Server generates pp_payload with HPC-specific HMAC-SHA256 secure hash
 *   2. Page loads jQuery 2.2.4 + PayChk3DS.js from JazzCash sandbox/live
 *   3. populateJazzCashFields(pp_payload) injects payment fields into #JazzCashFields
 *   4. Customer completes payment inline (3D Secure if enrolled)
 *   5. invokeCompletion() callback receives Response JSON via postMessage
 *   6. Form POSTs Response to /api/v1/payments/jazzcash/return
 *
 * ─── HPC hash calculation (DIFFERENT from Page Redirection) ───────────
 * HPC uses a FIXED field order (NOT alphabetical) and a SUBSET of fields:
 *   salt & pp_Amount & pp_BillReference & pp_Description &
 *   pp_DiscountedAmount & pp_DiscountBank & pp_MerchantID &
 *   pp_Password & pp_TxnCurrency & pp_TxnDateTime & pp_TxnExpiryDateTime &
 *   pp_TxnRefNo & pp_TxnType & pp_Version
 *
 * Empty values are SKIPPED (matching `if (pp_X != '')` in the sample).
 * Trailing `&` is removed (matching `hashString.slice(0, -1)`).
 *
 * HPC does NOT include: pp_Language, pp_SubMerchantID, pp_ReturnURL,
 * ppmpf_1-5, pp_BankID, pp_ProductID, pp_Email, pp_MobileNumber, pp_CNIC.
 *
 * Query params:
 *   amount       — PKR amount (e.g. 1000)
 *   description  — transaction description
 *   billRef      — bill reference (e.g. order number)
 *   txnType      — "MPAY" (Card, default), "MWALLET", or "OTC"
 *   email        — customer email (optional)
 *   mobile       — customer mobile (optional)
 *   discountedAmount — discounted amount in PKR (optional, e.g. 90 for Rs 90)
 *   discountBank — discount bank code (optional)
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
  const billRef = searchParams.get("billRef") || `ORDER-${Date.now()}`;
  const txnType = (searchParams.get("txnType") || "MPAY").toUpperCase();
  const email = searchParams.get("email") || "";
  const mobile = searchParams.get("mobile") || "";
  const discountedAmountParam = searchParams.get("discountedAmount");
  const discountBank = searchParams.get("discountBank") || "";

  if (amount <= 0) {
    return error("A valid amount query param is required (e.g. ?amount=1000)", 422);
  }

  const merchantId = process.env.JAZZCASH_MERCHANT_ID!;
  const password = process.env.JAZZCASH_PASSWORD!;
  const salt = process.env.JAZZCASH_INTEGRITY_SALT!;

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const txnDateTime =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const txnExpiryDateTime =
    `${expiry.getFullYear()}${pad(expiry.getMonth() + 1)}${pad(expiry.getDate())}` +
    `${pad(expiry.getHours())}${pad(expiry.getMinutes())}${pad(expiry.getSeconds())}`;

  const txnRefNo = generateTxnRefNo();
  const origin = new URL(request.url).origin;
  const returnUrl = `${origin}/api/v1/payments/jazzcash/return`;

  // MPAY (Card) uses HPC hash + PayChk3DS.js
  // MWALLET/OTC uses Page Redirection hash + ChkOut.js
  const isCard = txnType === "MPAY";

  // Build the pp_payload object — matches the official HPC sample structure
  const payload: Record<string, string> = {
    pp_Version: "1.1",
    pp_MerchantID: merchantId,
    pp_TxnType: txnType,
    pp_Password: password,
    pp_TxnRefNo: txnRefNo,
    pp_DiscountedAmount:
      discountedAmountParam && Number(discountedAmountParam) > 0
        ? String(Math.round(Number(discountedAmountParam) * 100))
        : "",
    pp_DiscountBank: discountBank,
    pp_Amount: String(Math.round(amount * 100)), // paisa
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: txnDateTime,
    pp_TxnExpiryDateTime: txnExpiryDateTime,
    pp_BillReference: billRef,
    pp_Description: description,
    pp_SecureHash: "",
  };

  if (isCard) {
    // ─── HPC Card (MPAY) hash ─────────────────────────────────────────
    // Uses computeHpcSecureHash() — fixed field order, subset of fields.
    // Does NOT include pp_Language, pp_ReturnURL, ppmpf_1-5.
    payload.pp_SecureHash = computeHpcSecureHash(payload, salt);
  } else {
    // ─── MWALLET/OTC hash (Page Redirection style) ────────────────────
    // Adds the extra fields required by ChkOut.js and uses the
    // alphabetical-sort hash (computeSecureHash).
    payload.pp_Language = "EN";
    payload.pp_SubMerchantID = "";
    payload.pp_ReturnURL = returnUrl;
    payload.pp_BankID = "";
    payload.pp_ProductID = "";
    payload.pp_MobileNumber = mobile || "";
    payload.pp_CNIC = "";
    payload.ppmpf_1 = "1";
    payload.ppmpf_2 = "2";
    payload.ppmpf_3 = "3";
    payload.ppmpf_4 = "4";
    payload.ppmpf_5 = "5";
    payload.pp_SecureHash = computeSecureHash(payload, salt);
  }

  const sandbox = process.env.JAZZCASH_SANDBOX === "true";
  const jsUrl = isCard
    ? sandbox
      ? "https://sandbox.jazzcash.com.pk/HostedPay/Scripts/PayChk3DS.js"
      : "https://seeds.jazzcash.com.pk/HostedPay/Scripts/PayChk3DS.js"
    : sandbox
      ? "https://sandbox.jazzcash.com.pk/HostedPay/Scripts/ChkOut.js"
      : "https://seeds.jazzcash.com.pk/HostedPay/Scripts/ChkOut.js";

  // HTML structure mirrors the official .NET MVC HPC sample exactly:
  //   <form id="onlineform" action="..." method="post">
  //     <div id="myForm" style="display:none;"></div>
  //     <div id="JazzCashFields">
  //       <div id="JazzCashErrorDiv"></div>
  //       <div id="JazzCashSuccessDiv"></div>
  //     </div>
  //     <div id="merchant">optional fields</div>
  //     <button id="buttonsubmitPay" type="submit">Continue</button>
  //   </form>
  //   <div id="stagingForm"></div>
  //   <div id="pp_masterCardResponse"></div>
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Secure Checkout — JazzCash HPC</title>
  <!-- jQuery 2.2.4 — required by PayChk3DS.js (per official sample) -->
  <script src="https://code.jquery.com/jquery-2.2.4.min.js"></script>
  <!-- PayChk3DS.js — JazzCash Hosted Pay script (injects payment fields) -->
  <script src="${jsUrl}"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .checkout-container {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 32px;
      max-width: 480px;
      width: 100%;
      backdrop-filter: blur(20px);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    }
    h2 { font-size: 22px; margin-bottom: 8px; font-weight: 700; }
    .subtitle { color: #94a3b8; font-size: 13px; margin-bottom: 24px; }
    .amount-display { text-align: center; margin-bottom: 24px; padding: 16px; background: rgba(59, 130, 246, 0.1); border-radius: 12px; }
    .amount-display .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; }
    .amount-display .value { font-size: 36px; font-weight: 700; color: #60a5fa; margin-top: 4px; }
    .txn-meta { font-size: 12px; color: #64748b; text-align: center; margin-bottom: 20px; font-family: monospace; }
    #JazzCashFields { margin-bottom: 20px; min-height: 200px; }
    #JazzCashFields input,
    #JazzCashFields select {
      width: 100%;
      padding: 12px;
      margin-bottom: 10px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
      font-size: 14px;
    }
    #JazzCashFields input::placeholder { color: #64748b; }
    #JazzCashFields input:focus,
    #JazzCashFields select:focus {
      outline: none;
      border-color: #60a5fa;
      background: rgba(59, 130, 246, 0.1);
    }
    #JazzCashErrorDiv { color: #ef4444; font-size: 13px; margin-top: 8px; display: none; }
    #JazzCashSuccessDiv { color: #22c55e; font-size: 13px; margin-top: 8px; display: none; }
    #myForm { display: none; }
    #stagingForm { display: none; }
    #pp_masterCardResponse { display: none; }
    #merchant input {
      width: 100%;
      padding: 12px;
      margin-bottom: 8px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
      font-size: 14px;
    }
    #merchant input::placeholder { color: #64748b; }
    .btn-submit {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      margin-top: 8px;
    }
    .btn-submit:hover { opacity: 0.92; }
    .btn-submit:active { transform: scale(0.98); }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .secure-badge { text-align: center; margin-top: 16px; font-size: 11px; color: #64748b; }
    .secure-badge span { color: #22c55e; }
    .errorDiv { display: none; }
    #BlurWin { display: none; }
    .loader {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 0.8s linear infinite;
      vertical-align: middle;
      margin-right: 8px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="checkout-container">
    <h2>Secure Checkout</h2>
    <p class="subtitle">Powered by JazzCash Hosted Payment Checkout</p>

    <div class="amount-display">
      <div class="label">Amount Due</div>
      <div class="value">Rs ${amount.toLocaleString()}</div>
    </div>
    <div class="txn-meta">Ref: ${txnRefNo} · ${txnType}</div>

    <!-- Merchant form — action redirects to our return URL after JazzCash processes payment -->
    <form id="onlineform" action="${returnUrl}" method="post">
      <!-- Hidden field to receive the JSON Response from invokeCompletion() -->
      <input type="hidden" name="Response" id="Response" value="">
      <!-- Mastercard-injected form contents -->
      <div id="myForm" style="display:none;"></div>
      <!-- JazzCash-injected payment fields -->
      <div id="JazzCashFields">
        <div id="JazzCashErrorDiv" style="display: none; color: red;"></div>
        <div id="JazzCashSuccessDiv" style="display: none; color: green;"></div>
      </div>
      <!-- Optional merchant fields -->
      <div id="merchant">
        <input type="text" placeholder="Delivery Address (optional)" name="pp_Addr" id="pp_Addr">
        <input type="text" placeholder="Opt Field 1 (optional)" name="pp_op1" id="pp_op1">
        <input type="text" placeholder="Opt Field 2 (optional)" name="pp_op2" id="pp_op2">
      </div>
      <!-- Submit button -->
      <button class="btn-submit" id="buttonsubmitPay" type="submit">Pay Rs ${amount.toLocaleString()}</button>
    </form>

    <!-- Mastercard staging form (injected by PayChk3DS.js) -->
    <div id="stagingForm" style="display: none;"></div>
    <div id="pp_masterCardResponse" style="display: none;"></div>
    <div id="BlurWin"></div>

    <div class="secure-badge">
      <span>&#x1F512;</span> Secured by JazzCash · 3D Secure · PCI Compliant
    </div>
  </div>

  <script>
    $(document).ready(function () {
      // pp_payload — passed to populateJazzCashFields() which injects the
      // payment fields into #JazzCashFields. Matches the official sample.
      var pp_payload = ${JSON.stringify(payload, null, 6)};

      // Initialize JazzCash checkout — injects payment fields
      populateJazzCashFields(pp_payload);
      $('.errorDiv').hide();

      // Handle form submission — show processing state
      $('#onlineform').on('submit', function(e) {
        $('#buttonsubmitPay').prop('disabled', true).html('<span class="loader"></span>Processing...');
      });
    });

    // Listen for payment completion message from JazzCash iframe (postMessage API)
    $(function () {
      window.addEventListener("message", invokeCompletion, false);
    });

    // invokeCompletion — called by JazzCash when payment completes.
    // _paPayload.data contains the CheckOutResponseModel as a JSON string.
    // We set it in the #Response field and submit the form to our return URL.
    function invokeCompletion(_paPayload) {
      $("#BlurWin").fadeOut();
      // MVC Sample: set Response field with the JSON data, then submit
      $("#Response").val(_paPayload.data);
      document.forms[0].submit();
    }
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
