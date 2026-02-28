import { useCallback, useState } from "react";

type MutationStatus = "idle" | "loading" | "success" | "error";

export function useMutationAction<TArgs extends unknown[], TResult>(
  mutationFn: (...args: TArgs) => Promise<TResult>
) {
  const [status, setStatus] = useState<MutationStatus>("idle");
  const [error, setError] = useState("");

  const run = useCallback(async (...args: TArgs) => {
    setStatus("loading");
    setError("");
    try {
      const result = await mutationFn(...args);
      setStatus("success");
      return result;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      setError(message);
      setStatus("error");
      throw cause;
    }
  }, [mutationFn]);

  return {
    status,
    error,
    isLoading: status === "loading",
    isSuccess: status === "success",
    isError: status === "error",
    run,
    reset() {
      setStatus("idle");
      setError("");
    }
  };
}
