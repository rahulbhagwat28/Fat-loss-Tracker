import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import NotificationSound from "@/components/NotificationSound";
import FloatingChatButton from "@/components/FloatingChatButton";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <>
      <NotificationSound />
      <NavBar />
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 min-h-[calc(100vh-3.5rem)] pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-6 w-full min-w-0 overflow-x-hidden">
        {children}
      </main>
      <FloatingChatButton />
    </>
  );
}
