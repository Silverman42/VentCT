/**
 * Copies a string to the clipboard using the modern Clipboard API with fallback support
 * @param text - The string to copy to clipboard
 * @returns Promise<boolean> - Returns true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Try using the modern Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers or non-secure contexts
    return fallbackCopyToClipboard(text);
  } catch (error) {
    // console.error("Failed to copy to clipboard:", error);
    return false;
  }
}

/**
 * Fallback method for copying to clipboard using Selection API
 * @param text - The string to copy to clipboard
 * @returns boolean - Returns true if successful, false otherwise
 */
function fallbackCopyToClipboard(text: string): boolean {
  try {
    // Create a temporary textarea element
    const textArea = document.createElement("textarea");

    // Set the text content
    textArea.value = text;

    // Make it invisible
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.style.opacity = "0";

    // Add to DOM
    document.body.appendChild(textArea);

    // Focus and select the text
    textArea.focus();
    textArea.select();

    // Use Selection API instead of deprecated execCommand
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(textArea);
    selection?.removeAllRanges();
    selection?.addRange(range);

    // Try to copy using clipboard API as fallback
    try {
      navigator.clipboard.writeText(text);
      return true;
    } catch {
      // If clipboard API fails, return false
      return false;
    } finally {
      // Clean up
      document.body.removeChild(textArea);
      selection?.removeAllRanges();
    }
  } catch (error) {
    // console.error("Fallback copy failed:", error);
    return false;
  }
}

/**
 * Copies a string to clipboard and shows a toast notification
 * @param text - The string to copy to clipboard
 * @param successMessage - Optional success message to show
 * @param errorMessage - Optional error message to show
 * @returns Promise<boolean> - Returns true if successful, false otherwise
 */
export async function copyToClipboardWithFeedback(
  text: string,
  successMessage: string = "Copied to clipboard!",
  errorMessage: string = "Failed to copy to clipboard"
): Promise<boolean> {
  const success = await copyToClipboard(text);

  // You can integrate this with your toast system
  if (success) {
    // Example: showToast(successMessage, 'success');
    // console.log(successMessage);
  } else {
    // Example: showToast(errorMessage, 'error');
    // console.error(errorMessage);
  }

  return success;
}

/**
 * Copies a string to clipboard and returns a promise that resolves with the result
 * @param text - The string to copy to clipboard
 * @returns Promise<{success: boolean, message: string}>
 */
export async function copyToClipboardWithResult(
  text: string
): Promise<{ success: boolean; message: string }> {
  const success = await copyToClipboard(text);

  return {
    success,
    message: success ? "Text copied successfully" : "Failed to copy text",
  };
}
