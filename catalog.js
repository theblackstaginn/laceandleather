(() => {
  const products = {
    "grimoire": {
      id: "grimoire",
      name: "Grimoire Pages",
      price: 5.00
    },
    "mapmaker": {
      id: "mapmaker",
      name: "Mapmaker Sheets",
      price: 5.00
    },
    "volone": {
      id: "volone",
      name: "Light Aged Parchment - Vol. One",
      price: 5.00,
      aliases: ["Light Aged Parchment — Vol. One"]
    },
    "smithy": {
      id: "smithy",
      name: "Smithy Textures",
      price: 5.00
    },
    "button-amber-bronze": {
      id: "button-amber-bronze",
      name: "Amber Bronze",
      price: 1.00,
      asset: "buttons-stickers/amber-bronze.png"
    },
    "button-amethyst-frame": {
      id: "button-amethyst-frame",
      name: "Amethyst Frame",
      price: 1.00,
      asset: "buttons-stickers/amethyst-frame.png"
    },
    "button-amethyst-rectangle": {
      id: "button-amethyst-rectangle",
      name: "Amethyst Rectangle",
      price: 1.00,
      asset: "buttons-stickers/amethyst-rectangle.png"
    },
    "button-emerald-oval": {
      id: "button-emerald-oval",
      name: "Emerald Oval",
      price: 1.00,
      asset: "buttons-stickers/emerald-oval.png"
    },
    "button-emerald-x": {
      id: "button-emerald-x",
      name: "Emerald X",
      price: 1.00,
      asset: "buttons-stickers/emerald-x.png"
    },
    "button-green-moon": {
      id: "button-green-moon",
      name: "Green Moon",
      price: 1.00,
      asset: "buttons-stickers/green-moon.png"
    },
    "button-grn-wax-book": {
      id: "button-grn-wax-book",
      name: "Grn Wax Book",
      price: 1.00,
      asset: "buttons-stickers/grn-wax-book.png"
    },
    "button-lantern": {
      id: "button-lantern",
      name: "Lantern",
      price: 1.00,
      asset: "buttons-stickers/lantern.png"
    },
    "button-moon-green": {
      id: "button-moon-green",
      name: "Moon Green",
      price: 1.00,
      asset: "buttons-stickers/moon-green.png"
    },
    "button-moon-parch-clean": {
      id: "button-moon-parch-clean",
      name: "Moon Parch Clean",
      price: 1.00,
      asset: "buttons-stickers/moon-parch-clean.png"
    },
    "button-purple-arrow": {
      id: "button-purple-arrow",
      name: "Purple Arrow",
      price: 1.00,
      asset: "buttons-stickers/purple-arrow.png"
    },
    "button-purple-wax-crystal": {
      id: "button-purple-wax-crystal",
      name: "Purple Wax Crystal",
      price: 1.00,
      asset: "buttons-stickers/purple-wax-crystal.png"
    },
    "button-purple-x-shield": {
      id: "button-purple-x-shield",
      name: "Purple X Shield",
      price: 1.00,
      asset: "buttons-stickers/purple-x-shield.png"
    },
    "button-red-arrow": {
      id: "button-red-arrow",
      name: "Red Arrow",
      price: 1.00,
      asset: "buttons-stickers/red-arrow.png"
    },
    "button-red-parch-arrow": {
      id: "button-red-parch-arrow",
      name: "Red Parch Arrow",
      price: 1.00,
      asset: "buttons-stickers/red-parch-arrow.png"
    },
    "button-red-stag": {
      id: "button-red-stag",
      name: "Red Stag",
      price: 1.00,
      asset: "buttons-stickers/red-stag.png"
    },
    "button-red-wax-feather": {
      id: "button-red-wax-feather",
      name: "Red Wax Feather",
      price: 1.00,
      asset: "buttons-stickers/red-wax-feather.png"
    },
    "button-red-x-bronze": {
      id: "button-red-x-bronze",
      name: "Red X Bronze",
      price: 1.00,
      asset: "buttons-stickers/red-x-bronze.png"
    },
    "button-red-x-shield": {
      id: "button-red-x-shield",
      name: "Red X Shield",
      price: 1.00,
      asset: "buttons-stickers/red-x-shield.png"
    },
    "button-red-x": {
      id: "button-red-x",
      name: "Red X",
      price: 1.00,
      asset: "buttons-stickers/red-x.png"
    },
    "button-ruby-plate": {
      id: "button-ruby-plate",
      name: "Ruby Plate",
      price: 1.00,
      asset: "buttons-stickers/ruby-plate.png"
    },
    "button-sapphire-arrow": {
      id: "button-sapphire-arrow",
      name: "Sapphire Arrow",
      price: 1.00,
      asset: "buttons-stickers/sapphire-arrow.png"
    },
    "button-sapphire-plate": {
      id: "button-sapphire-plate",
      name: "Sapphire Plate",
      price: 1.00,
      asset: "buttons-stickers/sapphire-plate.png"
    },
    "button-skull-bronze-plate": {
      id: "button-skull-bronze-plate",
      name: "Skull Bronze Plate",
      price: 1.00,
      asset: "buttons-stickers/skull-bronze-plate.png"
    },
    "button-skull-plate": {
      id: "button-skull-plate",
      name: "Skull Plate",
      price: 1.00,
      asset: "buttons-stickers/skull-plate.png"
    },
    "button-skull": {
      id: "button-skull",
      name: "Skull",
      price: 1.00,
      asset: "buttons-stickers/skull.png"
    },
    "button-stag-plate": {
      id: "button-stag-plate",
      name: "Stag Plate",
      price: 1.00,
      asset: "buttons-stickers/stag-plate.png"
    },
    "button-stag-red-wax": {
      id: "button-stag-red-wax",
      name: "Stag Red Wax",
      price: 1.00,
      asset: "buttons-stickers/stag-red-wax.png"
    },
    "button-wax-green-book-2": {
      id: "button-wax-green-book-2",
      name: "Wax Green Book 2",
      price: 1.00,
      asset: "buttons-stickers/wax-green-book-2.png"
    },
    "button-wax-key": {
      id: "button-wax-key",
      name: "Wax Key",
      price: 1.00,
      asset: "buttons-stickers/wax-key.png"
    },
    "button-wax-skull": {
      id: "button-wax-skull",
      name: "Wax Skull",
      price: 1.00,
      asset: "buttons-stickers/wax-skull.png"
    }
  };

  function normalizeName(value) {
    return String(value || "")
      .trim()
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  window.LACE_LEATHER_PRODUCTS =
    Object.freeze(
      Object.fromEntries(
        Object.entries(products).map(
          ([key, value]) => [
            key,
            Object.freeze({
              ...value,
              aliases: value.aliases
                ? Object.freeze([...value.aliases])
                : undefined
            })
          ]
        )
      )
    );

  window.LaceLeatherCatalog = {
    get(id) {
      return (
        window.LACE_LEATHER_PRODUCTS[id]
        || null
      );
    },

    findByName(name) {
      const target = normalizeName(name);

      return (
        Object.values(
          window.LACE_LEATHER_PRODUCTS
        ).find(product => {
          if (normalizeName(product.name) === target) {
            return true;
          }

          return Array.isArray(product.aliases)
            && product.aliases.some(
              alias => normalizeName(alias) === target
            );
        })
        || null
      );
    },

    normalizeCart(rawCart) {
      if (!Array.isArray(rawCart)) {
        return [];
      }

      return rawCart
        .map(item => {
          const product =
            this.get(item?.id)
            || this.findByName(
              item?.name
            );

          if (!product) {
            return null;
          }

          return {
            id: product.id,
            name: product.name,
            price: product.price,
            qty: Math.max(
              1,
              Math.min(
                99,
                Math.floor(Number(item?.qty) || 1)
              )
            )
          };
        })
        .filter(Boolean);
    }
  };
})();
