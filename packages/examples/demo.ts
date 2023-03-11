import reden from 'reden.ai'

const p = reden.prompt('Basic prompt: [[hello]]', { hello: 'world' })
console.log(p.toJSON())
