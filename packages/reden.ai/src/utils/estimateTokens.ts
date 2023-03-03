/**
 * Naive token estimation for a string. Usually overestimates, usually within
 * about 10-15% of the actual token count
 *
 * @param str - The text to estimate tokens for
 * @returns An estimate number of tokens
 */
export function estimateTokens (str: string) {
  const WORDS_PER_TOKEN = .7
  const CHARS_PER_WORD = 4.6

  const wordGuess = Math.ceil(str.split(' ').length / WORDS_PER_TOKEN)
  const charGuess = Math.ceil(str.length / CHARS_PER_WORD / WORDS_PER_TOKEN)

  return Math.ceil( (wordGuess + charGuess) / 2)
}

export default estimateTokens
