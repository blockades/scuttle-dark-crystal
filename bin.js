#!/usr/bin/env node
const yargs = require('yargs')
const pull = require('pull-stream')
const Connection = require('./connection')
const DarkCrystal = require('.')

var server
Connection((err, _server) => {
  if (err) return console.error(err)

  server = _server
  const darkCrystal = DarkCrystal(server)

  const yargargs = processCommand(darkCrystal)

  if (!yargargs._[0]) {
    yargs.showHelp()
    server.close()
  }
})

// abstract `console.log` for easy replacement
function log (data) {
  console.log(JSON.stringify(data, null, 2))
}

// default callback for asynchronous calls
function callback (err, res) {
  if (err) throw err
  log(res)
  server.close()
}

// sink for stream sources, which calls the above callback
function pullback (stream) {
  return pull(stream, pull.collect(callback))
}

function processCommand (darkCrystal) {
  return yargs // eslint-disable-line
    .command('share', 'shard secret and publish root message, ritual message, and one shard message for each recipient', (yargs) => {
      yargs
        .option('name', {
          demandOption: true,
          type: 'string'
        })
        .option('secret', {
          demandOption: true,
          type: 'string'
        })
        .option('quorum', {
          demandOption: true,
          type: 'number'
        })
        .option('recps', {
          demandOption: true,
          type: 'array'
        })
    }, (argv) => {
      const { name, secret, quorum, recps } = argv
      darkCrystal.share.async.share({ name, secret, quorum, recps }, callback)
    })

    .command('recover.request <rootId>', 'publish invite messages with a request to return a shard', (yargs) => {
      yargs
        .positional('rootId', {
          type: 'string'
        })
        .option('recps', {
          demandOption: true,
          type: 'array'
        })
    }, (argv) => {
      darkCrystal.recover.async.request(argv.rootId, argv.recps, callback)
    })

    .command('recover.reply <inviteId>', 'respond to a given invite message', (yargs) => {
      yargs
        .positional('inviteId', {
          type: 'string'
        })
    }, (argv) => {
      darkCrystal.recover.async.reply(argv.inviteId, callback)
    })

    .command('recover.recombine <rootId>', 'attempt to recombine the decrypted shards included in reply messages associated with a given rootId', (yargs) => {
      yargs
        .positional('rootId', {
          type: 'string'
        })
    }, (argv) => {
      darkCrystal.recover.async.recombine(argv.rootId, callback)
    })

    .command('root.publish <name>', 'publish a root message with secret name', (yargs) => {
      yargs
        .positional('name', {
          type: 'string'
        })
    }, (argv) => {
      darkCrystal.root.async.publish(argv.name, callback)
    })

    .command('ritual.publish', 'publish a ritual message', (yargs) => {
      yargs
        .option('root', {
          type: 'string'
        })
        .option('shards', {
          type: 'number'
        })
        .option('quorum', {
          type: 'number'
        })
    }, (argv) => {
      const { root, shards, quorum } = argv
      darkCrystal.ritual.async.publish({ root, shards, quorum }, callback)
    })

    .command('ritual.publishAll', 'for each shard, a shard message will be published to both the recipient and the sender', (yargs) => {
      yargs
        .option('rootId', {
          type: 'string'
        })
        .option('shards', {
          type: 'array'
        })
        .option('quorum', {
          type: 'number'
        })
    }, (argv) => {
      const { root, shards, quorum } = argv
      darkCrystal.ritual.async.publish({ root, shards, quorum }, callback)
    })

    .command('shard.byRoot <rootId>', 'get a stream of shard messages identified by root id', (yargs) => {
      yargs
        .positional('rootId', {
          type: 'string'
        })
    }, (argv) => {
      pullback(darkCrystal.shard.pull.byRoot(argv.rootId))
    })

    .command('shard.fromOthers', 'get a stream of shards others have shared with you', () => {}, (argv) => {
      pullback(darkCrystal.shard.pull.fromOthers())
    })

    .command('isRitual <ritual>', 'validate ritual', (yargs) => {
      yargs
        .positional('ritual', {
          type: 'string'
        })
    }, (argv) => {
      log(darkCrystal.sync.isRitual(argv.ritual))
      server.close()
    })

    .command('isRoot <root>', 'validate root', (yargs) => {
      yargs
        .positional('root', {
          type: 'string'
        })
    }, (argv) => {
      log(darkCrystal.sync.isRoot(argv.root))
      server.close()
    })
    .command('isShard <shard>', 'validate shard', (yargs) => {
      yargs
        .positional('shard', {
          type: 'string'
        })
    }, (argv) => {
      log(darkCrystal.sync.isShard(argv.shard))
      server.close()
    })
    .argv
}
