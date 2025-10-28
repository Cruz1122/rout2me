import { useState } from 'react';

export default function useErrorNotification() {
  const [error, setError] = useState<string | null>(null);

  const showError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const clearError = () => {
    setError(null);
  };

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    showError(message);
  };

  return {
    error,
    showError,
    clearError,
    handleError,
  };
}
