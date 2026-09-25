// Stable IDs identify products; storageKey retains existing Japanese inventory keys.
// kind/slot describe use separately from shop category and inventory storage.
// Future clothes/collars/bags can add wearable slots; toys/furniture use kind and
// inventory: 'items' (ID-keyed ownership). Their room interactions need separate renderers.
window.MAKOPET_CATALOG=Object.freeze([
  {
    "id": "apple",
    "category": "food",
    "kind": "consumable",
    "slot": null,
    "name": "りんご",
    "storageKey": "りんご",
    "price": 5,
    "image": "./assets/shop/apple.svg",
    "inventory": "food",
    "unique": false,
    "belly": 10
  },
  {
    "id": "rice",
    "category": "food",
    "kind": "consumable",
    "slot": null,
    "name": "おにぎり",
    "storageKey": "おにぎり",
    "price": 10,
    "image": "./assets/shop/rice.svg",
    "inventory": "food",
    "unique": false,
    "belly": 15
  },
  {
    "id": "donut",
    "category": "food",
    "kind": "consumable",
    "slot": null,
    "name": "ドーナツ",
    "storageKey": "ドーナツ",
    "price": 20,
    "image": "./assets/shop/donut.svg",
    "inventory": "food",
    "unique": false,
    "belly": 25
  },
  {
    "id": "pancake",
    "category": "food",
    "kind": "consumable",
    "slot": null,
    "name": "パンケーキ",
    "storageKey": "パンケーキ",
    "price": 40,
    "image": "./assets/shop/pancake.svg",
    "inventory": "food",
    "unique": false,
    "belly": 30
  },
  {
    "id": "ribbon-pink",
    "category": "dress",
    "kind": "wearable",
    "slot": "ribbon",
    "name": "ピンクリボン",
    "storageKey": "ピンクリボン",
    "price": 15,
    "image": "./accessories/ribbon_pink.png",
    "inventory": "dress",
    "unique": true
  },
  {
    "id": "ribbon-blue",
    "category": "dress",
    "kind": "wearable",
    "slot": "ribbon",
    "name": "水色リボン",
    "storageKey": "水色リボン",
    "price": 15,
    "image": "./accessories/ribbon_blue.png",
    "inventory": "dress",
    "unique": true
  },
  {
    "id": "ribbon-yellow",
    "category": "dress",
    "kind": "wearable",
    "slot": "ribbon",
    "name": "黄色リボン",
    "storageKey": "黄色リボン",
    "price": 20,
    "image": "./accessories/ribbon_yellow.png",
    "inventory": "dress",
    "unique": true
  },
  {
    "id": "ribbon-purple",
    "category": "dress",
    "kind": "wearable",
    "slot": "ribbon",
    "name": "紫リボン",
    "storageKey": "紫リボン",
    "price": 40,
    "image": "./accessories/ribbon_purple.png",
    "inventory": "dress",
    "unique": true
  },
  {
    "id": "ribbon-green",
    "category": "dress",
    "kind": "wearable",
    "slot": "ribbon",
    "name": "緑リボン",
    "storageKey": "緑リボン",
    "price": 45,
    "image": "./accessories/ribbon_green.png",
    "inventory": "dress",
    "unique": true
  },
  {
    "id": "glasses",
    "category": "dress",
    "kind": "wearable",
    "slot": "glasses",
    "name": "まるメガネ",
    "storageKey": "まるメガネ",
    "price": 20,
    "image": "./accessories/glasses.png",
    "inventory": "dress",
    "unique": true
  },
  {
    "id": "hat",
    "category": "dress",
    "kind": "wearable",
    "slot": "hat",
    "name": "あかいぼうし",
    "storageKey": "あかいぼうし",
    "price": 60,
    "image": "./accessories/hat.png",
    "inventory": "dress",
    "unique": true
  }
].map(Object.freeze));
