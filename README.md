# Nats Method

Help define methods for nats.

## Installation

```
npm install --save nats-method
```

## Usage

```
const connectNats = require('nats-method')

const natsMethod = connectNats('nats://localhost:4222')
  .setDefaultTimeout(60 * 1000) // optional
  .setMethodPrefix('test') // optional
  .setQueueGroup('test') // optional, but you should provide it if you want to launch multiple instances.
  .on('error', console.error) // optional
    
natsMethod.define('hello', async (msg) => 'hi ' + msg)

natsMethod.call('test.hello').then(msg => console.log(msg))

natsMethod.callAndForget('test.hello')

natsMethod.close()
```

## License

MIT