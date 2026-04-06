// ═══ GLOBAL ERROR HANDLER ═══
// Catches unhandled errors and promise rejections, shows user-friendly toasts

import { notify } from './utils.js';

let _errorCount = 0;
const MAX_ERRORS_PER_MINUTE = 5;

function _shouldNotify() {
  _errorCount++;
  if (_errorCount > MAX_ERRORS_PER_MINUTE) return false;
  setTimeout(() => { _errorCount = Math.max(0, _errorCount - 1); }, 60000);
  return true;
}

export function initErrorHandler() {
  // Catch synchronous errors
  window.onerror = function(message, source, lineno, colno, error) {
    console.error('[Quro Error]', message, source, lineno, colno, error);
    if (_shouldNotify()) {
      const msg = typeof message === 'string' ? message : 'An unexpected error occurred';
      // Don't show network errors or script loading failures as toasts
      if (msg.includes('Script error') || msg.includes('Loading chunk')) return;
      notify('Something went wrong. Try refreshing.', 'error');
    }
  };

  // Catch unhandled promise rejections (e.g., failed Supabase calls)
  window.onunhandledrejection = function(event) {
    const reason = event.reason;
    console.error('[Quro Unhandled Rejection]', reason);
    if (_shouldNotify()) {
      // Extract meaningful message
      let msg = 'A network request failed';
      if (reason && reason.message) {
        if (reason.message.includes('Failed to fetch') || reason.message.includes('NetworkError')) {
          msg = 'Connection lost. Check your internet.';
        } else if (reason.message.includes('JWT')) {
          msg = 'Session expired. Please sign in again.';
        } else {
          msg = reason.message.slice(0, 100);
        }
      }
      notify(msg, 'error');
    }
    // Prevent default console error for handled rejections
    event.preventDefault();
  };
}
