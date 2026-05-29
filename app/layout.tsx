import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Vetly — Análise honesta de propostas comerciais",
  description:
    "Vetly transforma propostas comerciais em relatórios padronizados com leitura crítica honesta. Para times de compras que querem decidir bem.",
  metadataBase: new URL("https://app.getvetly.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${manrope.variable} ${jetbrainsMono.variable} font-body antialiased bg-paper text-texto-1`}
      >
        {children}
      </body>
    </html>
  );
}
