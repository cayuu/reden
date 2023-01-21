import Mustache from 'mustache'

/** Default template tags wrap view variables in `[[key]]` */
const DEFAULT_TAGS: Mustache.OpeningAndClosingTags = ['[[', ']]']

let activeTags = DEFAULT_TAGS

/** Temporary - replace with actual types */
type UNDEFINED = any

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

interface Prompt {
  /**
   * Overrides the template tags for this prompt
   *
   * @example
   * ```
   * const p = prompt('Hi <% name %>', { name: 'Red' }).setTags('<%', '%>')
   * console.log(p.toString())
   * // -> "Hi Red"
   * ```
   *
   * @param openTag - The opening tag
   * @param closeTag - The closing tag
   */
  setTags: (openTag: string, closeTag: string) => Prompt

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
const _toJSON = (_template: string, _params: UNDEFINED, _config: UNDEFINED) => {
  return JSON.stringify({ not_implemented: true })
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
  return Mustache.render(template, view, partials, delimiters);
};

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
  _config: UNDEFINED = {}
) {
  const partials = {}

  let _currentTags = activeTags

  const _export: Prompt = {
    toJSON: () => _toJSON(template, {}, {}),
    toString: () => _toString(template, viewParams, partials, _currentTags),
    setTags: (openTag: string, closeTag: string) => {
      _currentTags = [openTag, closeTag]
      return _export
    },
  }

  return _export
}

/**
 * Sets ALL subsequent prompt() tags to the new `openTag` and `closeTag`. Note
 * that this is a global state modifier to prompt. Consider using the instance
 * version of this function: `prompt().setTags(open, close)`
 *
 * @param openTag - The opening tag
 * @param closeTag - The closing tag
 */
prompt.overrideGlobalTags = function (openTag: string, closeTag: string) {
  activeTags = [openTag, closeTag]
}

export default prompt
