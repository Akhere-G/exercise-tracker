import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Target of the redirect in handleApiError when the API rejects the session
// token. Clears the session cookies so the proxy does not bounce the user
// from /login straight back into the app, then sends them to log in.
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("demo_session");

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  return NextResponse.redirect(loginUrl);
}
