import { useCallback, useEffect, useState } from "react";

type QueryState<T> = {
  data: T | null;
  loading: boolean;
  error: string;
};

export function useQueryResource<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = [],
  options: { immediate?: boolean } = { immediate: true }
) {
  const [state, setState] = useState<QueryState<T>>({ data: null, loading: false, error: "" });

  const run = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const data = await queryFn();
      setState({ data, loading: false, error: "" });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw error;
    }
  }, deps);

  useEffect(() => {
    if (options.immediate === false) return;
    void run();
  }, [run, options.immediate]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch: run,
    setData(updater: T | ((prev: T | null) => T | null)) {
      setState((prev) => ({
        ...prev,
        data: typeof updater === "function" ? (updater as (p: T | null) => T | null)(prev.data) : updater
      }));
    }
  };
}
