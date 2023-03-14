import Mustache from 'mustache'

import uuid from '../utils/uuid.js'

/** Default template tags wrap view variables in `[[key]]` */
const DEFAULT_DELIMITERS: Mustache.OpeningAndClosingTags = ['[[', ']]']

let activeDelimiters = DEFAULT_DELIMITERS

/** The base types that a prompt template value can hold */
type BasicPromptValue = string | number | boolean | BasicPromptValue[]
/** Valid values for a prompt template variable  */
type PromptTemplateValue =
  | BasicPromptValue
  | Record<string, BasicPromptValue>
  | null
  | undefined

/**
 * Prompt template parameters are a key:value Record using serialisable values.
 * Note any `undefined` values are removed when serialised.
 *
 * @example
 * const params: PromptTemplateParams = { name: 'Red' }
 */
type PromptTemplateParams = Record<string, PromptTemplateValue>

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
  /** The unique ID of the prompt */
  id: string
  /** The raw prompt template */
  template: string
  /** JSON serialised template parameters (undefined values are stripped) */
  params?: PromptTemplateParams
  /** Prompt configuration overrides */
  config?: PromptConfig
}

interface Prompt {
  /** The unique identifier for this prompt. Defaults to UUID */
  readonly id: string
  /** The raw prompt template */
  readonly _template: string
  /** JSON serialised template parameters (undefined values are stripped) */
  readonly _params?: PromptTemplateParams
  /** Prompt configuration overrides */
  readonly _config?: PromptConfig
  /** Delimiter strings for the prompt variables (e.g. `[[` and `]]`) */
  readonly _delimiters?: Mustache.OpeningAndClosingTags

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
   *
   * @return The current prompt instance
   */
  setDelimiters: (open: string, close: string) => Prompt

  /**
   * Update the prompt template view parameters. Merges params by default, but
   * you can set `{ override: true }` to replace the current params.
   *
   * @example
   * ```
   * const p = prompt('Hi [[name]]').setParams({ name: 'Red' })
   * console.log(p.toString())
   * // -> "Hi Red"
   * ```
   *
   * @param params - A key:value object of template parameters to apply
   * @param opts.override - Option to overwrite/replace the current params
   * @returns The current prompt instance
   */
  setParams: (
    params: PromptTemplateParams,
    options?: { override?: boolean }
  ) => Prompt

  /**
   * Returns the prompt as a `SerialisedPrompt` that can be used to instantiate
   * new prompts or serialised and saved
   *
   * @see Prompt.toJSON()
   *
   * @returns A `SerialisedPrompt` object from the current prompt
   */
  toObject: () => SerialisedPrompt

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

  /**
   * Returns the current prompt as a JSON string `SerialisedPrompt`
   *
   * @returns A JSON string output of the SerialisedPrompt
   */
  toJSON: () => string
}

/**
 * Serialise a prompt object to a `SerialisedPrompt` object format
 *
 * @private
 *
 * @param template - The raw prompt text
 * @param params - View parameter data to populate the template
 * @param config - Prompt config
 *
 * @returns a `SerialisedPrompt` object
 */
const _toObject = (
  prompt: Prompt,
  template = '',
  params: PromptTemplateParams,
  config: PromptConfig
) => {
  // Every serialised prompt has a template string, even if it's empty
  const output: SerialisedPrompt = {
    id: prompt.id,
    template,
  }

  // Apply optional additional prompt components to export
  if (Object.keys(params).length) output.params = params
  if (Object.keys(config).length) output.config = config

  return output
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
 * @param template - The raw prompt text including delimited variables
 * @param params - Optional Record of data values for prompt template variables
 * @param config - Optional prompt config intialisers
 * @returns A Prompt object
 */
export function prompt (
  template: string,
  params: PromptTemplateParams = {},
  config: PromptConfig = {}
) {
  const partials = {}

  /**
   * Inherit custom config delimiters, or global delimiters. NOTE: can be
   * overriden by calling the instance `.setDelimiters(open, close)`
   */
  let _delimiters = config.delimiters ?? activeDelimiters
  // Sanity check for valid delimiters
  for (const tag of _delimiters) {
    if (!tag.length) {
      throw new Error(
        `Invalid prompt delimiters: ${_delimiters.join(
          ', '
        )}. Delimiters must be at least 1 character long.`
      )
    }
  }

  const _export: Prompt = {
    // Properties (all readonly)
    // ---
    id: uuid(),
    _template: template,
    _params: params,
    _config: config,
    _delimiters,

    // Prompt Serialisers
    // ---
    toJSON: () => JSON.stringify(_toObject(_export, template, params, config)),
    toObject: () => _toObject(_export, template, params, config),
    toString: () => _toString(template, params, partials, _delimiters),

    // Prompt Modifiers
    // ---
    // Merge or overwrite template parameters
    setParams: (
      nextParams: PromptTemplateParams,
      opts?: { override?: boolean }
    ) => {
      params = opts?.override ? nextParams : { ...params, ...nextParams }
      return _export
    },
    // Overwrite this prompt's template delimiters
    setDelimiters: (openTag: string, closeTag: string) => {
      _delimiters = [openTag, closeTag]
      return _export
    },
  }

  // Restrict write access to readonly Prompt properties
  const READ_ONLY = { writable: false, configurable: false }
  Object.defineProperties(_export, {
    id: READ_ONLY,
    _template: READ_ONLY,
    _params: READ_ONLY,
    _config: READ_ONLY,
    _delimiters: READ_ONLY,
  })

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
