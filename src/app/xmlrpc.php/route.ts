import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsd version="1.0" xmlns="http://archipelago.phrasewise.com/rsd">
  <service>
    <engineName>WordPress</engineName>
    <engineLink>https://wordpress.org/</engineLink>
    <homePageLink>https://playbeat.digital/</homePageLink>
    <apis>
      <api name="WordPress" blogID="1" preferred="true" apiLink="https://playbeat.digital/xmlrpc.php" />
      <api name="WooCommerce" blogID="1" preferred="true" apiLink="https://playbeat.digital/wp-json/wc/v3/" />
    </apis>
  </service>
</rsd>`;
  return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
}

export async function POST() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<methodResponse>
  <params><param><value><struct>
    <member><name>faultCode</name><value><int>403</int></value></member>
    <member><name>faultString</name><value><string>Incorrect username or password.</string></value></member>
  </struct></value></param></params>
</methodResponse>`;
  return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
}
