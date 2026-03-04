import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snapback Sports — Game Builder",
  description: "Create 'Name That X' trivia games with AI-generated questions and image search",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0A0A0A] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
