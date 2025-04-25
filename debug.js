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
  
        // Log total and visible items
        console.log('Total Items:', globalListInstance?.items?.length || 0);
        console.log('Visible Items:', globalListInstance?.visibleItems?.length || 0);
  
        // Check pagination data
        console.log('Pagination Data:', globalListInstance?.pagination);
        console.log('Current Page:', globalListInstance?.pagination?.currentPage || 1);
        console.log('Page Size:', globalListInstance?.pagination?.pageSize || 50);
      },
    ]);
  
    // Debugging cmsfilter event
    window.fsAttributes.push([
      'cmsfilter',
      ([filterInstance]) => {
        console.log('✅ CMS Filter Initialized:', filterInstance);
  
        // Log filters data
        console.log('Filters Data:', filterInstance.filtersData);
  
        // Log visible items
        console.log('Visible Items:', filterInstance.listInstance?.visibleItems?.length || 0);
  
        // Manually trigger updates
        filterInstance.listInstance?.update();
        console.log('Manually Triggered Update:', filterInstance);
      },
    ]);
  
    // Check cmscore.listInstances
    console.log('CMS List Instances:', window.fsAttributes.cmscore?.listInstances);
    const listInstance = Array.from(window.fsAttributes.cmscore?.listInstances?.values() || [])[0];
    if (listInstance) {
      console.log('List Instance:', listInstance);
      console.log('Total Items:', listInstance?.items?.length || 0);
      console.log('Visible Items:', listInstance?.visibleItems?.length || 0);
    } else {
      console.log('⚠️ No CMS List Instances Found');
    }
  
    // Check Finsweet attributes in the DOM
    console.log('Results Start:', document.querySelector('[fs-cmsfilter-element="results-start"]')?.textContent);
    console.log('Results End:', document.querySelector('[fs-cmsfilter-element="results-end"]')?.textContent);
    console.log('Total Items:', document.querySelector('[fs-cmsfilter-element="items-count"]')?.textContent);
    console.log('Filtered Results:', document.querySelector('[fs-cmsfilter-element="results-count"]')?.textContent);
  
    // Manually initialize cmsfilter if needed
    if (window.fsAttributes.cmsfilter?.init) {
      window.fsAttributes.cmsfilter.init().then((filterInstance) => {
        console.log('✅ CMS Filter Manually Initialized:', filterInstance);
        console.log('Filters Data:', filterInstance.filtersData);
        console.log('Visible Items:', filterInstance.listInstance?.visibleItems?.length || 0);
      });
    } else {
      console.log('⚠️ cmsfilter.init is not available');
    }
  })();