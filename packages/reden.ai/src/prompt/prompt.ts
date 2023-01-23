import Mustache from 'mustache'

/** Default template tags wrap view variables in `[[key]]` */
const DEFAULT_DELIMITERS: Mustache.OpeningAndClosingTags = ['[[', ']]']

let activeDelimiters = DEFAULT_DELIMITERS

/**
 * Prompt template parameters are a key:value Record using serialisable values.
 * Note any `undefined` values are removed when serialised.
 *
 * @example
 * const params: PromptTemplateParams = { name: 'Red' }
 */
type PromptTemplateParams = Record<
  string,
  string | number | boolean | null | undefined
>

/**
 * PromptConfig allows setting and initialising the parameters for a prompt
 */
interface PromptConfig {
  /** Prompt tag delimiters, defaults to `['[[', ']]']` */
  delimiters?: Mustache.OpeningAndClosingTags
}

/**
 * Serialised prompts represent the core prompt values that can be stored and
 * retrieved for later reinstantiation
 */
interface SerialisedPrompt {
  /** The raw prompt template */
  template: string
  /** JSON serialised template parameters (undefined values are stripped) */
  params?: PromptTemplateParams
  /** Prompt configuration overrides */
  config?: PromptConfig
}

interface Prompt {
  /**
   * Overrides the template tags for this prompt
   *
   * @example
   * ```
   * const p = prompt('Hi <% name %>', { name: 'Red' })
   *   .setDelimiters('<%', '%>')
   * console.log(p.toString())
   * // -> "Hi Red"
   * ```
   *
   * @param open - The opening delimiter
   * @param close - The closing delimiter
   */
  setDelimiters: (open: string, close: string) => Prompt

  /**
   * Renders the prompt as a ready-to-use, formatted string
   *
   * @example
   * ```
   * const p = prompt('Say hello, [[name]]', { name: 'Red' })
   * console.log(p.toString())
   * // -> Say hello, Red
   * ```
   *
   * @returns The formatted prompt string
   */
  toString: () => string
  toJSON: () => string
}

/**
 * Serialise a prompt to JSON
 *
 * @private
 *
 * @param _template - The raw prompt text
 * @param _params - View parameter data to populate the template
 * @param _config - Prompt config
 *
 * @returns a JSON string
 */
const _toJSON = (
  template = "",
  params: PromptTemplateParams,
  config: PromptConfig
) => {
  // Every serialised prompt has a template string, even if it's empty
  const output: SerialisedPrompt = { template }

  // Apply optional additional prompt components to export
  if (Object.keys(params).length) output.params = params
  if (Object.keys(config).length) output.config = config

  return JSON.stringify(output)
}

/**
 * Render the components of a prompt into a string
 *
 * @private
 *
 * @param template - The text template to render
 * @param view - Optional data object to render values from
 * @param partials - Optional Record of sub templates to apply
 * @param delimiters - Optional override for setting Mustache tag delimiters
 *
 * @returns the rendered template string
 */
const _toString = (
  template: string,
  view?: PromptTemplateParams,
  partials?: Record<string, string>,
  delimiters?: Mustache.OpeningAndClosingTags
) => {
  return Mustache.render(template, view, partials, delimiters)
}

/**
 * Generate a Prompt object
 *
 * @param template
 * @param viewParams
 * @param config
 * @returns A Prompt object
 */
export function prompt (
  template: string,
  viewParams: PromptTemplateParams = {},
  config: PromptConfig = {}
) {
  const partials = {}

  /**
   * Inherit custom config delimiters, or global delimiters. NOTE: can be
   * overriden by calling the instance `.setDelimiters(open, close)`
   */
  let _delimiters = config.delimiters ?? activeDelimiters

  const _export: Prompt = {
    toJSON: () => _toJSON(template, viewParams, config),
    toString: () => _toString(template, viewParams, partials, _delimiters),
    setDelimiters: (openTag: string, closeTag: string) => {
      _delimiters = [openTag, closeTag]
      return _export
    },
  }

  return _export
}

/**
 * Sets ALL subsequent prompt() tags to the new `openTag` and `closeTag`. Note
 * that this is a global state modifier to prompt. Consider using the instance
 * version of this function: `prompt().setDelimiters(open, close)`
 *
 * @param openTag - The opening tag
 * @param closeTag - The closing tag
 */
prompt.overrideGlobalDelimiters = function (openTag: string, closeTag: string) {
  activeDelimiters = [openTag, closeTag]
}

export default prompt
