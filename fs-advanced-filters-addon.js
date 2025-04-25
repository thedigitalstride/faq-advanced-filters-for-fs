(function () {
  const version = "version 1.0.19";
  const DEBUG = false;
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

  if (DEBUG) console.log('✅ Debug mode is enabled');

  // Utility: Add or remove classes
  const toggleClass = (element, className, condition) => {
    if (condition) {
      element.classList.add(className);
    } else {
      element.classList.remove(className);
    }
  };

  // ✅ Smooth scroll-to-top helper using GSAP
  function scrollToTopAfterPagination() {
    if (DEBUG) console.log('🔍 scrollToTopAfterPagination function triggered');
    const scrollTarget = document.querySelector(CONFIG.scrollTargetSelector) || document.body;

    if (scrollTarget) {
      gsap.to(window, {
        scrollTo: { y: scrollTarget, autoKill: true },
        duration: 0.5, // Adjust duration for smoother or quicker scrolling
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
    // Check if the element is already visible
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
          if (fullCount === 0) {
            fadeOutElement(wrapper); // Use GSAP fade-out
          } else {
            fadeInElement(wrapper); // Use GSAP fade-in
          }
        }
      });
    });

    const menu = document.querySelector(CONFIG.filterMenuSelector);
    if (menu) {
      fadeInElement(menu); // Use GSAP fade-in for the menu
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

        // Dispatch fsPageUpdate after filter updates
        filterInstance.listInstance.on('renderitems', () => {
          setTimeout(() => {
            hideEmptyFilters(filterInstance);
            updateCMSItemClasses();
            document.dispatchEvent(new Event('fsPageUpdate'));
          }, CONFIG.timeoutDelay);
        });

        // Dispatch fsPageUpdate after pagination
        document.querySelectorAll('[data-pagination-button]').forEach((button) => {
          button.addEventListener('click', () => {
            if (DEBUG) console.log('🔍 Pagination button clicked');
            setTimeout(() => {
              document.dispatchEvent(new Event('fsPageUpdate')); // Dispatch the event
            }, CONFIG.timeoutDelay);
          });
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
    if (DEBUG) console.log('🔍 fsPageUpdate event triggered');
    setTimeout(() => {
      updateCMSItemClasses();
      scrollToTopAfterPagination();
    }, CONFIG.timeoutDelay + 200); // Add extra delay
  });

  function resetOtherFilters(type) {
    if (type === 'keyword') {
      // Reset named tag filters
      const activeFilters = document.querySelectorAll('[data-filter-button].active');
      activeFilters.forEach((filter) => filter.classList.remove('active'));
      if (DEBUG) console.log('🔄 Named tag filters reset due to keyword search');
    } else if (type === 'tag') {
      // Reset keyword search
      const keywordInput = document.querySelector('[data-keyword-search]');
      if (keywordInput) {
        keywordInput.value = ''; // Clear the input value
        keywordInput.classList.remove('active'); // Remove styling class
        if (DEBUG) console.log('🔄 Keyword search reset due to named tag filter');
      }
    }
  }

  function debounce(func, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  }

  const debouncedFsPageUpdate = debounce(() => {
    document.dispatchEvent(new Event('fsPageUpdate'));
  }, CONFIG.timeoutDelay);

  const keywordInput = document.querySelector('[data-keyword-search]');
  if (keywordInput) {
    let previousValue = ''; // Track the previous value of the input

    const debouncedFsPageUpdate = debounce(() => {
      document.dispatchEvent(new Event('fsPageUpdate'));
    }, CONFIG.timeoutDelay);

    keywordInput.addEventListener('input', () => {
      if (DEBUG) console.log('🔍 Keyword search input detected');

      const currentValue = keywordInput.value.trim();

      // Add or remove the class for visual state
      if (currentValue) {
        keywordInput.classList.add('active'); // Add styling class
        if (DEBUG) console.log('🔄 Keyword search is active');
      } else {
        keywordInput.classList.remove('active'); // Remove styling class
        if (DEBUG) console.log('🔄 Keyword search is inactive');
      }

      // Only reset named tag filters if the input value changes from empty to non-empty
      if (!previousValue && currentValue) {
        resetOtherFilters('keyword');
        if (DEBUG) console.log('🔄 Named tag filters reset due to keyword search');
      }

      previousValue = currentValue; // Update the previous value

      // Trigger updates without refreshing the UI unnecessarily
      debouncedFsPageUpdate();
    });
  }

  const clearFiltersButton = document.querySelector('[data-clear-filters]');
  if (clearFiltersButton) {
    clearFiltersButton.addEventListener('click', () => {
      if (DEBUG) console.log('🔄 Clear Filters button clicked');

      // Reset keyword search
      const keywordInput = document.querySelector('[data-keyword-search]');
      if (keywordInput) {
        keywordInput.value = '';
        keywordInput.classList.remove('active'); // Remove styling class
        if (DEBUG) console.log('🔄 Keyword search reset');
      }

      // Reset named tag filters
      const activeFilters = document.querySelectorAll('[data-filter-button].active');
      activeFilters.forEach((filter) => {
        filter.classList.remove('active'); // Remove active class
        if (DEBUG) console.log('🔄 Named tag filter reset:', filter);
      });

      // Trigger updates
      setTimeout(() => {
        document.dispatchEvent(new Event('fsPageUpdate')); // Dispatch the event
      }, CONFIG.timeoutDelay);
    });
  }
})();
