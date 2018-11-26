# Dark Crystal API

Returns a set of functions as an API for validating, building, publishing and reading records dictated by [ssb-dark-crystal-schema](https://github.com/blockades/ssb-dark-crystal-schema).

## Instantiate

```js
var DarkCrystal = require('scuttle-dark-crystal')
var darkCrystal = DarkCrystal(server) // a scuttlebutt server or connection to one
```

## API Methods

### Secret share method

#### `darkCrystal.share.async.share(opts, callback)`

Where `opts` is an object with required properties:
- `name` a name referring to the secret
- `secret` the secret string itself
- `recps` an array of ssb feedIds for the shard recipients
- `quorum` the minimum number of shards required to recombine

The secret is sharded and a root message, ritual message and one shard message for each recipient are published.  If successful, the published messages will be passed as an object to the callback.

### Secret recovery methods

#### `darkCrystal.recover.async.request(rootId, recipients, callback)`

This method publishes `invite` messages with a request to return a shard. If `recipients` is falsey, invite messages to all shardholders associated with the given rootId will be published.  If `recipients` is an array containing one or more feedIds, invite messages to only the given recipients will be published, provided they hold shards associated with the given rootId.  If successful, the published invite messages are passed to the callback.

This method can also be called : `darkCrystal.recover.async.request(rootId, callback)` and it will send requests to al shard-holders

#### `darkCrystal.recover.async.reply(inviteId, callback)`

This will respond to a given invite message, by decrypting the associated shard and publishing an `invite-reply` message providing the shard in the `body` property.  If successful, the reply message is passed to the callback.

#### `darkCrystal.recover.async.recombine(rootId,callback)`

This will attempt to recombine the decrypted shards included in reply messages associated with a given rootId.  If successful the secret will be passed to the callback.

### Root methods

#### `darkCrystal.root.async.publish(name, callback)`

Takes a secret name as an argument and publishes a root message.  If successful, the published message will be passed to the callback.

#### `darkCrystal.ritual.async.publish ({ root, shards, quorum }, callback)`
Takes an object with properties:

- `root` the ID of the root message
- `shards` the number of shards
- `quorum` the minimum number of shards required to recombine

A ritual message is published.  If successful, the published message will be passed to the callback.

### Shard methods

#### `darkCrystal.shard.async.publishAll( { shards, recps, rootId }, callback)`

Takes an object with properties:

- `shards` an array of shard strings
- `recps` an array of ssb feedIds for the shard recipients
- `rootId` the ID of the root message

For each shard, a shard message will be published to both the recipient and the sender.  If successful, the published messages will be passed to the callback.  In the case of at least one validation error, no messages will be published.

#### `darkCrystal.shard.pull.byRoot(rootId, opts)`

Returns a stream of shard messages identified by root id.  Takes `opts` - standard stream options.

#### `darkCrystal.shard.pull.fromOthers(opts)`

Returns a stream of shards others have shared with you. Takes `opts` - standard stream options like `live`, `reverse` etc.

### Shard forward methods 

#### `darkCrystal.forward.async.publish(root, recp, callback)`

Takes arguments
- `root` the id of the root message with which the shard is associated
- `recp` the feedId of the recipient of the forwarded shard

Publishes a forward message which allows a shard to be sent to someone other than the owner of the secret.

#### `darkCrystal.forward.pull.byRoot(rootId, opts)`

Returns a stream of forwarded shard messages identified by root id.  Takes `opts` - standard stream options.

#### `darkCrystal.forward.pull.fromOthers(opts)`

Returns a stream of all forwarded shards you have recieved. Takes `opts` - standard stream options like `live`, `reverse` etc.

#### `darkCrystal.recover.async.recombineForward(rootId, callback)`

Attempts to recover a secret from forwarded messages with the given `rootId`. If successful, the secret will be passed to the callback, otherwise, an error will be passed.

### `darkCrystal.sync.isRitual(ritual)`, `darkCrystal.sync.isRoot(root)`, `darkCrystal.sync.isShard(shard)`

These are validation methods for each message type as described in [ssb-dark-crystal-schema](https://github.com/blockades/ssb-dark-crystal-schema).

