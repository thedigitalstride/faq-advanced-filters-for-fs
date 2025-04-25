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

  // Check cmscore.listInstances after a delay
  setTimeout(() => {
    console.log('CMS List Instances (after delay):', window.fsAttributes.cmscore?.listInstances);
  }, 1000);
})();