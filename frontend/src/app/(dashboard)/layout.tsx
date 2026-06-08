import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/src/components/ui/navigation-menu";
import "../globals.css";

import { Calendar, Cog, House } from "lucide-react";
import type { Metadata, Viewport } from "next";
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
  manifest: "/manifest.json",
  title: "Gains | Fitness Tracker",
  description: "Track your workouts with Gains",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
  exercises,
}: Readonly<{
  children: React.ReactNode;
  exercises: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="min-h-[90vh]">{children}</div>

        {exercises}

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
