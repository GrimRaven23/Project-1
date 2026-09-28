/// <reference types="next" />
/// <reference types="next/image-types/global" />

declare module "next" {
  export interface Metadata {
    title?: string | { default: string; template: string };
    description?: string;
    [key: string]: any;
  }
}

declare module "next/server" {
  export class NextRequest extends Request {
    readonly nextUrl: URL;
    readonly ip?: string;
    readonly geo?: any;
    constructor(input: RequestInfo | URL, init?: RequestInit);
  }
  export class NextResponse<T = any> extends Response {
    static json<JsonBody>(body: JsonBody, init?: ResponseInit): NextResponse<JsonBody>;
    static redirect(url: string | URL | Location, status?: number): NextResponse;
    static next(init?: { headers?: HeadersInit; request?: { headers?: HeadersInit } }): NextResponse;
  }
}

declare module "next/navigation" {
  export function useRouter(): {
    push(href: string, options?: any): void;
    replace(href: string, options?: any): void;
    refresh(): void;
    back(): void;
    forward(): void;
    prefetch(href: string, options?: any): void;
  };
  export function usePathname(): string;
  export function useParams<T = Record<string, string | string[]>>(): T;
  export function useSearchParams(): URLSearchParams;
}

declare module "next/link" {
  import React from "react";
  export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    children?: React.ReactNode;
  }
  const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;
  export default Link;
}
