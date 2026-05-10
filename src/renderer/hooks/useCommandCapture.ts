import { useRef, useCallback } from 'react';

// Tracks user input to detect command submissions
export function useCommandCapture(sessionId: string) {
  const inputBuffer = useRef('');

  const handleInput = useCallback(
    (data: string) => {
      // Handle backspace/delete
      if (data === '\x7f' || data === '\b') {
        inputBuffer.current = inputBuffer.current.slice(0, -1);
        return;
      }

      // Handle carriage return / newline - command submitted
      if (data === '\r' || data === '\n') {
        const cmd = inputBuffer.current.trim();
        if (cmd) {
          window.historyAPI.record({
            command: cmd,
            directory: '',
            sessionId,
            profile: 'default',
            exitCode: null,
          });
        }
        inputBuffer.current = '';
        return;
      }

      // Handle control characters - clear buffer
      if (data.charCodeAt(0) < 32) {
        // Ctrl+C, Ctrl+D, etc. - reset buffer
        if (data === '\x03' || data === '\x04') {
          inputBuffer.current = '';
        }
        return;
      }

      // Append visible character to buffer
      inputBuffer.current += data;
    },
    [sessionId]
  );

  const resetBuffer = useCallback(() => {
    inputBuffer.current = '';
  }, []);

  return { handleInput, resetBuffer };
}
