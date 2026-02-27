import { useCallback, useState } from "react";

type AsyncStatus = "idle" | "loading" | "success" | "error";

export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>
) {
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [error, setError] = useState<string>("");

  const run = useCallback(
    async (...args: TArgs) => {
      setStatus("loading");
      setError("");
      try {
        const result = await action(...args);
        setStatus("success");
        return result;
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        setError(message);
        setStatus("error");
        throw cause;
      }
    },
    [action]
  );

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
