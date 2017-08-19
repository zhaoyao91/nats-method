const NATS = require('nats')

const defaultOptions = {
  url: 'nats://localhost:4222',
  maxReconnectAttempts: -1, // infinite
}

module.exports = function connect (options) {
  // process options
  if (!options) options = {}
  if (typeof options === 'string') options = {url: options}
  options = Object.assign({}, defaultOptions, options)

  // connect nats
  const nats = NATS.connect(options)

  // define default event handlers
  nats.on('error', (err) => {
    console.error(err)
    process.exit(-1)
  })
  nats.on('connect', () => console.log('method nats connected'))
  nats.on('disconnect', () => console.log('method nats disconnected'))
  nats.on('reconnecting', () => console.log('method nats reconnecting'))
  nats.on('reconnect', () => console.log('method nats reconnected'))
  nats.on('close', () => console.log('method nats connection closed'))

  let defaultTimeout = 60 * 1000 // 1 minute
  let methodPrefix = null
  let queueGroup = null

  nats.setDefaultTimeout = timeout => {
    defaultTimeout = timeout
    return nats
  }
  nats.setMethodPrefix = prefix => {
    methodPrefix = prefix
    return nats
  }
  nats.setQueueGroup = group => {
    queueGroup = group
    return nats
  }

  /**
   * define method
   * @param name
   * @param handler - async func(input, subject) => result
   */
  nats.define = function (name, handler) {
    const subject = methodPrefix ? `${methodPrefix}.${name}` : name
    nats.subscribe(subject, {queue: queueGroup}, (msg, reply, subject) => {
      Promise.resolve()
        .then(() => handler(msg, subject))
        .then(result => {
          if (reply) nats.publish(reply, result)
        })
        .catch(err => nats.emit('error', err))
    })
  }

  /**
   * call a method
   * @param name
   * @param input
   * @param timeout
   * @returns {Promise}
   */
  nats.call = function (name, input, timeout) {
    return new Promise((resolve, reject) => {
      nats.requestOne(name, input, {}, timeout || defaultTimeout, (res) => {
        if (res instanceof Error) reject(res)
        else resolve(res)
      })
    })
  }

  nats.callAndForget = function (name, input) {
    nats.publish(name, input)
  }

  return nats
}
