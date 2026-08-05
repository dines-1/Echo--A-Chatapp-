import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type RedirectStatus = "loading" | "authenticated" | "unauthenticated";

{/** use to redirect authenticated user from
 marketing page to there respective portal */}

export function useAuthRedirect() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status !== "authenticated") return;

        const destination = session?.user?.role === "admin" ? "/admin" : "/chat";
        router.push(destination);
    }, [status, session, router]);

    return { status: status as RedirectStatus };
}