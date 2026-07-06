import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

const WALLETS = {
  BTC: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  ETH: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  USDT: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  USDC: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
};

const PKR_TO_CRYPTO: Record<string, number> = {
  BTC: 1 / 18000000,
  ETH: 1 / 950000,
  USDT: 1 / 280,
  USDC: 1 / 280,
};

const TOKEN_CONTRACTS: Record<string, string> = {
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
};

async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, { width: 280, margin: 2, color: { dark: "#0f172a", light: "#ffffff" }, errorCorrectionLevel: "M" });
  } catch { return ""; }
}

function formatCryptoAmount(pkrAmount: number, coin: string): string {
  const cryptoAmount = pkrAmount * (PKR_TO_CRYPTO[coin] || 0);
  if (coin === "BTC" || coin === "ETH") return cryptoAmount.toFixed(8).replace(/\.?0+$/, "");
  return cryptoAmount.toFixed(2);
}

function buildCryptoUri(coin: string, address: string, cryptoAmount: string): string {
  switch (coin) {
    case "BTC": return `bitcoin:${address}?amount=${cryptoAmount}`;
    case "ETH": return `ethereum:${address}?amount=${cryptoAmount}`;
    case "USDT": case "USDC": return `ethereum:${address}?value=${cryptoAmount}&token=${TOKEN_CONTRACTS[coin]}`;
    default: return address;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const amount = Number(searchParams.get("amount") || "0");
  const order = searchParams.get("order") || "";
  const desc = searchParams.get("desc") || "Payment";
  const email = searchParams.get("email") || "";

  const coins = ["BTC", "ETH", "USDT", "USDC"];
  const qrData: Record<string, { dataUrl: string; cryptoAmount: string; uri: string; address: string }> = {};

  for (const coin of coins) {
    const address = WALLETS[coin as keyof typeof WALLETS];
    const cryptoAmount = formatCryptoAmount(amount, coin);
    const uri = buildCryptoUri(coin, address, cryptoAmount);
    const dataUrl = await generateQrDataUrl(uri);
    qrData[coin] = { dataUrl, cryptoAmount, uri, address };
  }

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Crypto Payment — Order ${order}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%); color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .container { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 28px; max-width: 460px; width: 100%; backdrop-filter: blur(20px); box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
    h1 { font-size: 22px; margin-bottom: 6px; text-align: center; }
    .subtitle { color: #94a3b8; font-size: 13px; text-align: center; margin-bottom: 20px; }
    .amount-box { text-align: center; margin-bottom: 20px; padding: 16px; border-radius: 12px; background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12)); border: 1px solid rgba(59,130,246,0.25); }
    .amount-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
    .amount-value { font-size: 32px; font-weight: 700; color: #60a5fa; margin-top: 4px; }
    .amount-crypto { font-size: 13px; color: #a78bfa; margin-top: 4px; font-family: monospace; }
    .order-ref { font-size: 12px; color: #64748b; margin-top: 6px; font-family: monospace; }
    .tabs { display: flex; gap: 4px; margin-bottom: 16px; }
    .tab { flex: 1; padding: 10px 6px; text-align: center; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #94a3b8; transition: all 0.2s; user-select: none; }
    .tab.active { background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2)); border-color: rgba(59,130,246,0.4); color: #60a5fa; }
    .wallet-section { display: none; }
    .wallet-section.active { display: block; }
    .qr-container { width: 220px; height: 220px; margin: 0 auto 14px; background: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; padding: 8px; box-shadow: 0 4px 20px rgba(59,130,246,0.2); }
    .qr-container img { width: 100%; height: 100%; }
    .qr-hint { text-align: center; font-size: 11px; color: #94a3b8; margin-bottom: 12px; }
    .address-box { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px; margin-bottom: 12px; }
    .address-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .address-value { font-family: monospace; font-size: 12px; color: #60a5fa; word-break: break-all; display: flex; align-items: center; gap: 8px; line-height: 1.5; }
    .copy-btn { background: rgba(59,130,246,0.2); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; white-space: nowrap; transition: all 0.2s; }
    .copy-btn:hover { background: rgba(59,130,246,0.3); }
    .info { background: rgba(34,197,94,0.05); border: 1px solid rgba(34,197,94,0.2); border-radius: 10px; padding: 12px; margin-top: 16px; font-size: 12px; color: #94a3b8; line-height: 1.7; }
    .info strong { color: #4ade80; }
    .timer { text-align: center; margin-top: 14px; font-size: 13px; color: #fbbf24; font-weight: 600; }
    .btn-group { display: flex; gap: 8px; margin-top: 18px; }
    .btn { flex: 1; padding: 14px 16px; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; text-align: center; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .btn-primary { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; box-shadow: 0 4px 16px rgba(34,197,94,0.3); }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(34,197,94,0.4); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .btn-secondary { background: rgba(255,255,255,0.08); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1); }
    .btn-secondary:hover { background: rgba(255,255,255,0.12); }
    .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .success-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 100; align-items: center; justify-content: center; padding: 20px; }
    .success-overlay.active { display: flex; }
    .success-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(34,197,94,0.3); border-radius: 20px; padding: 32px; max-width: 400px; width: 100%; text-align: center; backdrop-filter: blur(20px); }
    .success-icon { width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 50%; background: rgba(34,197,94,0.2); display: flex; align-items: center; justify-content: center; font-size: 32px; }
    .license-list { text-align: left; margin-top: 16px; }
    .license-item { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 10px; margin-bottom: 8px; font-size: 12px; }
    .license-key { font-family: monospace; color: #4ade80; word-break: break-all; }
  </style></head>
<body>
  <div class="container">
    <h1>Crypto Payment</h1>
    <p class="subtitle">Scan QR with your wallet · BTC · ETH · USDT · USDC</p>
    <div class="amount-box">
      <div class="amount-label">Amount Due</div>
      <div class="amount-value">Rs ${amount.toLocaleString()}</div>
      <div class="amount-crypto" id="crypto-amount">${qrData.BTC.cryptoAmount} BTC</div>
      <div class="order-ref">Order: ${order}</div>
    </div>
    <div class="tabs">
      <div class="tab active" data-coin="BTC" onclick="showWallet('BTC')">BTC</div>
      <div class="tab" data-coin="ETH" onclick="showWallet('ETH')">ETH</div>
      <div class="tab" data-coin="USDT" onclick="showWallet('USDT')">USDT</div>
      <div class="tab" data-coin="USDC" onclick="showWallet('USDC')">USDC</div>
    </div>
    ${coins.map((coin, i) => `
    <div class="wallet-section ${i === 0 ? "active" : ""}" id="wallet-${coin}">
      <div class="qr-container">${qrData[coin].dataUrl ? `<img src="${qrData[coin].dataUrl}" alt="${coin} QR Code" />` : "<div style='color:#999;font-size:12px;'>QR unavailable</div>"}</div>
      <div class="qr-hint">Scan with ${coin === "BTC" ? "Bitcoin" : coin === "ETH" ? "Ethereum" : coin} wallet · or copy address below</div>
      <div class="address-box">
        <div class="address-label">${coin} Wallet Address ${coin !== "BTC" && coin !== "ETH" ? "(ERC-20)" : ""}</div>
        <div class="address-value">
          <span id="addr-${coin}">${qrData[coin].address}</span>
          <button class="copy-btn" onclick="copyAddress('${coin}', '${qrData[coin].address}', this)">Copy</button>
        </div>
      </div>
      <div class="address-box">
        <div class="address-label">Exact Amount to Send</div>
        <div class="address-value">
          <span style="color: #4ade80; font-weight: 600;">${qrData[coin].cryptoAmount} ${coin}</span>
          <button class="copy-btn" onclick="copyAmount('${qrData[coin].cryptoAmount}', this)">Copy</button>
        </div>
      </div>
    </div>
    `).join("")}
    <div class="info">
      <strong>How to pay:</strong><br>
      1. Open your crypto wallet (Binance, Trust Wallet, etc.)<br>
      2. Scan the QR code OR manually send to the address above<br>
      3. Send the <strong>exact amount</strong> shown (network fees apply)<br>
      4. Wait for the transaction to appear on the blockchain<br>
      5. Click <strong>"I've Paid — Complete"</strong> below<br>
      6. Your license keys will be delivered instantly<br><br>
      <strong>Email:</strong> ${email || "your email"}
    </div>
    <div class="timer">Payment window: <span id="countdown">30:00</span></div>
    <div class="btn-group">
      <a href="/" class="btn btn-secondary">Cancel</a>
      <button class="btn btn-primary" id="confirm-btn" onclick="confirmPayment()">
        <span id="btn-text">I've Paid — Complete</span>
      </button>
    </div>
  </div>
  <div class="success-overlay" id="success-overlay">
    <div class="success-card">
      <div class="success-icon">✅</div>
      <h2 style="font-size: 20px; margin-bottom: 8px;">Payment Confirmed!</h2>
      <p style="color: #94a3b8; font-size: 13px;">Your order is complete. License keys below.</p>
      <div class="license-list" id="license-list">Loading license keys…</div>
      <a href="/" class="btn btn-primary" style="margin-top: 16px; width: 100%;">← Back to Home</a>
    </div>
  </div>
  <script>
    const ORDER_NUMBER = ${JSON.stringify(order)};
    const CRYPTO_AMOUNTS = ${JSON.stringify(Object.fromEntries(coins.map(c => [c, qrData[c].cryptoAmount])))};
    function showWallet(coin) {
      document.querySelectorAll('.wallet-section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.getElementById('wallet-' + coin).classList.add('active');
      event.target.classList.add('active');
      document.getElementById('crypto-amount').textContent = CRYPTO_AMOUNTS[coin] + ' ' + coin;
    }
    function copyAddress(coin, addr, btn) {
      navigator.clipboard.writeText(addr).then(() => { const o = btn.textContent; btn.textContent = '✓ Copied'; setTimeout(() => btn.textContent = o, 2000); });
    }
    function copyAmount(amount, btn) {
      navigator.clipboard.writeText(amount).then(() => { const o = btn.textContent; btn.textContent = '✓ Copied'; setTimeout(() => btn.textContent = o, 2000); });
    }
    async function confirmPayment() {
      const btn = document.getElementById('confirm-btn');
      const btnText = document.getElementById('btn-text');
      btn.disabled = true;
      btnText.innerHTML = '<span class="spinner"></span> Confirming…';
      try {
        const res = await fetch('/api/v1/payments/crypto/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderNumber: ORDER_NUMBER, txHash: 'manual_confirm_' + Date.now(), walletAddress: 'customer_wallet' }) });
        const data = await res.json();
        if (data.success) {
          const licenseList = document.getElementById('license-list');
          const keys = (data.data.order.items || []).filter(i => i.licenseKey);
          if (keys.length > 0) { licenseList.innerHTML = keys.map(k => '<div class="license-item"><div style="color:#94a3b8;font-size:11px;margin-bottom:4px;">' + k.title + '</div><div class="license-key">' + k.licenseKey + '</div></div>').join(''); }
          else { licenseList.innerHTML = '<div style="color:#94a3b8;font-size:12px;">Order ' + data.data.order.orderNumber + ' confirmed.</div>'; }
          document.getElementById('success-overlay').classList.add('active');
        } else { alert(data.error?.message || 'Confirmation failed'); btn.disabled = false; btnText.textContent = "✓ I've Paid — Complete"; }
      } catch (e) { alert('Network error: ' + e.message); btn.disabled = false; btnText.textContent = "✓ I've Paid — Complete"; }
    }
    let seconds = 30 * 60;
    const countdown = document.getElementById('countdown');
    const interval = setInterval(() => { seconds--; const m = Math.floor(seconds / 60); const s = seconds % 60; countdown.textContent = m + ':' + s.toString().padStart(2, '0'); if (seconds <= 0) { clearInterval(interval); countdown.textContent = 'Expired'; countdown.style.color = '#ef4444'; } }, 1000);
  </script>
</body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store, no-cache, must-revalidate" } });
}
