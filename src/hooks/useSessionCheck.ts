import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export interface SessionCheckResult {
  authenticated: boolean;
  username?: string;
  avatar_url?: string | null;
}

/**
 * Hook to check if user has a valid session. If authenticated, redirects to /chat.
 * Use on login/register pages.
 */
export function useSessionCheck() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/session/check", { credentials: "include" });
        if (cancelled) return;
        const data: SessionCheckResult = await res.json();
        if (data.authenticated) {
          navigate("/chat", { replace: true });
        }
      } catch {
        if (!cancelled) setChecking(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return { checking };
}
