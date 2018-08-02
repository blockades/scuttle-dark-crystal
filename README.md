# Dark Crystal API

Returns a set of functions as an API for validating, building, publishing and reading records dictated by [ssb-dark-crystal-schema](https://github.com/blockades/dark-crystal').

## Instantiate

```js
var DarkCrystal = require('scuttle-dark-crystal')
var darkCrystal = DarkCrystal(server) // a scuttlebutt server or connection to one
```

## API Methods

### `darkCrystal.share.async.share({name,secret,quorum,recps}, callback)`

Takes an object with properties:
- `name` a name referring to the secret
- `secret` the secret string itself
- `quorum` the minimum number of shards required to recombine
- `recps` an array of ssb feedIds for the shard recipients

The secret is sharded and a root message, ritual message and one shard message for each recipient are published.  If successful, the published messages will be passed as an object to the callback.

### `darkCrystal.recover.async.request(rootId, recipients, callback)`

This method publishes `invite` messages with a request to return a shard. If `recipients` is falsey, invite messages to all shardholders associated with the given rootId will be published.  If `recipients` is an array containing one or more feedIds, invite messages to only the given recipients will be published, provided they hold shards associated with the given rootId.  If successful, the published invite messages are passed to the callback.

This method can also be called : `darkCrystal.recover.async.request(rootId, callback)` and it will send requests to al shard-holders

### `darkCrystal.recover.async.reply(inviteId,callback)`

This will respond to a given invite message, by decrypting the associated shard and publishing an `invite-reply` message providing the shard in the `body` property.  If successful, the reply message is passed to the callback.

### `darkCrystal.recover.async.recombine(rootId,callback)`

***WIP***
This will attempt to recombine the decrypted shards included in reply messages associated with a given rootId.  If successful the secret will be passed to the callback.

### `darkCrystal.root.async.publish(name,callback)`

Takes a secret name as an argument and publishes a root message.  If successful, the published message will be passed to the callback.

### `darkCrystal.ritual.async.publish ({ root, shards, quorum }, callback)`
Takes an object with properties:

- `root` the ID of the root message
- `shards` the number of shards
- `quorum` the minimum number of shards required to recombine

A ritual message is published.  If successful, the published message will be passed to the callback.

### `darkCrystal.shard.async.publishAll( { shards, recps, rootId }, callback)`

Takes an object with properties:

- `shards` an array of shard strings
- `recps` an array of ssb feedIds for the shard recipients
- `rootId` the ID of the root message

For each shard, a shard message will be published to both the recipient and the sender.  If successful, the published messages will be passed to the callback.  In the case of at least one validation error, no messages will be published.

### `darkCrystal.sync.isRitual(ritual)`, `darkCrystal.sync.isRoot(root)`, `darkCrystal.sync.isShard(shard)`

These are validation methods for each message type as described in [ssb-dark-crystal-schema](https://github.com/blockades/dark-crystal').

