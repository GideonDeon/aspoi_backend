import "./global.css";
import Image from "next/image";

export const metadata = {
  title: "Aspoi Membership",
  description: "Next.js + Prisma + Paystack integration",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="bg-black text-white min-h-50">
          <div className="flex flex-col justify-center">
            <h1 className="text-center text-3xl mt-4 mb-2 font-roboto">
              ASPOI Membership
            </h1>
            <Image
              src="/images/aspoi-logo.png"
              alt="ASPOI Logo"
              width={80} // px
              height={80} // px
              className="rounded-full"
            />

            <nav className="text-center mt-7 font-aldrich hover:text-[#feff00] w-fit relative left-[50%] -translate-x-[50%]">
              <a href="/">Home</a>
            </nav>
          </div>
        </header>

        <main>{children}</main>
        <p className="text-center absolute -bottom-7 w-full">
          © Aspoi {new Date().getFullYear()}
        </p>
      </body>
    </html>
  );
}
