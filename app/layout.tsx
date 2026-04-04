import type { Metadata } from "next";
import { Chakra_Petch, Orbitron, Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
});

const shareTechMono = Share_Tech_Mono({
  variable: "--font-share-tech",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Defiduel — Arène on-chain",
  description: "Duels de trading avec wallet embarqué",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${chakraPetch.variable} ${orbitron.variable} ${shareTechMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="game-arena flex min-h-full flex-col">
          <div className="game-scanlines" aria-hidden />
          <div className="game-content flex flex-1 flex-col">{children}</div>
        </div>
      </body>
    </html>
  );
}
