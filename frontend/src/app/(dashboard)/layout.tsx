import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/src/components/ui/navigation-menu";
import "../globals.css";
import { Toaster } from "@/src/components/ui/sonner";

import { Calendar, ChartColumn, Cog, House, Trophy } from "lucide-react";
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { DemoBanner } from "@/src/features/auth/components/DemoBanner";
import { getSessionOwnerId } from "@/src/features/auth/session";
import { WorkoutOwnerGuard } from "@/src/features/workout/components/WorkoutOwnerGuard";

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

export default async function RootLayout({
  children,
  exercises,
}: Readonly<{
  children: React.ReactNode;
  exercises: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get("demo_session")?.value === "1";
  const ownerId = getSessionOwnerId(cookieStore.get("access_token")?.value);

  return (
    <div>
      <Toaster position="top-right" richColors closeButton />
      <WorkoutOwnerGuard ownerId={ownerId} />

      <div className="h-[90vh]  overflow-auto no-scrollbar">
        {isDemo && <DemoBanner />}
        {children}
      </div>

      {exercises}

      <div className="sticky bottom-0 w-screen ">
        <NavigationMenu className="bg-secondary/95 w-screen h-[10vh] ">
          <NavigationMenuList className="gap-8 w-screen">
            <NavigationMenuItem>
              <NavigationMenuLink href="/routines">
                <House style={{ width: "24px", height: "24px" }} />
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink href="/workouts">
                <Calendar style={{ width: "24px", height: "24px" }} />
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/achievements">
                <Trophy style={{ width: "24px", height: "24px" }} />
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/stats">
                <ChartColumn style={{ width: "24px", height: "24px" }} />
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/settings">
                <Cog style={{ width: "24px", height: "24px" }} />
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}
