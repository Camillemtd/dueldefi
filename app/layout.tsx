import type { Metadata } from "next"
import { Chakra_Petch, Orbitron, Share_Tech_Mono } from "next/font/google"

import { PlayModeProvider } from "@/components/play-mode-context"

import "./globals.css"

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
})

const shareTechMono = Share_Tech_Mono({
  variable: "--font-share-tech",
  subsets: ["latin"],
  weight: ["400"],
})

export const metadata: Metadata = {
  title: "DeFi — On-chain arena",
  description: "Trading duels with an embedded wallet",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${chakraPetch.variable} ${orbitron.variable} ${shareTechMono.variable} min-h-full antialiased`}
    >
      <body className="min-h-full">
        <PlayModeProvider>
          {/* Pas de flex sur l’arène : évite une hauteur de colonne « figée » au viewport (scroll document bloqué). */}
          <div className="game-arena relative min-h-dvh w-full">
            <div className="game-scanlines" aria-hidden />
            <div className="game-content flex min-h-dvh w-full flex-col">{children}</div>
          </div>
        </PlayModeProvider>
      </body>
    </html>
  )
}
