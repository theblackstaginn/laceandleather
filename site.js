(() => {
  const previousFocus =
    new WeakMap();

  let lockedScrollX = 0;
  let lockedScrollY = 0;
  let bodyStyleBeforeLock = null;

  function lockPageScroll() {
    lockedScrollX =
      window.scrollX
      || window.pageXOffset
      || 0;

    lockedScrollY =
      window.scrollY
      || window.pageYOffset
      || 0;

    bodyStyleBeforeLock = {
      position:
        document.body.style.position,
      top:
        document.body.style.top,
      left:
        document.body.style.left,
      right:
        document.body.style.right,
      width:
        document.body.style.width
    };

    document.body.style.position =
      "fixed";
    document.body.style.top =
      `-${lockedScrollY}px`;
    document.body.style.left =
      `-${lockedScrollX}px`;
    document.body.style.right =
      "0";
    document.body.style.width =
      "100%";

    document.documentElement
      .classList.add(
        "no-scroll"
      );
  }

  function unlockPageScroll() {
    document.documentElement
      .classList.remove(
        "no-scroll"
      );

    if (bodyStyleBeforeLock) {
      document.body.style.position =
        bodyStyleBeforeLock.position;
      document.body.style.top =
        bodyStyleBeforeLock.top;
      document.body.style.left =
        bodyStyleBeforeLock.left;
      document.body.style.right =
        bodyStyleBeforeLock.right;
      document.body.style.width =
        bodyStyleBeforeLock.width;
    }

    window.scrollTo(
      lockedScrollX,
      lockedScrollY
    );

    bodyStyleBeforeLock = null;
  }

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

    const isFirstOpenModal =
      getOpenModals().length === 0;

    if (isFirstOpenModal) {
      lockPageScroll();
    }

    modal.classList.add("open");
    modal.setAttribute(
      "aria-hidden",
      "false"
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
      unlockPageScroll();
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
