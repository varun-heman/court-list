// DOM Elements
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const typeFilters = document.getElementById('type-filters');
const jurisdictionFilters = document.getElementById('jurisdiction-filters');
const resultsContainer = document.getElementById('results-container');
const resultsCount = document.getElementById('results-count');
const gridViewBtn = document.getElementById('grid-view');
const listViewBtn = document.getElementById('list-view');
const detailModal = document.getElementById('detail-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const visitWebsiteBtn = document.getElementById('visit-website');
const closeModalBtn = document.getElementById('close-modal');
const closeModalButtonBtn = document.getElementById('close-modal-button');
const listTab = document.getElementById('list-tab');
const mapTab = document.getElementById('map-tab');
const listViewContainer = document.getElementById('list-view-container');
const mapViewContainer = document.getElementById('map-view-container');
const fullMap = document.getElementById('full-map');
const mapResultsList = document.getElementById('map-results-list');
const mapResultsCount = document.getElementById('map-results-count');

// State
let legalBodies = [];
let filteredBodies = [];
let activeFilters = {
    types: [],
    states: [],
    search: '',
    caseTypes: [],
    documentTypes: []
};
let activeTagFilter = null; // To track the active tag filter
let currentMap = null; // To track the current map instance
let fullScreenMap = null; // To track the full-screen map instance
let markers = []; // To track map markers

// Load data
async function loadLegalBodies() {
    try {
        console.log('Attempting to fetch legal bodies data...');
        const response = await fetch('/assets/data/courts-data.json');
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Server responded with status: ${response.status}, message: ${errorText}`);
            throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
        }
        
        console.log('Data fetched successfully, parsing JSON...');
        // The data is an array directly in the JSON file
        const data = await response.json();
        console.log(`Successfully parsed JSON, found ${data.length} legal bodies`);
        
        legalBodies = data;
        
        // Initialize the app
        initializeApp();
    } catch (error) {
        console.error('Error loading data:', error);
        resultsContainer.innerHTML = `
            <div class="error">
                <p>Failed to load legal bodies data: ${error.message}</p>
                <p>Please check the browser console for more details.</p>
                <button id="retry-button" class="button primary">Retry</button>
            </div>
        `;
        
        document.getElementById('retry-button').addEventListener('click', loadLegalBodies);
    }
}

// Initialize the app
function initializeApp() {
    // Generate filters
    generateFilters();
    
    // Apply initial filters
    applyFilters();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize full-screen map
    initializeFullScreenMap();
}

// Generate filter options
function generateFilters() {
    // Extract unique types and states
    const types = [...new Set(legalBodies.map(body => body.type))].sort();
    const states = [...new Set(legalBodies.map(body => body.state))].sort();
    
    // Generate type filters
    typeFilters.innerHTML = types.map(type => {
        const count = legalBodies.filter(body => body.type === type).length;
        return `
            <li>
                <label class="filter-checkbox">
                    <input type="checkbox" name="type" value="${type}">
                    <span class="checkmark"></span>
                    <span>${type}</span>
                    <span class="filter-count">${count}</span>
                </label>
            </li>
        `;
    }).join('');
    
    // Generate state filters
    jurisdictionFilters.innerHTML = states.map(state => {
        const count = legalBodies.filter(body => body.state === state).length;
        return `
            <li>
                <label class="filter-checkbox">
                    <input type="checkbox" name="state" value="${state}">
                    <span class="checkmark"></span>
                    <span>${state}</span>
                    <span class="filter-count">${count}</span>
                </label>
            </li>
        `;
    }).join('');
}

// Apply filters and update results
function applyFilters() {
    // Get active filters
    const activeTypes = activeFilters.types;
    const activeStates = activeFilters.states;
    const activeCaseTypes = activeFilters.caseTypes;
    const activeDocumentTypes = activeFilters.documentTypes;
    const searchTerm = activeFilters.search.toLowerCase();
    
    // Filter legal bodies
    filteredBodies = legalBodies.filter(body => {
        // Type filter
        if (activeTypes.length > 0 && !activeTypes.includes(body.type)) {
            return false;
        }
        
        // State filter
        if (activeStates.length > 0 && !activeStates.includes(body.state)) {
            return false;
        }
        
        // Case Types filter
        if (activeCaseTypes.length > 0) {
            if (!body.caseTypes || !activeCaseTypes.some(caseType => body.caseTypes.includes(caseType))) {
                return false;
            }
        }
        
        // Document Types filter
        if (activeDocumentTypes.length > 0) {
            if (!body.documentTypes || !activeDocumentTypes.some(docType => body.documentTypes.includes(docType))) {
                return false;
            }
        }
        
        // Search filter
        if (searchTerm) {
            const nameMatch = body.name.toLowerCase().includes(searchTerm);
            const typeMatch = body.type.toLowerCase().includes(searchTerm);
            const descriptionMatch = body.description.toLowerCase().includes(searchTerm);
            const stateMatch = body.state.toLowerCase().includes(searchTerm);
            const caseTypesMatch = body.caseTypes && body.caseTypes.some(caseType => caseType.toLowerCase().includes(searchTerm));
            
            return nameMatch || typeMatch || descriptionMatch || stateMatch || caseTypesMatch;
        }
        
        return true;
    });
    
    // Update results count
    updateResultsCount();
    
    // Render results
    renderResults();
    
    // Update map markers
    updateMapMarkers();
}

// Update results count
function updateResultsCount() {
    // Update list view count
    if (activeTagFilter) {
        // Show the active tag filter
        resultsCount.innerHTML = `
            ${filteredBodies.length} Results
            <span class="active-filter-tag">
                ${activeTagFilter.value}
                <span class="close-tag" id="clear-tag-filter">
                    <i class="fas fa-times"></i>
                </span>
            </span>
        `;
        
        // Add event listener to the close tag button
        document.getElementById('clear-tag-filter').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            clearTagFilter();
        });
    } else if (filteredBodies.length === legalBodies.length) {
        resultsCount.textContent = 'All Legal Bodies';
    } else {
        resultsCount.textContent = `${filteredBodies.length} Results`;
    }
    
    // Update map view count
    if (activeTagFilter) {
        mapResultsCount.innerHTML = `
            ${filteredBodies.length} Results
            <span class="active-filter-tag">
                ${activeTagFilter.value}
                <span class="close-tag" id="clear-map-tag-filter">
                    <i class="fas fa-times"></i>
                </span>
            </span>
        `;
        
        // Add event listener to the close tag button
        document.getElementById('clear-map-tag-filter').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            clearTagFilter();
        });
    } else if (filteredBodies.length === legalBodies.length) {
        mapResultsCount.textContent = 'All Legal Bodies';
    } else {
        mapResultsCount.textContent = `${filteredBodies.length} Results`;
    }
}

// Render results
function renderResults() {
    // Render list view results
    if (filteredBodies.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <p>No legal bodies match your filters. Try adjusting your search criteria.</p>
                <button id="clear-filters-button" class="button primary">Clear All Filters</button>
            </div>
        `;
        
        document.getElementById('clear-filters-button').addEventListener('click', clearAllFilters);
        return;
    }
    
    resultsContainer.innerHTML = filteredBodies.map(body => `
        <div class="card" data-id="${body.name}">
            <div class="card-content">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">${body.name}</h3>
                        <div class="card-type">${body.type}</div>
                    </div>
                    <span class="card-badge">${body.state}</span>
                </div>
                <p class="card-description">${body.description}</p>
                <div class="card-footer">
                    <div class="card-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${body.location}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add click event to cards
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            const bodyName = card.getAttribute('data-id');
            const body = filteredBodies.find(b => b.name === bodyName);
            showDetailModal(body);
        });
    });
    
    // Render map view results
    renderMapResults();
}

// Render map results in the sidebar
function renderMapResults() {
    if (filteredBodies.length === 0) {
        mapResultsList.innerHTML = `
            <div class="no-results">
                <p>No legal bodies match your filters. Try adjusting your search criteria.</p>
                <button id="clear-map-filters-button" class="button primary">Clear All Filters</button>
            </div>
        `;
        
        document.getElementById('clear-map-filters-button').addEventListener('click', clearAllFilters);
        return;
    }
    
    mapResultsList.innerHTML = filteredBodies.map(body => `
        <div class="map-card" data-id="${body.name}">
            <div class="map-card-title">${body.name}</div>
            <div class="map-card-type">${body.type}</div>
            <div class="map-card-state">${body.state}</div>
        </div>
    `).join('');
    
    // Add click event to map cards
    document.querySelectorAll('.map-card').forEach(card => {
        card.addEventListener('click', () => {
            const bodyName = card.getAttribute('data-id');
            const body = filteredBodies.find(b => b.name === bodyName);
            
            // Find the marker for this body and open its popup
            const marker = markers.find(m => m.bodyName === body.name);
            if (marker && marker.leafletMarker) {
                marker.leafletMarker.openPopup();
                
                // Center the map on this marker
                fullScreenMap.setView(marker.leafletMarker.getLatLng(), 15);
            }
            
            // Highlight the selected card
            document.querySelectorAll('.map-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });
    });
}

// Get shorter jurisdiction name for badges
function getJurisdictionShortName(jurisdiction) {
    if (!jurisdiction) return '';
    
    // If jurisdiction is less than 15 characters, return as is
    if (jurisdiction.length <= 15) {
        return jurisdiction;
    }
    
    // Otherwise, truncate and add ellipsis
    return jurisdiction.substring(0, 12) + '...';
}

// Filter by tag
function filterByTag(tagType, tagValue) {
    // Clear other filters
    clearAllFilters();
    
    // Set the appropriate filter
    if (tagType === 'caseType') {
        activeFilters.caseTypes = [tagValue];
        activeTagFilter = { type: 'caseType', value: tagValue };
    } else if (tagType === 'documentType') {
        activeFilters.documentTypes = [tagValue];
        activeTagFilter = { type: 'documentType', value: tagValue };
    }
    
    // Apply filters
    applyFilters();
    
    // Close the modal
    closeDetailModal();
}

// Clear tag filter
function clearTagFilter() {
    if (activeTagFilter) {
        if (activeTagFilter.type === 'caseType') {
            activeFilters.caseTypes = [];
        } else if (activeTagFilter.type === 'documentType') {
            activeFilters.documentTypes = [];
        }
        
        activeTagFilter = null;
        applyFilters();
    }
}

// Get coordinates for a location using Nominatim (OpenStreetMap's geocoding service)
async function getCoordinates(location, state) {
    try {
        if (!location || !state) {
            console.log('Missing location or state data:', { location, state });
            return null;
        }
        
        // Combine location and state for better accuracy
        const searchQuery = `${location}, ${state}, India`;
        console.log('Geocoding search query:', searchQuery);
        
        // Encode the search query
        const encodedQuery = encodeURIComponent(searchQuery);
        
        // Use Nominatim API to geocode the address
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1`);
        
        if (!response.ok) {
            console.error('Nominatim API error:', response.status, response.statusText);
            throw new Error(`Failed to geocode location: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Geocoding response:', data);
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        } else {
            console.log('Location not found, trying fallback with state only');
            // If specific location not found, try with just state and India
            const fallbackQuery = encodeURIComponent(`${state}, India`);
            const fallbackResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${fallbackQuery}&limit=1`);
            
            if (!fallbackResponse.ok) {
                console.error('Fallback geocoding error:', fallbackResponse.status, fallbackResponse.statusText);
                throw new Error('Failed to geocode location');
            }
            
            const fallbackData = await fallbackResponse.json();
            console.log('Fallback geocoding response:', fallbackData);
            
            if (fallbackData && fallbackData.length > 0) {
                return {
                    lat: parseFloat(fallbackData[0].lat),
                    lon: parseFloat(fallbackData[0].lon)
                };
            } else {
                // Last resort: use default coordinates for India
                console.log('Using default India coordinates');
                return {
                    lat: 20.5937,
                    lon: 78.9629
                };
            }
        }
    } catch (error) {
        console.error('Error geocoding location:', error);
        // Return default India coordinates as fallback
        return {
            lat: 20.5937,
            lon: 78.9629
        };
    }
}

