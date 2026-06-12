import Link from "next/link";
import { LogoBrand } from "@/components/shared/LogoBrand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "#0f0404" }}
    >
      {/* Atmospheric gradients */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          background: `
            radial-gradient(ellipse at 70% 0%, rgba(160,14,14,0.35) 0%, transparent 55%),
            radial-gradient(ellipse at 10% 90%, rgba(110,8,8,0.2) 0%, transparent 45%)
          `,
        }}
      />

      {/* Header */}
      <header
        className="relative z-10 flex items-center px-6 h-16 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <Link href="/">
          <LogoBrand imgClass="h-10 w-auto" />
        </Link>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
