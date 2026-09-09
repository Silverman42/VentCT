/**
 * Base64 encoding and decoding utilities
 */
export const Base64 = {
  /**
   * Decodes a Base64 encoded string to its original UTF-8 string
   * @param encodedString - The Base64 encoded string to decode
   * @returns The decoded UTF-8 string
   * @throws Error if the input is not a valid Base64 string
   */
  decode: (encodedString: string): string => {
    try {
      return decodeURIComponent(
        atob(encodedString)
          .split('')
          .map((char) => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch (error) {
      throw new Error('Invalid Base64 string');
    }
  },

  /**
   * Encodes a UTF-8 string to Base64
   * @param decodedString - The UTF-8 string to encode
   * @returns The Base64 encoded string
   */
  encode: (decodedString: string): string => {
    return btoa(
      encodeURIComponent(decodedString).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
  },
};
