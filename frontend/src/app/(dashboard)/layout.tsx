import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/src/components/ui/navigation-menu";
import "../globals.css";

import { Calendar, Cog, House } from "lucide-react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard for your exercises",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="min-h-[90vh]">{children}</div>

        <div className="sticky bottom-0 w-screen ">
          <NavigationMenu className="bg-secondary/95 w-screen h-[10vh] ">
            <NavigationMenuList className="gap-8 w-screen">
              <NavigationMenuItem>
                <NavigationMenuLink>
                  <Link href="/routines">
                    <House style={{ width: "24px", height: "24px" }} />
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink>
                  <Link href="/workouts">
                    <Calendar style={{ width: "24px", height: "24px" }} />
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink>
                  <Link href="/settings">
                    <Cog style={{ width: "24px", height: "24px" }} />
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </body>
    </html>
  );
}
