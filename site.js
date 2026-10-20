(() => {
  const previousFocus = new WeakMap();

  // One snapshot for the entire modal stack. iOS Safari may temporarily
  // report window.scrollY=0 while the body is fixed, so never recapture it
  // when moving between overlapping dialogs.
  let scrollLock = null;
  let restorationGeneration = 0;

  function currentPageScroll() {
    const root = document.scrollingElement || document.documentElement;
    return {
      x: window.scrollX || window.pageXOffset || root.scrollLeft || 0,
      y: window.scrollY || window.pageYOffset || root.scrollTop || 0
    };
  }

  function lockPageScroll() {
    if (scrollLock) return;
    ++restorationGeneration; // Cancel pending restore frames on a new open.

    const { x, y } = currentPageScroll();
    const body = document.body;
    scrollLock = {
      x,
      y,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width
    };

    body.style.position = "fixed";
    body.style.top = "-" + y + "px";
    body.style.left = "-" + x + "px";
    body.style.right = "0";
    body.style.width = "100%";
    document.documentElement.classList.add("no-scroll");
  }

  function unlockPageScroll() {
    const saved = scrollLock;
    if (!saved) return;
    scrollLock = null;
    const generation = ++restorationGeneration;

    // Restore page layout first, then the scroll root. Restoring only once
    // here races the fixed-body reflow on iPhone Safari and jumps to top.
    const body = document.body;
    body.style.position = saved.position;
    body.style.top = saved.top;
    body.style.left = saved.left;
    body.style.right = saved.right;
    body.style.width = saved.width;
    document.documentElement.classList.remove("no-scroll");

    const restore = () => {
      if (generation !== restorationGeneration ||
          scrollLock || getOpenModals().length) return;

      window.scrollTo(saved.x, saved.y);

      // Safari can delay the viewport scroll root until the next frame.
      const root = document.scrollingElement || document.documentElement;
      if (Math.abs(root.scrollTop - saved.y) > 1) {
        root.scrollTop = saved.y;
      }
      if (Math.abs(root.scrollLeft - saved.x) > 1) {
        root.scrollLeft = saved.x;
      }
    };

    restore();
    requestAnimationFrame(() => {
      restore();
      requestAnimationFrame(restore);
    });
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
      if (!modal.classList.contains("open")) return;
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
    if (!modal || !modal.classList.contains("open")) return;

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");

    const trigger = previousFocus.get(modal);
    previousFocus.delete(modal);

    modal.dispatchEvent(
      new CustomEvent("ll:modal-closed")
    );

    // Closing one panel in a stack must not unlock the page or refocus a
    // trigger hidden behind another panel (commission envelope -> letter).
    if (!getOpenModals().length) {
      if (trigger && trigger.isConnected) {
        trigger.focus({ preventScroll: true });
      }
      // Restore AFTER focus. Some browsers ignore preventScroll when a
      // previously fixed body first becomes scrollable again.
      unlockPageScroll();
    }
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
