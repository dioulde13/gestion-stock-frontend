import { NextRequest, NextResponse } from "next/server";


export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

export default async function middleware(req:NextRequest) {
    
    const path = req.nextUrl.pathname;
    const authorized = false;

    if(!authorized && path !=="login"){
        return NextResponse.redirect(new URL("/login", req.url));
    } else if(authorized && path ==="login"){
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.rewrite(new URL(`${path === "/"?"":path}`, req.url))
}