(() => {
  const products = {
    "grimoire": {
      id: "grimoire",
      name: "Grimoire Pages",
      price: 4.25
    },
    "mapmaker": {
      id: "mapmaker",
      name: "Mapmaker Sheets",
      price: 5.00
    },
    "volone": {
      id: "volone",
      name: "Light Aged Parchment - Vol. One",
      price: 4.25,
      aliases: ["Light Aged Parchment — Vol. One"]
    },
    "smithy": {
      id: "smithy",
      name: "Smithy Textures",
      price: 5.00
    },
    "illuminated": {
      id: "illuminated",
      name: "Illuminated Manuscripts Vol. 1",
      price: 5.00
    },
    "voltwo": {
      id: "voltwo",
      name: "Parchment Light Vol. 2",
      price: 3.75
    },
    "grimoire-journal": {
      id: "grimoire-journal",
      name: "Grimoire Journal Pages Vol. 1",
      price: 3.50
    },
    "bookmaker": {
      id: "bookmaker",
      name: "Old-World Bookmaker Stickers & Seals Vol. 1",
      price: 2.00
    },
    "gui-pack": {
      id: "gui-pack",
      name: "Fantasy RPG GUI Pack",
      price: 12.00
    },
    "button-amber-bronze": {
      id: "button-amber-bronze",
      name: "Amber Bronze",
      price: 1.00,
      asset: "assets/previews/buttons/amber-bronze-preview.webp"
    },
    "button-amethyst-frame": {
      id: "button-amethyst-frame",
      name: "Amethyst Frame",
      price: 1.00,
      asset: "assets/previews/buttons/amethyst-frame-preview.webp"
    },
    "button-amethyst-rectangle": {
      id: "button-amethyst-rectangle",
      name: "Amethyst Rectangle",
      price: 1.00,
      asset: "assets/previews/buttons/amethyst-rectangle-preview.webp"
    },
    "button-emerald-oval": {
      id: "button-emerald-oval",
      name: "Emerald Oval",
      price: 1.00,
      asset: "assets/previews/buttons/emerald-oval-preview.webp"
    },
    "button-emerald-x": {
      id: "button-emerald-x",
      name: "Emerald X",
      price: 1.00,
      asset: "assets/previews/buttons/emerald-x-preview.webp"
    },
    "button-green-moon": {
      id: "button-green-moon",
      name: "Green Moon",
      price: 1.00,
      asset: "assets/previews/buttons/green-moon-preview.webp"
    },
    "button-grn-wax-book": {
      id: "button-grn-wax-book",
      name: "Grn Wax Book",
      price: 1.00,
      asset: "assets/previews/buttons/grn-wax-book-preview.webp"
    },
    "button-lantern": {
      id: "button-lantern",
      name: "Lantern",
      price: 1.00,
      asset: "assets/previews/buttons/lantern-preview.webp"
    },
    "button-moon-green": {
      id: "button-moon-green",
      name: "Moon Green",
      price: 1.00,
      asset: "assets/previews/buttons/moon-green-preview.webp"
    },
    "button-moon-parch-clean": {
      id: "button-moon-parch-clean",
      name: "Moon Parch Clean",
      price: 1.00,
      asset: "assets/previews/buttons/moon-parch-clean-preview.webp"
    },
    "button-purple-arrow": {
      id: "button-purple-arrow",
      name: "Purple Arrow",
      price: 1.00,
      asset: "assets/previews/buttons/purple-arrow-preview.webp"
    },
    "button-purple-wax-crystal": {
      id: "button-purple-wax-crystal",
      name: "Purple Wax Crystal",
      price: 1.00,
      asset: "assets/previews/buttons/purple-wax-crystal-preview.webp"
    },
    "button-purple-x-shield": {
      id: "button-purple-x-shield",
      name: "Purple X Shield",
      price: 1.00,
      asset: "assets/previews/buttons/purple-x-shield-preview.webp"
    },
    "button-red-arrow": {
      id: "button-red-arrow",
      name: "Red Arrow",
      price: 1.00,
      asset: "assets/previews/buttons/red-arrow-preview.webp"
    },
    "button-red-parch-arrow": {
      id: "button-red-parch-arrow",
      name: "Red Parch Arrow",
      price: 1.00,
      asset: "assets/previews/buttons/red-parch-arrow-preview.webp"
    },
    "button-red-stag": {
      id: "button-red-stag",
      name: "Red Stag",
      price: 1.00,
      asset: "assets/previews/buttons/red-stag-preview.webp"
    },
    "button-red-wax-feather": {
      id: "button-red-wax-feather",
      name: "Red Wax Feather",
      price: 1.00,
      asset: "assets/previews/buttons/red-wax-feather-preview.webp"
    },
    "button-red-x-bronze": {
      id: "button-red-x-bronze",
      name: "Red X Bronze",
      price: 1.00,
      asset: "assets/previews/buttons/red-x-bronze-preview.webp"
    },
    "button-red-x-shield": {
      id: "button-red-x-shield",
      name: "Red X Shield",
      price: 1.00,
      asset: "assets/previews/buttons/red-x-shield-preview.webp"
    },
    "button-red-x": {
      id: "button-red-x",
      name: "Red X",
      price: 1.00,
      asset: "assets/previews/buttons/red-x-preview.webp"
    },
    "button-ruby-plate": {
      id: "button-ruby-plate",
      name: "Ruby Plate",
      price: 1.00,
      asset: "assets/previews/buttons/ruby-plate-preview.webp"
    },
    "button-sapphire-arrow": {
      id: "button-sapphire-arrow",
      name: "Sapphire Arrow",
      price: 1.00,
      asset: "assets/previews/buttons/sapphire-arrow-preview.webp"
    },
    "button-sapphire-plate": {
      id: "button-sapphire-plate",
      name: "Sapphire Plate",
      price: 1.00,
      asset: "assets/previews/buttons/sapphire-plate-preview.webp"
    },
    "button-skull-bronze-plate": {
      id: "button-skull-bronze-plate",
      name: "Skull Bronze Plate",
      price: 1.00,
      asset: "assets/previews/buttons/skull-bronze-plate-preview.webp"
    },
    "button-skull-plate": {
      id: "button-skull-plate",
      name: "Skull Plate",
      price: 1.00,
      asset: "assets/previews/buttons/skull-plate-preview.webp"
    },
    "button-skull": {
      id: "button-skull",
      name: "Skull",
      price: 1.00,
      asset: "assets/previews/buttons/skull-preview.webp"
    },
    "button-stag-plate": {
      id: "button-stag-plate",
      name: "Stag Plate",
      price: 1.00,
      asset: "assets/previews/buttons/stag-plate-preview.webp"
    },
    "button-stag-red-wax": {
      id: "button-stag-red-wax",
      name: "Stag Red Wax",
      price: 1.00,
      asset: "assets/previews/buttons/stag-red-wax-preview.webp"
    },
    "button-wax-green-book-2": {
      id: "button-wax-green-book-2",
      name: "Wax Green Book 2",
      price: 1.00,
      asset: "assets/previews/buttons/wax-green-book-2-preview.webp"
    },
    "button-wax-key": {
      id: "button-wax-key",
      name: "Wax Key",
      price: 1.00,
      asset: "assets/previews/buttons/wax-key-preview.webp"
    },
    "button-wax-skull": {
      id: "button-wax-skull",
      name: "Wax Skull",
      price: 1.00,
      asset: "assets/previews/buttons/wax-skull-preview.webp"
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
