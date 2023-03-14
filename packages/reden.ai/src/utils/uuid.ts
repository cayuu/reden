// Inlined import with light editing from @lukeed/uuid@2.0.0
// MIT Licensed
const crypto =
  typeof globalThis.crypto !== 'undefined'
    ? globalThis.crypto
    : await import('node:crypto')

// Define an array to store hexadecimal values
const HEX: string[] = []
// Initialize the index to 256
let IDX = 256
// Declare a variable to store the buffer
let BUFFER: number[]

// Pre-build list of hex values 0-255 (00-ff)
while (IDX--) HEX[IDX] = (IDX + 256).toString(16).substring(1)

/**
 * Generates a UUID v4 string using Node's crypto.randomUUID function if it's
 * available otherwise using a Math.random based algorithm.
 *
 * @returns a UUID v4 string
 */
export function uuid () {
  // If the randomUUID function is available, use it to generate a UUID
  if (typeof crypto.randomUUID !== 'undefined') return crypto.randomUUID()

  // Declare variables to store the UUID components
  let i = 0
  let num: number
  let out = ''

  // If the buffer is not defined or the current index plus 16 is > than 256,
  // generate a new buffer with 256 random values between 0 and 255 and reset
  // the index to 0
  if (!BUFFER || IDX + 16 > 256) {
    BUFFER = Array((i = 256))
    while (i--) BUFFER[i] = (256 * Math.random()) | 0
    i = IDX = 0
  }

  // Loop through the 16 UUID components
  for (; i < 16; i++) {
    // Retrieve the current value from the buffer
    num = BUFFER[IDX + i]

    // Apply the bitwise operations to the current value to get the UUID component
    if (i == 6) out += HEX[(num & 15) | 64]
    else if (i == 8) out += HEX[(num & 63) | 128]
    else out += HEX[num]

    // Add a hyphen separator for the appropriate UUID components
    if (i & 1 && i > 1 && i < 11) out += '-'
  }

  // Increment the index and return the generated UUID
  IDX++
  return out
}

export default uuid
