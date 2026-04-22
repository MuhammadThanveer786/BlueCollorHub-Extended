import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/User";
import connect from "@/lib/mongodb"; 
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { prompt: "consent", access_type: "offline", }, }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        await connect();

        const user = await User.findOne({ email: credentials.email }).lean();
        
        if (!user) {
            throw new Error("No account found with this email.");
        }

        // 🚨 THE GOOGLE TRAP FIX: Prevents crashing if a Google user types a password
        if (!user.password) {
            throw new Error("This account was created using Google. Please click 'Sign in with Google' instead.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
            throw new Error("Incorrect password.");
        }

        // 🚨 SUSPENSION BLOCKER
        if (user.deactivatedUntil && new Date(user.deactivatedUntil) > new Date()) {
            throw new Error(`Your account is suspended until ${new Date(user.deactivatedUntil).toLocaleDateString()}`);
        }

        return {
          id: user._id.toString(), 
          name: user.name,
          email: user.email,
          profilePic: user.profilePic || null,
          role: user.role || "user",             
          isVerified: user.isVerified || false,  
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      await connect();
      let dbUser = await User.findOne({ email: user.email }).lean();

      if (dbUser) {
        // 🚨 SUSPENSION BLOCKER (For Google Logins)
        if (dbUser.deactivatedUntil && new Date(dbUser.deactivatedUntil) > new Date()) {
            throw new Error(`Your account is suspended until ${new Date(dbUser.deactivatedUntil).toLocaleDateString()}`);
        }
      } else {
        const newUser = await User.create({
          name: user.name,
          email: user.email,
          profilePic: user.image,
          provider: account.provider,
          role: "user",
          isVerified: false,
          deactivatedUntil: null
        });
        dbUser = newUser.toObject(); 
      }

      user.id = dbUser._id.toString(); 
      user.role = dbUser.role || "user";             
      user.isVerified = dbUser.isVerified || false;  
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.profilePic = user.profilePic || user.image || null;
        token.role = user.role || "user";             
        token.isVerified = user.isVerified || false;  
      }
      return token;
    },

    async session({ session, token }) {
      // 🚨 SAFETY CHECKS: Prevents 500 crashes during hot-reloads
      if (session && session.user && token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.profilePic = token.profilePic;
        session.user.role = token.role || "user";             
        session.user.isVerified = token.isVerified || false;  
      }
      return session;
    },
  },

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };