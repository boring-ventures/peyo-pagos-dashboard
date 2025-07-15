import Image from "next/image";

interface Props {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="container grid h-svh flex-col items-center justify-center bg-primary-foreground lg:max-w-none lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[480px] lg:p-8">
        <div className="mb-4 flex items-center justify-center">
          <Image
            src="/assets/logo.png"
            alt="PEYO Logo"
            width={120}
            height={40}
            className="mr-2"
          />
        </div>
        {children}
      </div>
    </div>
  );
}
