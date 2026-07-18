import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Log In — PlayBeat Digital</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f0f0f1;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.login{background:#fff;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);padding:40px;max-width:400px;width:90%}
.login h1{text-align:center;margin-bottom:30px;font-size:20px;color:#1d2327}
.login h1 a{color:#2271b1;text-decoration:none}
.login form{display:flex;flex-direction:column;gap:16px}
.login label{font-size:13px;color:#646970;font-weight:600}
.login input{padding:8px 12px;border:1px solid #8c8f94;border-radius:4px;font-size:14px}
.login button{background:#2271b1;color:#fff;border:none;padding:10px;border-radius:4px;font-size:14px;cursor:pointer}
.login button:hover{background:#135e96}
.login .nav{margin-top:20px;text-align:center}
.login .nav a{color:#2271b1;text-decoration:none;font-size:13px}
</style>
</head>
<body class="login">
<div class="login">
<h1><a href="/">PlayBeat Digital</a></h1>
<form method="post" action="/wp-login.php">
<label>Username or Email<br><input type="text" name="log" size="20"></label>
<label>Password<br><input type="password" name="pwd" size="20"></label>
<button type="submit" name="wp-submit">Log In</button>
</form>
<div class="nav">
<a href="/">← Back to PlayBeat Digital</a>
</div>
</div>
</body>
</html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}

export async function POST() {
  // Redirect to admin after "login"
  return NextResponse.redirect("https://playbeat.digital/admin", { status: 302 });
}
