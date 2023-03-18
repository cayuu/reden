import reden from 'reden.ai'

const p = reden.prompt('Basic prompt: [[hello]]', { hello: 'world' })
console.log('Prompt string:', p.toString())
console.log(p.toObject())
console.log(p.getParams())
