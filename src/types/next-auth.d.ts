import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    firstName?: string;
    lastName?: string | null;
  }

  interface Session {
    user: {
      id: string;
      firstName: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    firstName: string;
  }
}
