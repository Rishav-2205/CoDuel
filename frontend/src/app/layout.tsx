import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";

export const metadata: Metadata = {
  title: "Coding Duel — Fast-Paced 60-Second Coding Battles",
  description: "Challenge intelligent bots in 60-second rapid-fire programming duels across C++, Java, and Python.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-arena-950 text-gray-100 antialiased selection:bg-purple-600 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
