(function () {
  // version 1.0.6
const DEBUG = true;

  // Centralized configuration for selectors and settings
  const CONFIG = {
    navbarSelector: '[data-navbar]', // Custom attribute for the navbar
    cmsListSelector: '[data-cms-list]', // Custom attribute for CMS lists
    cmsItemSelector: '[data-cms-item]', // Custom attribute for CMS items
    filterButtonSelector: '[data-filter-button]', // Custom attribute for filter buttons
    filterCountSelector: '[data-filter-count]', // Custom attribute for filter count elements
    filterMenuSelector: '[data-filter-menu]', // Custom attribute for the filter menu
    scrollTargetSelector: '[data-scroll-target]', // Custom attribute for the scroll-to-top target
    fadeOutClass: 'fade-out', // Class to fade out elements (can remain as a class)
    hideClass: 'hide', // Class to hide elements (can remain as a class)
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

  // Utility: Add or remove classes
  const toggleClass = (element, className, condition) => {
    if (condition) {
      element.classList.add(className);
    } else {
      element.classList.remove(className);
    }
  };

  // ✅ Scroll-to-top helper after pagination
  function scrollToTopAfterPagination() {
    if (DEBUG) console.log('🔍 scrollToTopAfterPagination function triggered');
    const scrollTarget = document.querySelector(CONFIG.scrollTargetSelector) || document.body;
    if (DEBUG) {
      console.log('🔍 CONFIG.scrollTargetSelector:', CONFIG.scrollTargetSelector);
      console.log('🔍 Scroll target element:', scrollTarget);
    }

    if (scrollTarget) {
      const styles = window.getComputedStyle(scrollTarget);
      console.log('🔍 Scroll target styles:', styles);
    }

    // Existing debug logs
    if (DEBUG) {
      console.log('🔍 Scroll-to-top triggered');
      if (scrollTarget) {
        console.log('✅ Scroll target found:', scrollTarget);
      } else {
        console.warn('⚠️ Scroll target not found. Defaulting to document.body');
      }
    }

    setTimeout(() => {
      if (scrollTarget) {
        scrollTarget.scrollIntoView({ behavior: 'smooth' });
        if (DEBUG) console.log('✅ Scrolled to target:', scrollTarget);
      } else {
        if (DEBUG) console.warn('⚠️ Scroll target is null. Skipping scroll.');
      }
    }, CONFIG.scrollDelay);
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

  // ✅ Hide empty filters + count logic
  function hideEmptyFilters(filterInstance) {
    const filterFields = filterInstance.filtersData;
    if (!filterFields?.length) return;
    DEBUG && console.groupCollapsed('🧠 Filter Visibility Check');

    filterFields.forEach((filterField) => {
      filterField.elements.forEach((element) => {
        const el = element.element;
        const wrapper = el.closest(CONFIG.cmsItemSelector);
        const currentCount = element.resultsCount;

        // Store initial full count
        if (!originalFilterCounts.has(el)) {
          originalFilterCounts.set(el, currentCount);
        }
        const fullCount = originalFilterCounts.get(el);

        // Update visible count UI
        const countEl = el
          .closest(CONFIG.filterButtonSelector)
          ?.querySelector(CONFIG.filterCountSelector);
        if (countEl) countEl.textContent = `(${fullCount})`;

        if (DEBUG) {
          const label = el.textContent.trim();
          console.log(
            `%c${label} → filtered: ${currentCount}, full: ${fullCount}`,
            fullCount === 0
              ? 'color: gray'
              : currentCount === 0
              ? 'color: orange'
              : 'color: green'
          );
        }

        if (wrapper) {
          wrapper.classList.remove(CONFIG.fadeOutClass);
          if (fullCount === 0) {
            wrapper.classList.add(CONFIG.fadeOutClass);
            setTimeout(() => (wrapper.style.display = 'none'), CONFIG.timeoutDelay);
          } else {
            wrapper.style.display = '';
          }
        }
      });
    });

    const menu = document.querySelector(CONFIG.filterMenuSelector);
    if (menu) {
      menu.classList.remove(CONFIG.hideClass);
      menu.style.display = 'block';
    }

    DEBUG && console.groupEnd();
  }

  // ✅ CMS Filter Init
  function initCMSFilterAfterLoadAll() {
    window.fsAttributes.push([
      'cmsfilter',
      ([filterInstance]) => {
        DEBUG && console.log('✅ CMS Filter initialized after loadAll');

        const updateAll = () => {
          hideEmptyFilters(filterInstance);
          updateCMSItemClasses();
        };

        setTimeout(updateAll, CONFIG.timeoutDelay);

        filterInstance.listInstance.on('renderitems', () => {
          setTimeout(updateAll, CONFIG.timeoutDelay);
        });

        document.addEventListener('fsPageUpdate', () => {
          setTimeout(() => {
            updateAll();
            scrollToTopAfterPagination(); // Ensure this is called after DOM updates
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
      DEBUG && console.log('📦 CMS Load triggered');
      if (typeof listInstance?.loadAll === 'function') {
        listInstance.loadAll().then(() => {
          DEBUG && console.log('✅ All CMS items loaded via loadAll');
          initCMSFilterAfterLoadAll();
        });
      } else {
        DEBUG && console.warn('⚠️ loadAll not available. Proceeding without it.');
        initCMSFilterAfterLoadAll();
      }
    },
  ]);

  // ✅ Init first/last on load
  document.addEventListener('DOMContentLoaded', () => {
    updateCMSItemClasses();
    observeListChanges();
  });

  document.addEventListener('cmsload', () => {
    setTimeout(updateCMSItemClasses, CONFIG.timeoutDelay);
  });

  document.addEventListener('fsPageUpdate', () => {
    setTimeout(updateCMSItemClasses, CONFIG.timeoutDelay);
  });
})();
