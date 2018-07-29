# Dark Crystal API

Returns a set of functions as an API for validating, building, publishing and reading records dictated by [ssb-dark-crystal-schema](https://github.com/blockades/dark-crystal').

## API Methods

### `darkcrystal.share.async.share({name,secret,quorum,recps}, callback)`

Takes an object with properties:
- `name` a name referring to the secret
- `secret` the secret string itself
- `quorum` the minimum number of shards required to recombine
- `recps` an array of ssb feedIds for the shard recipients

The secret is sharded and a root message, ritual message and one shard message for each recipient are published.  If successful, the published messages will be passed as an object to the callback.

### `darkcrystal.request.async.request(rootId,callback)`

This will publish an `invite` message with a request to return a shard to each shardholder associated with a given rootId.  If successful, the invite messages are passed to the callback.

### `darkcrystal.reply.async.reply(inviteId,callback)`

This will respond to a given invite message, by decrypting the associated shard and publishing an `invite-reply` message providing the shard in the `body` property.  If successful, the reply message is passed to the callback.

### `darkcrystal.recombine.async.recombine(rootId,callback)`

***WIP***
This will attempt to recombine the decrypted shards included in reply messages associated with a given rootId.  If successful the secret will be passed to the callback.

### `darkcrystal.root.async.publish(name,callback)`

Takes a secret name as an argument and publishes a root message.  If successful, the published message will be passed to the callback.

### `darkcrystal.ritual.async.publish ({ root, shards, quorum }, callback)`
Takes an object with properties:

- `root` the ID of the root message
- `shards` the number of shards
- `quorum` the minimum number of shards required to recombine

A ritual message is published.  If successful, the published message will be passed to the callback.

### `darkcrystal.shard.async.publishAll( { shards, recps, rootId }, callback)`

Takes an object with properties:

- `shards` an array of shard strings
- `recps` an array of ssb feedIds for the shard recipients
- `rootId` the ID of the root message

For each shard, a shard message will be published to both the recipient and the sender.  If successful, the published messages will be passed to the callback.  In the case of at least one validation error, no messages will be published.

### `darkcrystal.sync.isRitual(ritual)`, `darkcrystal.sync.isRoot(root)`, `darkcrystal.sync.isShard(shard)`

These are validation methods for each message type as described in [ssb-dark-crystal-schema](https://github.com/blockades/dark-crystal').


```js
const api = {
  darkcrystal: {
    async: {
      publish: {
        root,
        ritual,
        shard
      },
      get: {
        root,
        ritual,
        shard
      },
      share
    },
    pull: {
      all: {
        root,
        ritual,
        shard
      },
      mine: {
        root,
        ritual,
        shard
      },
      others: {
        root,
        ritual,
        shard
      },
    },
    sync: {
      build: {
        root,
        ritual,
        shard
      },
      validate: {
        isRoot,
        isRitual,
        isShard
      }
    }
  }
}
```