// Initialize map
function initializeMap(mapId, coordinates) {
    try {
        // Check if the map element exists
        const mapElement = document.getElementById(mapId);
        if (!mapElement) {
            console.error(`Map element with ID ${mapId} not found`);
            return null;
        }
        
        console.log(`Initializing map with ID ${mapId} at coordinates:`, coordinates);
        
        // If there's already a map, destroy it
        if (currentMap) {
            console.log('Removing existing map instance');
            currentMap.remove();
            currentMap = null;
        }
        
        // Create a new map
        const map = L.map(mapId).setView([coordinates.lat, coordinates.lon], 15);
        
        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Add a marker
        L.marker([coordinates.lat, coordinates.lon]).addTo(map);
        
        // Store the map instance
        currentMap = map;
        console.log('Map initialized successfully');
        
        return map;
    } catch (error) {
        console.error('Error initializing map:', error);
        return null;
    }
}

// Initialize full-screen map
function initializeFullScreenMap() {
    if (!fullScreenMap) {
        fullScreenMap = L.map(fullMap).setView([20.5937, 78.9629], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(fullScreenMap);
        
        // Update markers immediately
        updateMapMarkers();
    }
}

// Update map markers based on filtered bodies
function updateMapMarkers() {
    // Clear existing markers
    markers.forEach(marker => {
        if (marker.leafletMarker) {
            marker.leafletMarker.remove();
        }
    });
    markers = [];
    
    // Add new markers for each filtered body
    filteredBodies.forEach(async (body) => {
        try {
            const coordinates = await getCoordinates(body.location, body.state);
            if (coordinates) {
                const marker = L.marker([coordinates.lat, coordinates.lon]).addTo(fullScreenMap);
                
                // Create simplified popup content without hover button
                const popupContent = `
                    <div class="map-marker-popup">
                        <div class="map-marker-popup-title">${body.name}</div>
                        <div class="map-marker-popup-type">${body.type}</div>
                        <div class="map-marker-popup-location">${body.location}</div>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                
                // Store marker reference
                markers.push({
                    bodyName: body.name,
                    leafletMarker: marker,
                    coordinates: coordinates
                });
            }
        } catch (error) {
            console.error(`Error creating marker for ${body.name}:`, error);
        }
    });
}

// Show detail modal
function showDetailModal(body) {
    modalTitle.textContent = body.name;
    
    // Format case types as tags if available
    let caseTypesHtml = '';
    if (body.caseTypes && body.caseTypes.length > 0) {
        caseTypesHtml = `
            <div class="detail-section">
                <h3>Case Types</h3>
                <div class="detail-tag-container">
                    ${body.caseTypes.map(caseType => 
                        `<span class="detail-tag" data-type="caseType" data-value="${caseType}">${caseType}</span>`
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    // Format document types as tags if available
    let documentTypesHtml = '';
    if (body.documentTypes && body.documentTypes.length > 0) {
        documentTypesHtml = `
            <div class="detail-section">
                <h3>Document Types</h3>
                <div class="detail-tag-container">
                    ${body.documentTypes.map(docType => 
                        `<span class="detail-tag" data-type="documentType" data-value="${docType}">${docType}</span>`
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    // Website section
    let websiteHtml = '';
    if (body.website) {
        websiteHtml = `
            <div class="detail-section">
                <h3>Website</h3>
                <p><a href="${body.website}" target="_blank">${body.website}</a></p>
            </div>
        `;
    }
    
    // Map section with clickable wrapper
    const mapId = `map-${Date.now()}`;
    const mapHtml = `
        <div class="detail-section">
            <h3>Location</h3>
            <p>${body.location}</p>
            <div class="map-wrapper" data-body-name="${body.name}">
                <div id="${mapId}" class="detail-map"></div>
            </div>
        </div>
    `;
    
    modalBody.innerHTML = `
        <div class="detail-section">
            <h3>Type</h3>
            <p>${body.type}</p>
        </div>
        <div class="detail-section">
            <h3>Description</h3>
            <p>${body.description}</p>
        </div>
        ${mapHtml}
        <div class="detail-section">
            <h3>State</h3>
            <p>${body.state}</p>
        </div>
        <div class="detail-section">
            <h3>Geographical Jurisdiction</h3>
            <p>${body.geographicalJurisdiction}</p>
        </div>
        ${caseTypesHtml}
        ${documentTypesHtml}
        ${websiteHtml}
    `;
    
    // Add click event listeners to tags
    document.querySelectorAll('.detail-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const tagType = tag.getAttribute('data-type');
            const tagValue = tag.getAttribute('data-value');
            filterByTag(tagType, tagValue);
        });
    });
    
    // Store the body data for later use
    const mapWrapper = document.querySelector('.map-wrapper');
    if (mapWrapper) {
        mapWrapper.setAttribute('data-body-location', body.location || '');
        mapWrapper.setAttribute('data-body-state', body.state || '');
        
        // Add click event to the map wrapper
        mapWrapper.addEventListener('click', async function() {
            const bodyName = this.getAttribute('data-body-name') || '';
            const bodyLocation = this.getAttribute('data-body-location') || '';
            const bodyState = this.getAttribute('data-body-state') || '';
            
            console.log('Clicked on map for:', bodyName, bodyLocation, bodyState);
            
            // Get coordinates before closing modal
            const coordinates = await getCoordinates(bodyLocation, bodyState);
            console.log('Got coordinates:', coordinates);
            
            // Close modal and switch to map view
            closeDetailModal();
            switchToMapView();
            
            if (coordinates) {
                // Give time for the map view to initialize
                setTimeout(() => {
                    // Refresh the map
                    if (fullScreenMap) {
                        fullScreenMap.invalidateSize();
                        
                        // Find the marker for this body
                        const marker = markers.find(m => m.bodyName === bodyName);
                        console.log('Found marker:', marker);
                        
                        if (marker && marker.leafletMarker) {
                            // Open popup and center map
                            marker.leafletMarker.openPopup();
                            fullScreenMap.setView([coordinates.lat, coordinates.lon], 15);
                            
                            // Highlight the corresponding card in the sidebar
                            const mapCard = document.querySelector(`.map-card[data-id="${bodyName}"]`);
                            if (mapCard) {
                                document.querySelectorAll('.map-card').forEach(c => c.classList.remove('active'));
                                mapCard.classList.add('active');
                                mapCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        } else {
                            console.log('Creating temporary marker at:', coordinates);
                            // If marker not found, just center the map on the coordinates
                            fullScreenMap.setView([coordinates.lat, coordinates.lon], 15);
                            
                            // Create a temporary marker
                            L.marker([coordinates.lat, coordinates.lon])
                                .addTo(fullScreenMap)
                                .bindPopup(`<div class="map-marker-popup"><div class="map-marker-popup-title">${bodyName}</div></div>`)
                                .openPopup();
                        }
                    } else {
                        console.error('Full screen map not initialized');
                    }
                }, 500);
            } else {
                console.error('Could not get coordinates for:', bodyName);
            }
        });
    }
    
    visitWebsiteBtn.href = body.website || '#';
    detailModal.classList.add('open');
    document.body.classList.add('modal-open');
    
    // Initialize map after modal is visible
    setTimeout(async () => {
        try {
            console.log('Getting coordinates for modal map:', body.location, body.state);
            const coordinates = await getCoordinates(body.location, body.state);
            
            if (coordinates) {
                console.log('Initializing modal map with coordinates:', coordinates);
                const map = initializeMap(mapId, coordinates);
                
                if (!map) {
                    throw new Error('Failed to initialize map');
                }
            } else {
                console.error('Could not get coordinates for modal map');
                document.getElementById(mapId).innerHTML = '<p class="map-error">Map location not available</p>';
            }
        } catch (error) {
            console.error('Error initializing modal map:', error);
            const mapElement = document.getElementById(mapId);
            if (mapElement) {
                mapElement.innerHTML = '<p class="map-error">Failed to load map</p>';
            }
        }
    }, 500);
}

// Close detail modal
function closeDetailModal() {
    detailModal.classList.remove('open');
    document.body.classList.remove('modal-open');
    
    // If there's a map, destroy it
    if (currentMap) {
        currentMap.remove();
        currentMap = null;
    }
}

// Clear all filters
function clearAllFilters() {
    // Clear search input
    searchInput.value = '';
    
    // Clear checkbox filters
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset active filters
    activeFilters = {
        types: [],
        states: [],
        search: '',
        caseTypes: [],
        documentTypes: []
    };
    
    // Clear active tag filter
    activeTagFilter = null;
    
    // Apply filters
    applyFilters();
}

// Switch to list view tab
function switchToListView() {
    mapTab.classList.remove('active');
    listTab.classList.add('active');
    mapViewContainer.classList.remove('active');
    listViewContainer.classList.add('active');
}

// Switch to map view tab
function switchToMapView() {
    listTab.classList.remove('active');
    mapTab.classList.add('active');
    listViewContainer.classList.remove('active');
    mapViewContainer.classList.add('active');
    
    // Initialize map if it doesn't exist
    if (!fullScreenMap) {
        initializeFullScreenMap();
    } else {
        // If map exists, just refresh it
        fullScreenMap.invalidateSize();
        updateMapMarkers();
    }
}

// Add debounce function to prevent rapid firing of events
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Set up event listeners
function setupEventListeners() {
    // Search input with shorter debounce
    searchInput.addEventListener('input', debounce(() => {
        activeFilters.search = searchInput.value.trim().toLowerCase();
        applyFilters();
    }, 100));
    
    // Clear search
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        activeFilters.search = '';
        applyFilters();
    });
    
    // View options
    gridViewBtn.addEventListener('click', () => {
        resultsContainer.classList.remove('list-view');
        resultsContainer.classList.add('grid-view');
        listViewBtn.classList.remove('active');
        gridViewBtn.classList.add('active');
    });
    
    listViewBtn.addEventListener('click', () => {
        resultsContainer.classList.remove('grid-view');
        resultsContainer.classList.add('list-view');
        gridViewBtn.classList.remove('active');
        listViewBtn.classList.add('active');
    });
    
    // Modal close
    closeModalBtn.addEventListener('click', closeDetailModal);
    closeModalButtonBtn.addEventListener('click', closeDetailModal);
    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) {
            closeDetailModal();
        }
    });
    
    // Tab switching
    listTab.addEventListener('click', switchToListView);
    mapTab.addEventListener('click', switchToMapView);
    
    // Keyboard support for modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && detailModal.classList.contains('open')) {
            closeDetailModal();
        }
    });
}

// Load data when the page loads
document.addEventListener('DOMContentLoaded', loadLegalBodies);
