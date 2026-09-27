(() => {
  const products = {
    grimoire: {
      id: "grimoire",
      name: "Grimoire Pages",
      price: 5.00
    },
    mapmaker: {
      id: "mapmaker",
      name: "Mapmaker Sheets",
      price: 5.00
    },
    volone: {
      id: "volone",
      name: "Light Aged Parchment - Vol. One",
      price: 5.00
    },
    smithy: {
      id: "smithy",
      name: "Smithy Textures",
      price: 5.00
    }
  };

  window.LACE_LEATHER_PRODUCTS =
    Object.freeze(
      Object.fromEntries(
        Object.entries(products).map(
          ([key, value]) => [
            key,
            Object.freeze({ ...value })
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
      const target =
        String(name || "")
          .trim();

      return (
        Object.values(
          window.LACE_LEATHER_PRODUCTS
        ).find(
          product =>
            product.name === target
        )
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
              Number(item?.qty) || 1
            )
          };
        })
        .filter(Boolean);
    }
  };
})();
