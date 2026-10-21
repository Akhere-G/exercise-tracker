import { Button } from "@/src/components/ui/button";
import { logoutAction } from "@/src/features/auth/actions";
import { LogOut } from "lucide-react";

export function LogoutButton({ label = "Log out" }: { label?: string }) {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="outline">
        <LogOut />
        {label}
      </Button>
    </form>
  );
}
