import { RequireAuth } from "@/components/AuthProvider";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
