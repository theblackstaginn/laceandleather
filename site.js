(() => {
  const previousFocus =
    new WeakMap();

  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  function getFocusable(modal) {
    return Array.from(
      modal.querySelectorAll(
        focusableSelector
      )
    ).filter(
      element =>
        !element.hasAttribute(
          "hidden"
        )
        && element.getAttribute(
          "aria-hidden"
        ) !== "true"
    );
  }

  function getOpenModals() {
    return Array.from(
      document.querySelectorAll(
        ".modal.open"
      )
    );
  }

  function openModal(
    modal,
    trigger = document.activeElement
  ) {
    if (!modal) {
      return;
    }

    if (
      trigger
      && trigger instanceof HTMLElement
    ) {
      previousFocus.set(
        modal,
        trigger
      );
    }

    modal.classList.add("open");
    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.documentElement
      .classList.add(
        "no-scroll"
      );

    requestAnimationFrame(() => {
      const focusable =
        getFocusable(modal);

      (
        focusable[0]
        || modal.querySelector(
          '[role="document"]'
        )
        || modal
      ).focus?.({
        preventScroll: true
      });
    });

    modal.dispatchEvent(
      new CustomEvent(
        "ll:modal-opened"
      )
    );
  }

  function closeModal(modal) {
    if (!modal) {
      return;
    }

    modal.classList.remove("open");
    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    if (
      !getOpenModals().length
    ) {
      document.documentElement
        .classList.remove(
          "no-scroll"
        );
    }

    modal.dispatchEvent(
      new CustomEvent(
        "ll:modal-closed"
      )
    );

    const trigger =
      previousFocus.get(modal);

    if (
      trigger
      && trigger.isConnected
    ) {
      trigger.focus({
        preventScroll: true
      });
    }

    previousFocus.delete(modal);
  }

  document.addEventListener(
    "click",
    event => {
      const closeControl =
        event.target.closest(
          "[data-close]"
        );

      if (!closeControl) {
        return;
      }

      const modal =
        closeControl.closest(
          ".modal"
        );

      if (modal) {
        closeModal(modal);
      }
    }
  );

  document.addEventListener(
    "keydown",
    event => {
      const openModals =
        getOpenModals();

      if (!openModals.length) {
        return;
      }

      const modal =
        openModals[
          openModals.length - 1
        ];

      if (event.key === "Escape") {
        event.preventDefault();
        closeModal(modal);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable =
        getFocusable(modal);

      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first =
        focusable[0];

      const last =
        focusable[
          focusable.length - 1
        ];

      if (
        event.shiftKey
        && document.activeElement
          === first
      ) {
        event.preventDefault();
        last.focus();
      }
      else if (
        !event.shiftKey
        && document.activeElement
          === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }
  );

  window.LaceLeatherUI = {
    openModal,
    closeModal
  };
})();
