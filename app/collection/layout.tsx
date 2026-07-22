import { RequireAuth } from "@/components/AuthProvider";

/** /collection 底下的所有子路由都需要登入。 */
export default function CollectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
