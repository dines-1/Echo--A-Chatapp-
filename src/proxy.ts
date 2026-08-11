import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const isAuthenticated = !!token;
  const isAuthPage = pathname.startsWith("/login");
  const isChatPage = pathname.startsWith("/chat");
  const isAdminPage = pathname.startsWith("/admin");

  // 1. If trying to access protected routes without authentication -> redirect to /login
  if (!isAuthenticated && (isChatPage || isAdminPage)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If authenticated user attempts to open /login -> redirect based on role
  if (isAuthenticated && isAuthPage) {
    if (token?.role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.redirect(new URL("/chat", req.url));
  }

  // 3. If customer attempts to access /admin -> redirect to /chat
  if (isAuthenticated && isAdminPage && token?.role !== "admin") {
    return NextResponse.redirect(new URL("/chat", req.url));
  }

  return NextResponse.next();
}

// Backward compatibility alias
export const middleware = proxy;

export const config = {
  matcher: ["/chat/:path*", "/admin/:path*", "/login"],
};
