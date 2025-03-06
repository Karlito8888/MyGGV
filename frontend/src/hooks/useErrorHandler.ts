import { useState } from "react";

export const useErrorHandler = () => {
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown, defaultMessage: string) => {
    const message = err instanceof Error ? err.message : defaultMessage;
    setError(message);
    console.error(message, err);
  };

  return { error, handleError };
};
