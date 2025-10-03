import type { Result } from './index';

/**
 * Create a successful result
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Create an error result
 */
export function error<T>(message: string): Result<T> {
  return { success: false, error: message };
}

/**
 * Check if result is successful
 */
export function isSuccess<T>(
  result: Result<T>,
): result is { success: true; data: T } {
  return result.success;
}

/**
 * Check if result is an error
 */
export function isError<T>(
  result: Result<T>,
): result is { success: false; error: string } {
  return !result.success;
}

/**
 * Transform successful result data
 */
export function map<T, U>(
  result: Result<T>,
  transform: (data: T) => U,
): Result<U> {
  if (isSuccess(result)) {
    return success(transform(result.data));
  }
  return result;
}

/**
 * Chain result operations
 */
export function flatMap<T, U>(
  result: Result<T>,
  transform: (data: T) => Result<U>,
): Result<U> {
  if (isSuccess(result)) {
    return transform(result.data);
  }
  return result;
}
