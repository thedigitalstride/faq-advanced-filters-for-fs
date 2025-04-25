(function () {
  const version = "version 1.0.41"; // Updated version number for clarity
  const DEBUG = true;
  if (DEBUG) console.log(version);

  // Centralized configuration for selectors and settings
  const CONFIG = {
    navbarSelector: '[data-navbar]', // Custom attribute for the navbar
    cmsListSelector: '[data-cms-list]', // Custom attribute for CMS lists
    cmsItemSelector: '[data-cms-item]', // Custom attribute for CMS items
    filterButtonSelector: '[data-filter-button]', // Custom attribute for filter buttons
    filterCountSelector: '[data-filter-count]', // Custom attribute for filter count elements
    filterMenuSelector: '[data-filter-menu]', // Custom attribute for the filter menu
    scrollTargetSelector: '[data-scroll-target]', // Custom attribute for the scroll-to-top target
    fadeOutClass: 'fade-out', // Class to fade out elements
    hideClass: 'hide', // Class to hide elements
    firstItemClass: 'first-item', // Class for the first visible item
    lastItemClass: 'last-item', // Class for the last visible item
    timeoutDelay: 300, // Timeout delay for updates
    scrollDelay: 100, // Delay for scroll-to-top behavior
  };

  const originalFilterCounts = new WeakMap();

  // Utility: Log messages in debug mode
  const logDebug = (message, ...args) => {
    if (DEBUG) console.log(message, ...args);
  };

  // ✅ Smooth scroll-to-top helper using GSAP
  function scrollToTopAfterPagination() {
    if (DEBUG) console.log('🔍 scrollToTopAfterPagination function triggered');
    const scrollTarget = document.querySelector(CONFIG.scrollTargetSelector) || document.body;

    if (scrollTarget) {
      gsap.to(window, {
        scrollTo: { y: scrollTarget, autoKill: true },
        duration: 0.7, // Adjust duration for smoother or quicker scrolling
        ease: "power2.out",
      });
      if (DEBUG) console.log('✅ Smooth scroll triggered to target:', scrollTarget);
    } else {
      if (DEBUG) console.warn('⚠️ Scroll target is null. Skipping scroll.');
    }
  }

  // ✅ Smooth fade-out using GSAP
  function fadeOutElement(element) {
    gsap.to(element, {
      opacity: 0,
      duration: 0.3, // Adjust duration for smoother or quicker fades
      onComplete: () => {
        element.style.display = "none"; // Hide the element after fading out
      },
    });
  }

  // ✅ Smooth fade-in using GSAP
  function fadeInElement(element) {
    if (element.style.display !== "none" && element.style.opacity === "1") {
      return; // Skip the fade-in if the element is already visible
    }

    element.style.display = ""; // Ensure the element is visible
    gsap.fromTo(
      element,
      { opacity: 0 },
      { opacity: 1, duration: 0.3 } // Adjust duration for smoother or quicker fades
    );
  }

  // ✅ Tag first/last visible items
  function updateCMSItemClasses() {
    const allLists = document.querySelectorAll(CONFIG.cmsListSelector);
    allLists.forEach((listContainer) => {
      if (listContainer.hasAttribute('data-skip-first-last')) return;
      const allItems = Array.from(listContainer.children).filter((child) =>
        child.classList.contains(CONFIG.cmsItemSelector.replace('.', ''))
      );
      const visibleItems = allItems.filter((item) => item.offsetParent !== null);
      if (!visibleItems.length) return;
      visibleItems.forEach((item) =>
        item.classList.remove(CONFIG.firstItemClass, CONFIG.lastItemClass)
      );
      visibleItems[0]?.classList.add(CONFIG.firstItemClass);
      visibleItems[visibleItems.length - 1]?.classList.add(CONFIG.lastItemClass);
    });
  }

  // ✅ Observe DOM changes for dynamic updates
  function observeListChanges() {
    const allLists = document.querySelectorAll(CONFIG.cmsListSelector);
    allLists.forEach((listContainer) => {
      if (listContainer.hasAttribute('data-skip-first-last')) return;
      const observer = new MutationObserver(() => {
        requestAnimationFrame(updateCMSItemClasses);
      });
      observer.observe(listContainer, { childList: true, subtree: true });
    });
  }

  // ✅ Calculate and display static filter counts
  function calculateFilterCounts(filterInstance) {
    const filterFields = filterInstance.filtersData;
    if (!filterFields?.length) return;

    filterFields.forEach((filterField) => {
      filterField.elements.forEach((element) => {
        const el = element.element.closest(CONFIG.filterButtonSelector);
        if (!el) return;

        const staticCount = element.resultsCount;
        originalFilterCounts.set(el, staticCount);

        const countEl = el.querySelector(CONFIG.filterCountSelector);
        if (countEl) {
          countEl.textContent = `(${staticCount})`;
          logDebug(`🔢 Filter count set: ${staticCount}`);
        }
      });
    });
  }

  // ✅ Handle filter button clicks
  function handleFilterClicks(filterInstance) {
    const filterButtons = document.querySelectorAll(CONFIG.filterButtonSelector);
    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        button.classList.toggle('active');
        logDebug('🔄 Filter button toggled:', button);

        // Trigger updates
        document.dispatchEvent(new Event('fsPageUpdate'));
      });
    });
  }

  // ✅ Handle keyword search input
  function handleKeywordSearch() {
    const keywordInput = document.querySelector('[data-keyword-search]');
    if (!keywordInput) return;

    keywordInput.addEventListener('input', () => {
      const value = keywordInput.value.trim();
      if (value) {
        keywordInput.classList.add('active');
      } else {
        keywordInput.classList.remove('active');
      }

      // Reset filters when keyword search is active
      if (value) {
        document.querySelectorAll('[data-filter-button].active').forEach((button) => {
          button.classList.remove('active');
        });
      }

      // Trigger updates
      document.dispatchEvent(new Event('fsPageUpdate'));
    });
  }

  // ✅ Initialize filters and pagination
  function initFiltersAndPagination(filterInstance) {
    calculateFilterCounts(filterInstance);
    handleFilterClicks(filterInstance);

    document.querySelectorAll('[data-pagination-button]').forEach((button) => {
      button.addEventListener('click', () => {
        logDebug('🔍 Pagination button clicked');
        setTimeout(() => {
          document.dispatchEvent(new Event('fsPageUpdate'));
          scrollToTopAfterPagination();
        }, CONFIG.timeoutDelay);
      });
    });
  }

  // ✅ CMS Filter Init
  function initCMSFilterAfterLoadAll() {
    window.fsAttributes.push([
      'cmsfilter',
      ([filterInstance]) => {
        logDebug('✅ CMS Filter initialized after loadAll');

        initFiltersAndPagination(filterInstance);

        filterInstance.listInstance.on('renderitems', () => {
          setTimeout(() => {
            document.dispatchEvent(new Event('fsPageUpdate'));
          }, CONFIG.timeoutDelay);
        });
      },
    ]);
  }

  // ✅ Load All Items first
  window.fsAttributes = window.fsAttributes || [];
  window.fsAttributes.push([
    'cmsload',
    ([listInstance]) => {
      logDebug('📦 CMS Load triggered');
      if (typeof listInstance?.loadAll === 'function') {
        listInstance.loadAll().then(() => {
          logDebug('✅ All CMS items loaded via loadAll');
          initCMSFilterAfterLoadAll();
        });
      } else {
        logDebug('⚠️ loadAll not available. Proceeding without it.');
        setTimeout(initCMSFilterAfterLoadAll, CONFIG.timeoutDelay);
      }
    },
  ]);

  // ✅ Init on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    handleKeywordSearch();
    updateCMSItemClasses();
    observeListChanges();
  });

  document.addEventListener('fsPageUpdate', () => {
    logDebug('🔍 fsPageUpdate event triggered');
    setTimeout(() => {
      updateCMSItemClasses();
      scrollToTopAfterPagination();
    }, CONFIG.scrollDelay);
  });
})();
