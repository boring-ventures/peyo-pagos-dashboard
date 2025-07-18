import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import AuthLayout from "@/components/auth/auth-layout";
import { UserAuthForm } from "@/components/auth/sign-in/components/user-auth-form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Iniciar Sesión",
  description: "Inicia sesión en tu cuenta",
};

export default function SignInPage() {
  return (
    <AuthLayout>
      <Card className="p-6">
        <div className="flex flex-col space-y-2 text-left">
          <h1 className="text-2xl font-semibold tracking-tight">
            Iniciar Sesión
          </h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tu email y contraseña para acceder a tu cuenta.
          </p>
        </div>
        <UserAuthForm />
        <div className="mt-4 text-center text-sm">
          <p className="text-muted-foreground">
            ¿Prefieres iniciar sesión sin contraseña?{" "}
            <Link
              href="/magic-link"
              className="underline underline-offset-4 hover:text-primary"
            >
              Usar enlace mágico
            </Link>
          </p>
        </div>
        <p className="mt-4 px-8 text-center text-sm text-muted-foreground">
          Al iniciar sesión, aceptas nuestros{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            Términos de Servicio
          </Link>{" "}
          y{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Política de Privacidad
          </Link>
          .
        </p>
      </Card>
    </AuthLayout>
  );
}
