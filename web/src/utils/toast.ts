/**
 * GLBC Translation System — Modern Toast Event Dispatcher
 * Replaces default browser alert() popups with elegant, theme-aware toast notifications.
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export function showToast(type: ToastType, message: string, duration = 3500) {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent('glbc-toast', {
    detail: {
      id: Math.random().toString(36).substring(2, 9),
      type,
      message,
      duration
    }
  });
  window.dispatchEvent(event);
}
