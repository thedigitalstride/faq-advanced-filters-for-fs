(function () {
  console.log('🔍 Debugging Script Loaded');

  // Check if Finsweet Attributes are initialized
  console.log('fsAttributes:', window.fsAttributes);

  // Debugging cmsload event
  window.fsAttributes.push([
    'cmsload',
    ([listInstance]) => {
      console.log('📦 CMS Load Triggered:', listInstance);

      // Check globalListInstance
      const globalListInstance = listInstance;
      console.log('✅ globalListInstance Set:', globalListInstance);

      // Manually register the CMS list in cmscore.listInstances
      window.fsAttributes.cmscore = window.fsAttributes.cmscore || { listInstances: new Map() };
      window.fsAttributes.cmscore.listInstances.set(globalListInstance.wrapper, globalListInstance);
      console.log('✅ CMS List Manually Registered:', window.fsAttributes.cmscore.listInstances);

      // Log total and visible items
      console.log('Total Items:', globalListInstance?.items?.length || 0);
      const manuallyCalculatedVisibleItems = globalListInstance?.items?.filter((item) => item.valid) || [];
      console.log('Manually Calculated Visible Items:', manuallyCalculatedVisibleItems.length);

      // Inspect pagination data
      console.log('Full globalListInstance:', globalListInstance);
      console.log('Pagination Data:', globalListInstance?.pagination);
      console.log('Pagination Methods:', {
        goToPage: typeof globalListInstance?.goToPage,
        nextPage: typeof globalListInstance?.nextPage,
        previousPage: typeof globalListInstance?.previousPage,
      });

      // Manually calculate pagination
      const totalItems = globalListInstance?.items?.length || 0;
      const pageSize = 50; // Adjust based on your setup
      const currentPage = Math.ceil(manuallyCalculatedVisibleItems.length / pageSize);
      console.log('Manually Calculated Pagination:', {
        totalItems,
        visibleItems: manuallyCalculatedVisibleItems.length,
        pageSize,
        currentPage,
      });

      // Update Finsweet Attributes
      updateFinsweetAttributes(manuallyCalculatedVisibleItems, globalListInstance?.items?.length || 0);
    },
  ]);

  // Debugging cmsfilter event
  window.fsAttributes.push([
    'cmsfilter',
    ([filterInstance]) => {
      console.log('✅ CMS Filter Initialized:', filterInstance);

      // Track filter counts
      const filterCounts = new Map();

      // Store initial total counts
      filterInstance.filtersData.forEach((filterData) => {
        if (filterData.filterKeys[0] === 'tags') {
          filterData.elements.forEach((element) => {
            // Store initial total count
            filterCounts.set(element.value, {
              total: element.resultsCount,
              filtered: element.resultsCount
            });

            console.log(`📊 Initial count for "${element.value}":`, {
              total: element.resultsCount,
              filtered: element.resultsCount
            });
          });
        }
      });

      // Initialize results display
      updateFilteredResults(filterInstance);

      // Listen for filter changes
      filterInstance.listInstance.on('renderitems', () => {
        console.log('🔄 Filter state changed');
        
        filterInstance.filtersData.forEach((filterData) => {
          if (filterData.filterKeys[0] === 'tags') {
            filterData.elements.forEach((element) => {
              const counts = filterCounts.get(element.value);
              if (counts) {
                counts.filtered = element.resultsCount;
                console.log(`📊 Updated counts for "${element.value}":`, {
                  total: counts.total,
                  filtered: counts.filtered
                });
              }
            });
          }
        });

        // Log visible items after filter
        const visibleItems = filterInstance.listInstance.items.filter(item => item.valid);
        console.log('👁️ Currently visible items:', visibleItems.length);

        updateFilteredResults(filterInstance);

        updateFilteredResults(filterInstance);
      });

      // Log filters data
      console.log('Filters Data:', filterInstance.filtersData);

      // Iterate through filters and log details
      filterInstance.filtersData.forEach((filterData, index) => {
        console.log(`Filter ${index + 1}:`, filterData);

        // Log filter keys and values
        console.log('Original Filter Keys:', filterData.originalFilterKeys);
        console.log('Normalized Filter Keys:', filterData.filterKeys);
        console.log('Active Values:', Array.from(filterData.values));

        // Log filter elements
        filterData.elements.forEach((filterElement, elementIndex) => {
          console.log(`  Filter Element ${elementIndex + 1}:`, filterElement);
          console.log('    Value:', filterElement.value);
          console.log('    Results Count:', filterElement.resultsCount);
          console.log('    Hidden:', filterElement.hidden);
          console.log('    Active CSS Class:', filterElement.activeCSSClass);

          // Check results element
          if (filterElement.resultsElement) {
            console.log('    Results Element Text:', filterElement.resultsElement.textContent);
          }
        });
      });

      // Log visible items
      const manuallyCalculatedVisibleItems = filterInstance.listInstance?.items?.filter((item) => item.valid) || [];
      console.log('Visible Items (Manually Calculated):', manuallyCalculatedVisibleItems.length);

      // Manually apply filters
      if (filterInstance.applyFilters) {
        filterInstance.applyFilters().then(() => {
          console.log('✅ Filters Applied');
          const updatedVisibleItems = filterInstance.listInstance?.items?.filter((item) => item.valid) || [];
          console.log('Updated Visible Items:', updatedVisibleItems.length);

          // Update Finsweet Attributes
          updateFinsweetAttributes(updatedVisibleItems, filterInstance.listInstance?.items?.length || 0);
        });
      } else {
        console.log('⚠️ applyFilters method is not available');
      }

      // Update results elements
      filterInstance.filtersData.forEach((filterData) => {
        filterData.elements.forEach((filterElement) => {
          if (filterElement.resultsElement) {
            filterElement.resultsElement.textContent = filterElement.resultsCount;
            console.log('✅ Results Element Updated:', filterElement.resultsElement.textContent);
          }
        });
      });

      // Enhanced debug helper
      const logFilterState = (filterInstance) => {
        console.group('🔍 Current Filter State');
        
        // Log filter details
        filterInstance.filtersData.forEach(filterData => {
            if (filterData.filterKeys[0] === 'tags') {
                console.group(`Filter: ${filterData.filterKeys[0]}`);
                
                filterData.elements.forEach(element => {
                    const isActive = element.element.closest('.is-active');
                    console.log(`${element.value}: {
                        active: ${isActive ? '✅' : '❌'},
                        count: ${element.resultsCount},
                        total: ${element.initialCount || element.resultsCount}
                    }`);
                });
                
                console.groupEnd();
            }
        });

        // Log item counts
        const visibleItems = filterInstance.listInstance.items.filter(item => item.valid);
        console.log(`Visible/Total: ${visibleItems.length}/${filterInstance.listInstance.items.length}`);
        
        // Log pagination info
        const pageSize = 50;
        const currentPage = Math.ceil(visibleItems.length / pageSize);
        console.log('Pagination:', {
            currentPage,
            totalPages: Math.ceil(filterInstance.listInstance.items.length / pageSize),
            itemsPerPage: pageSize,
            visibleItems: visibleItems.length
        });
        
        console.groupEnd();
      };

      // Add this to the cmsfilter event handler
      window.fsAttributes.push([
        'cmsfilter',
        ([filterInstance]) => {
            console.log('✅ CMS Filter Initialized:', filterInstance);

            // Store initial counts
            filterInstance.filtersData.forEach(filterData => {
                if (filterData.filterKeys[0] === 'tags') {
                    filterData.elements.forEach(element => {
                        element.initialCount = element.resultsCount;
                        console.log(`📊 Initial count for "${element.value}": ${element.resultsCount}`);
                    });
                }
            });

            // Listen for filter changes
            filterInstance.listInstance.on('renderitems', () => {
                requestAnimationFrame(() => {
                    logFilterState(filterInstance);
                    updateFilteredResults(filterInstance);
                    updateFinsweetAttributes(
                        filterInstance.listInstance.items.filter(item => item.valid),
                        filterInstance.listInstance.items.length
                    );
                });
            });

            // Initial state logging
            logFilterState(filterInstance);
        }
      ]);
    },
  ]);

  // Function to update Finsweet attributes
  const updateFinsweetAttributes = (visibleItems, totalItems) => {
    const resultsStart = document.querySelector('[fs-cmsfilter-element="results-start"]');
    const resultsEnd = document.querySelector('[fs-cmsfilter-element="results-end"]');
    const itemsCount = document.querySelector('[fs-cmsfilter-element="items-count"]');
    const resultsCount = document.querySelector('[fs-cmsfilter-element="results-count"]');

    if (resultsStart) resultsStart.textContent = 1; // Assuming first page
    if (resultsEnd) resultsEnd.textContent = visibleItems.length;
    if (itemsCount) itemsCount.textContent = totalItems;
    if (resultsCount) resultsCount.textContent = visibleItems.length;

    console.log('✅ Finsweet Attributes Updated');
  };

  // Add this after the existing updateFinsweetAttributes function
  const updateFilteredResults = (filterInstance) => {
    const resultsElement = document.querySelector('[data-filtered-results]');
    if (!resultsElement) {
        console.log('⚠️ No results element found with [data-filtered-results]');
        return;
    }

    // Get active filters
    const activeFilters = filterInstance.filtersData
        .flatMap(filterData => 
            filterData.elements
                .filter(element => element.active)
                .map(element => ({
                    category: filterData.filterKeys[0],
                    value: element.value,
                    count: element.resultsCount
                }))
        )
        .filter(filter => filter.value); // Remove empty values

    // Get total and visible items
    const totalItems = filterInstance.listInstance.items.length;
    const visibleItems = filterInstance.listInstance.items.filter(item => item.valid).length;

    // Create results text
    let resultsText = '';
    if (activeFilters.length === 0) {
        resultsText = `Showing all ${totalItems} items`;
    } else {
        const filterText = activeFilters
            .map(filter => `${filter.value} (${filter.count})`)
            .join(', ');
        resultsText = `Showing ${visibleItems} of ${totalItems} items | Filtered by: ${filterText}`;
    }

    // Update the element
    resultsElement.textContent = resultsText;
    console.log('✅ Filtered results updated:', resultsText);
  };

  // Check cmscore.listInstances after a delay
  setTimeout(() => {
    console.log('CMS List Instances (after delay):', window.fsAttributes.cmscore?.listInstances);
  }, 1000);
})();