import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios.");
        }

        const normalizedEmail = credentials.email.trim().toLowerCase();


        const { data: user, error } = await supabase
          .from("usuarios") // mantém o nome da tabela
          .select("id, name, email, password, role")
          .eq("email", normalizedEmail)
          .maybeSingle(); // evita erro se não encontrar usuário

     

        if (!user) throw new Error("Usuário não encontrado.");
        if (String(user.password) !== String(credentials.password)) {
          throw new Error("Email ou senha inválidos.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          accessToken: "", // or fetch/generate a real accessToken if needed
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.accessToken = user.accessToken ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin", // opcional: página de login customizada
    error: "/auth/error",    // opcional: página de erro
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
