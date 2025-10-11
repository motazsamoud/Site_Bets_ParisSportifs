import "./globals.css";
import Layout from "@/components/Layout";
import HeaderClient from "@/components/HeaderClient";

export const metadata = {
  title: "Odds PWA",
  description: "Plateforme de paris sportifs et casino en ligne",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body
        className="
          bg-[#0b1018]
          text-white
          min-h-screen
          flex flex-col
          overflow-x-hidden
          antialiased
          selection:bg-emerald-500/20
          selection:text-emerald-300
        "
      >
        {/* ✅ Barre supérieure (client header global) */}
        <HeaderClient />

        {/* ✅ Layout principal (contient header + footer du site) */}
        <div className="flex-1 flex flex-col w-full">
          <Layout>{children}</Layout>
        </div>
      </body>
    </html>
  );
}
