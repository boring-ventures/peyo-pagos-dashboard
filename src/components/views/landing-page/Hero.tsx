import Link from "next/link";
import { ArrowRight, CreditCard } from "lucide-react";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { BoxReveal } from "@/components/magicui/box-reveal";
import { ShineBorder } from "@/components/magicui/shine-border";
import { BlurFade } from "@/components/magicui/blur-fade";
import { ShimmerButton } from "@/components/magicui/shimmer-button";

export default function Hero() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center">
          <ShineBorder className="p-8 rounded-2xl">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Floating badge */}
              <BlurFade>
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-background/50 px-6 py-2 mb-8 shadow-glow backdrop-blur-sm">
                  <CreditCard className="h-4 w-4 text-primary mr-2" />
                  <SparklesText text="Gestión Inteligente de Pagos" />
                </div>
              </BlurFade>

              <BoxReveal>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight tracking-tight">
                  Controla tus pagos empresariales
                  <br />
                  <span className="text-primary">
                    de forma eficiente y segura.
                  </span>
                </h1>
              </BoxReveal>

              <BlurFade delay={0.2}>
                <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                  Gestiona, supervisa y optimiza todos tus pagos empresariales
                  con PEYO Pagos&apos; plataforma integral de gestión
                  financiera.
                </p>
              </BlurFade>

              <BlurFade delay={0.4}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <ShimmerButton className="px-8 py-4 text-lg">
                    <Link href="/sign-up" className="flex items-center">
                      Comenzar ahora
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </ShimmerButton>
                  <Link
                    href="/sign-in"
                    className="text-lg text-muted-foreground hover:text-primary transition-colors px-8 py-4"
                  >
                    Iniciar sesión →
                  </Link>
                </div>
              </BlurFade>
            </div>
          </ShineBorder>
        </div>
      </div>
    </section>
  );
}
