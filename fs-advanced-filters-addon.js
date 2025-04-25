(function () {
  const version = "version 1.0.46"; // Updated version number for clarity
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
    fadeOutClass: 'fade-out', // Class to fade out elements
    hideClass: 'hide', // Class to hide elements
    firstItemClass: 'first-item', // Class for the first visible item
    lastItemClass: 'last-item', // Class for the last visible item
    timeoutDelay: 300, // Timeout delay for updates
    scrollDelay: 100, // Delay for scroll-to-top behavior
    filteredResultsSelector: '[data-filtered-results]', // Add this line
  };

  const originalFilterCounts = new Map(); // Store original counts for each filter button

  // Utility: Log messages in debug mode
  const logDebug = (message, ...args) => {
    if (DEBUG) console.log(message, ...args);
  };

  // ✅ Smooth scroll-to-top helper using GSAP
  function scrollToTopAfterPagination() {
    const scrollTarget = document.querySelector(CONFIG.scrollTargetSelector) || document.body;

    if (scrollTarget) {
      gsap.to(window, {
        scrollTo: { y: scrollTarget, autoKill: true },
        duration: 0.7, // Adjust duration for smoother or quicker scrolling
        ease: "power2.out",
      });
      logDebug('✅ Smooth scroll triggered to target:', scrollTarget);
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

  // Add this function to calculate initial counts
  function calculateInitialCounts(filterInstance) {
    const allItems = filterInstance.listInstance.items;
    const counts = new Map();
    
    // Get all tags from all items
    allItems.forEach(item => {
        // Access tags data - it's a Finsweet filter object with a values Set
        const tagData = item.props?.tags;
        if (!tagData?.values) return;
        
        // Get tags from the values Set
        tagData.values.forEach(tag => {
            if (!tag) return;
            const currentCount = counts.get(tag) || 0;
            counts.set(tag, currentCount + 1);
            logDebug(`📊 Updated count for "${tag}": ${currentCount + 1}`);
        });
    });
    
    logDebug('📊 Final counts:', Object.fromEntries(counts));
    return counts;
}

// Modify the calculateFilterCounts function
function calculateFilterCounts(filterInstance) {
    const filterFields = filterInstance.filtersData;
    if (!filterFields?.length) {
        logDebug('⚠️ No filter fields found');
        return;
    }

    // Calculate total counts once and store them
    const totalCounts = calculateInitialCounts(filterInstance);
    logDebug('📊 Total counts calculated:', Object.fromEntries(totalCounts));

    filterFields.forEach((filterField) => {
        // Only process tag filters
        if (filterField.filterKeys[0] === 'tags') {
            filterField.elements.forEach((element) => {
                const el = element.element.closest(CONFIG.filterButtonSelector);
                if (!el) return;

                const filterValue = element.value;
                logDebug(`🔍 Processing filter: "${filterValue}"`);
                
                // Get the total count for this tag
                const totalCount = totalCounts.get(filterValue) || 0;
                logDebug(`📊 Found count: ${totalCount} for "${filterValue}"`);

                // Store and display the count
                originalFilterCounts.set(el, totalCount);
                const countEl = el.querySelector(CONFIG.filterCountSelector);
                if (countEl) {
                    countEl.textContent = `(${totalCount})`;
                    logDebug(`✅ Total count set for "${filterValue}": ${totalCount}`);
                }
            });
        }
    });
}

// Modify updateFilteredResults function
function updateFilteredResults(filterInstance) {
    const resultsElement = document.querySelector(CONFIG.filteredResultsSelector);
    if (!resultsElement) {
        logDebug('⚠️ No results element found');
        return;
    }

    // Get total and visible items
    const totalItems = filterInstance.listInstance.items.length;
    const visibleItems = filterInstance.listInstance.items.filter(item => item.valid);
    const numVisible = visibleItems.length;

    // Calculate pagination details
    const pageSize = 50; // Match your CMS collection list page size
    const currentPage = Math.ceil(filterInstance.listInstance.currentPage || 1);
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(startIndex + pageSize - 1, numVisible);

    // Get active filters
    const activeFilters = filterInstance.filtersData
        .filter(filterData => filterData.filterKeys[0] === 'tags')
        .flatMap(filterData => 
            filterData.elements
                .filter(element => element.element.closest('.is-active'))
                .map(element => ({
                    value: element.value,
                    filtered: element.resultsCount
                }))
        );

    // Create results text
    let resultsText = '';
    if (numVisible === 0) {
        resultsText = 'No results found';
    } else if (activeFilters.length === 0) {
        resultsText = `Showing ${startIndex} to ${endIndex} from ${totalItems} results`;
    } else {
        resultsText = `Showing ${startIndex} to ${endIndex} from ${numVisible} filtered results`;
    }

    // Update the element
    resultsElement.textContent = resultsText;
    logDebug('✅ Updated filtered results:', resultsText);
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

  // Optimize event handlers to use debouncing
  function handleKeywordSearch() {
    const keywordInput = document.querySelector('[data-keyword-search]');
    if (!keywordInput) return;

    let timeout;
    keywordInput.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const value = keywordInput.value.trim();
            keywordInput.classList.toggle('active', !!value);

            if (value) {
                document.querySelectorAll('[data-filter-button].active')
                    .forEach(btn => btn.classList.remove('active'));
            }

            document.dispatchEvent(new Event('fsPageUpdate'));
        }, 300);
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
          if (globalListInstance) {
            document.dispatchEvent(new Event('fsPageUpdate')); // Trigger fsPageUpdate after pagination
          } else {
            logDebug('⚠️ globalListInstance is not defined. Skipping fsPageUpdate.');
          }
          scrollToTopAfterPagination();
        }, CONFIG.timeoutDelay);
      });
    });
  }

  // ✅ Initialize filters and CMS after load
  function initCMSFilterAfterLoadAll(listInstance) {
    window.fsAttributes = window.fsAttributes || [];
    window.fsAttributes.push([
        'cmsfilter',
        ([filterInstance]) => {
            logDebug('✅ CMS Filter initialized after loadAll');
            calculateFilterCounts(filterInstance);
            handleFilterClicks(filterInstance);
            
            // Listen for filter changes
            filterInstance.listInstance.on('renderitems', () => {
                setTimeout(() => {
                    document.dispatchEvent(new Event('fsPageUpdate'));
                }, CONFIG.timeoutDelay);
            });
        }
    ]);
  }

  let globalListInstance = null;

  window.fsAttributes = window.fsAttributes || [];
  window.fsAttributes.push([
    'cmsload',
    async ([listInstance]) => {
        logDebug('📦 CMS Load triggered');
        globalListInstance = listInstance;

        if (!globalListInstance) {
            logDebug('⚠️ Failed to initialize globalListInstance');
            return;
        }

        try {
            if (typeof listInstance.loadAll === 'function') {
                await listInstance.loadAll();
                logDebug('✅ All CMS items loaded');
            }

            window.fsAttributes.push([
                'cmsfilter',
                ([filterInstance]) => {
                    logDebug('✅ CMS Filter initialized');
                    initializeFilterSystem(filterInstance);
                }
            ]);
        } catch (error) {
            logDebug('⚠️ Error during initialization:', error);
        }
    }
]);

// Modify initializeFilterSystem function
function initializeFilterSystem(filterInstance) {
    // Calculate initial counts
    calculateFilterCounts(filterInstance);
    handleFilterClicks(filterInstance);

    // Initial results display
    updateFilteredResults(filterInstance);

    // Set up render listener
    filterInstance.listInstance.on('renderitems', () => {
        requestAnimationFrame(() => {
            updateFilteredResults(filterInstance);
            document.dispatchEvent(new Event('fsPageUpdate'));
        });
    });
}

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
