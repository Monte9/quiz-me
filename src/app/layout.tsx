import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quiz Me",
  description:
    "Daily quizzes from Ash. Easy, medium, hard, xhard. Text and image.",
  openGraph: {
    title: "Quiz Me",
    description:
      "Daily quizzes from Ash. Easy, medium, hard, xhard. Text and image.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
