import {
  Scale,
  Paintbrush,
  Sliders,
  UserRound,
} from "lucide-react";
import { LogoutButton } from "@/src/features/auth/components/LogoutButton";
import DataPortabilityButtons from "./components/DataPortabilityButtons";

export default function SettingsPage() {
  return (
    <div className="container ">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application preferences, themes, and training data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Scale className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20">
                Coming Soon
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2">Metrics Details</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Customise your default measurement units for tracking. Toggle
              between metric and imperial systems for weight, distance, and pace
              calculations.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Paintbrush className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20">
                Coming Soon
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2">Themes & Styling</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Personalise your dashboard interface. Switch cleanly between
              light, dark, and system themes, or choose custom accent colours to
              match your training vibe.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 md:col-span-2 relative overflow-hidden flex flex-col justify-between min-h-[200px]">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Sliders className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20">
                Coming Soon
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2">Data Portability</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-6">
              Your fitness data belongs entirely to you. You will soon be able
              to securely back up your entire routine history, or import legacy
              training logs via structured formats.
            </p>
          </div>

          <DataPortabilityButtons />
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 md:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold">Account</h3>
          </div>
          <div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
