# Dark Crystal API

Returns a set of functions as an API for validating, building, publishing and reading records dictated by [ssb-dark-crystal-schema](https://github.com/blockades/dark-crystal').

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
