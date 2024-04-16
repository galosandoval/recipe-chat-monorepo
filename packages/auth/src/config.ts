import type { DefaultSession, NextAuthConfig } from "next-auth";
import { compare } from "bcryptjs";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@acme/db";

const MAX_AUTH_AGE = 15 * 24 * 60 * 60; // 15 days

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      listId: string;
    } & DefaultSession["user"];
  }
}

export const authorizeParams = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(50),
});

export const authConfig = {
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        //@ts-expect-error - listId is not in the default session
        token.listId = user.listId;
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (token?.id) {
        session.user.id = token.id as string;
        session.user.listId = token.listId as string;
      }

      return session;
    },
  },
  jwt: {
    maxAge: MAX_AUTH_AGE,
  },
  session: {
    maxAge: MAX_AUTH_AGE,
  },
  pages: {
    signIn: "/",
    error: "/",
    signOut: "/",
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: {
          label: "email",
          type: "email",
        },
        password: { label: "email", type: "password" },
      },
      authorize: async (credentials) => {
        const credentialsSchema = z.object({
          email: z.string().email(),
          password: z.string().min(8).max(50),
        });

        const input = credentialsSchema.parse(credentials);

        const username = input.email.toLowerCase();

        const user = await prisma.user.findFirst({
          where: { username },
          select: { list: { select: { id: true } }, password: true, id: true },
        });

        if (!user) {
          return null;
        }
        const isValidPassword = await compare(
          input.password || "",
          user.password,
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          listId: user?.list?.id,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;
