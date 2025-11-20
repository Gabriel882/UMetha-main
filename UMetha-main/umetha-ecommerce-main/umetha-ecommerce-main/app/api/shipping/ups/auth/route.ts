import { NextRequest, NextResponse } from "next/server";

const UPS_CLIENT_ID = process.env.UPS_CLIENT_ID!;
const UPS_REDIRECT_URI = process.env.UPS_REDIRECT_URI!;
const UPS_AUTH_URL = "https://wwwcie.ups.com/ups/oauth/authorize";

export async function GET(req: NextRequest) {
  const url = new URL(UPS_AUTH_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", UPS_CLIENT_ID);
  url.searchParams.set("redirect_uri", UPS_REDIRECT_URI);
  url.searchParams.set("scope", "ship"); // adjust scopes

  return NextResponse.redirect(url.toString());
}
