import { CountryService } from './services/country-service.js';
import { WishlistService } from './services/wishlist-service.js';
import { ThemeService } from './services/theme-service.js';
import { Router } from './utils/router.js';
import { ValidationUtils } from './utils/validation.js';
import { DOMUtils } from './utils/dom-utils.js';
import { StorageUtils } from './utils/storage-utils.js';

class WorldExplorerApp {
  constructor() {
    this.countryService = new CountryService();
    this.wishlistService = new WishlistService();
    this.themeService = new ThemeService();
    this.router = new Router();
    
    this.countries = [];
    this.filteredCountries = [];
    this.currentCountry = null;
    
    this.state = {
      isLoading: false,
      currentView: 'home',
      searchQuery: '',
      selectedRegion: 'all'
    };
    
    this.init();
  }

  async init() {
    try {
      this.setState({ isLoading: true });
      
      await this.initializeServices();
      this.setupEventListeners();
      await this.loadCountries();
      this.setupRouter();
      this.initializeUI();
      
      console.log('World Explorer App initialized successfully');
      DOMUtils.showToast('Application loaded successfully!', 'success', 3000);
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showError('Failed to initialize application. Please refresh the page.');
    } finally {
      this.setState({ isLoading: false });
    }
  }

  async initializeServices() {
    this.themeService.watchSystemTheme();
    this.updateWishlistCount();
  }

  setupEventListeners() {
    const searchInput = document.getElementById('country-search');
    const debouncedSearch = DOMUtils.debounce((query) => {
      this.handleSearch(query);
    }, 300);

    DOMUtils.addEventListenerWithValidation(searchInput, 'input', (e) => {
      const query = ValidationUtils.sanitizeInput(e.target.value);
      this.setState({ searchQuery: query });
      debouncedSearch(query);
    });

    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      DOMUtils.addEventListenerWithValidation(btn, 'click', (e) => {
        this.handleRegionFilter(e.target, filterButtons);
      });
    });

    this.setupNavigationListeners();

    const themeToggle = document.getElementById('theme-toggle');
    DOMUtils.addEventListenerWithValidation(themeToggle, 'click', () => {
      this.themeService.toggle();
    });

    this.setupKeyboardShortcuts();
  }

  setupNavigationListeners() {
    const navButtons = [
      { id: 'wishlist-btn', action: () => this.router.navigate('wishlist') },
      { id: 'wishlist-back-btn', action: () => this.router.navigate('home') }
    ];

    navButtons.forEach(({ id, action }) => {
      const element = document.getElementById(id);
      if (element) {
        DOMUtils.addEventListenerWithValidation(element, 'click', action);
      }
    });
  }

  setupKeyboardShortcuts() {
    DOMUtils.addEventListenerWithValidation(document, 'keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('country-search').focus();
      }
      
      if (e.key === 'Escape') {
        const searchInput = document.getElementById('country-search');
        if (searchInput === document.activeElement && searchInput.value) {
          searchInput.value = '';
          this.handleSearch('');
        } else if (this.state.currentView !== 'home') {
          this.router.navigate('home');
        }
      }
    });
  }

  setupRouter() {
    this.router.addRoute('home', () => this.showHomePage());
    this.router.addRoute('details', (params) => this.showDetailsPage(params.country));
    this.router.addRoute('wishlist', () => this.showWishlistPage());
    
    this.router.start();
  }

  async loadCountries() {
    try {
      const loading = document.getElementById('loading');
      await DOMUtils.fadeIn(loading);
      
      this.countries = await this.countryService.getAllCountries();
      this.filteredCountries = [...this.countries];
      
      this.renderCountries();
      await DOMUtils.fadeOut(loading);
      
      DOMUtils.showToast(`Loaded ${this.countries.length} countries successfully`, 'success', 3000);
      
    } catch (error) {
      console.error('Error loading countries:', error);
      await DOMUtils.fadeOut(document.getElementById('loading'));
      this.showError('Failed to load countries from API. Please check your connection and try again.');
    }
  }

  handleSearch(query) {
    const validationError = ValidationUtils.validateSearchInput(query);
    if (validationError) {
      console.warn('Invalid search input:', validationError);
      return;
    }

    if (query.length >= 2) {
      StorageUtils.addToSearchHistory(query);
    }

    this.filterCountries(query);
  }

  filterCountries(searchTerm) {
    const term = searchTerm.toLowerCase();
    this.filteredCountries = this.countries.filter(country => {
      const matchesSearch = !term || 
        country.name.common.toLowerCase().includes(term) ||
        country.name.official.toLowerCase().includes(term) ||
        country.region.toLowerCase().includes(term) ||
        (country.subregion && country.subregion.toLowerCase().includes(term));

      const matchesRegion = this.state.selectedRegion === 'all' || 
        country.region === this.state.selectedRegion;

      return matchesSearch && matchesRegion;
    });

    this.renderCountries();
    
    if (term) {
      DOMUtils.showToast(`Found ${this.filteredCountries.length} countries matching "${term}"`, 'info', 2000);
    }
  }

  handleRegionFilter(clickedButton, allButtons) {
    allButtons.forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');

    const region = clickedButton.dataset.region;
    this.setState({ selectedRegion: region });
    this.filterByRegion(region);
  }

  filterByRegion(region) {
    this.setState({ selectedRegion: region });
    
    if (region === 'all') {
      this.filteredCountries = [...this.countries];
    } else {
      this.filteredCountries = this.countries.filter(country => 
        country.region === region || 
        (country.subregion && country.subregion === region)
      );
    }

    if (this.state.searchQuery) {
      this.filterCountries(this.state.searchQuery);
    } else {
      this.renderCountries();
    }

    const regionName = region === 'all' ? 'all regions' : region;
    DOMUtils.showToast(`Showing ${this.filteredCountries.length} countries in ${regionName}`, 'info', 2000);
  }

  renderCountries() {
    const grid = document.getElementById('countries-grid');
    
    if (this.filteredCountries.length === 0) {
      grid.innerHTML = this.renderEmptyState();
      return;
    }

    const cardsHTML = this.filteredCountries.map((country, index) => `
      <div class="country-card" 
           data-country="${country.cca2}"
           style="animation-delay: ${index * 0.05}s">
        <div class="country-flag-container">
          <img 
            src="${country.flags.svg || country.flags.png}" 
            alt="${country.name.common} flag"
            class="country-flag"
            loading="lazy"
            onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEzMyIgdmlld0JveD0iMCAwIDIwMCAxMzMiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTMzIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNjZMMTIwIDQ2SDE0MFY4Nkg4MFY0NkgxMDBWNjZaIiBmaWxsPSIjOUI5QkEzIi8+Cjwvc3ZnPgo='"
          />
        </div>
        <div class="country-info">
          <h3 class="country-name">${country.name.common}</h3>
          <p class="country-region">${country.region}${country.subregion && country.subregion !== country.region ? ` • ${country.subregion}` : ''}</p>
        </div>
      </div>
    `).join('');

    grid.innerHTML = cardsHTML;

    grid.querySelectorAll('.country-card').forEach(card => {
      DOMUtils.addEventListenerWithValidation(card, 'click', () => {
        const countryCode = card.dataset.country;
        if (ValidationUtils.isValidCountryCode(countryCode)) {
          this.router.navigate('details', { country: countryCode });
        }
      });
    });
  }

  renderEmptyState() {
    return `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 4rem 0; text-align: center;">
        <svg style="width: 4rem; height: 4rem; margin-bottom: 1rem; opacity: 0.5;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <h3>No countries found</h3>
        <p style="color: var(--text-secondary); margin-bottom: 1rem;">
          ${this.state.searchQuery ? 
            `No results for "${this.state.searchQuery}"` : 
            'Try adjusting your search or filter criteria'
          }
        </p>
        ${this.state.searchQuery ? 
          `<button class="btn btn-secondary" onclick="document.getElementById('country-search').value=''; window.app.handleSearch('')">
            Clear Search
          </button>` : ''
        }
      </div>
    `;
  }

  async showDetailsPage(countryCode) {
    if (!countryCode || !ValidationUtils.isValidCountryCode(countryCode)) {
      this.router.navigate('home');
      return;
    }

    try {
      this.setState({ isLoading: true, currentView: 'details' });
      
      this.currentCountry = await this.countryService.getCountryByCode(countryCode);
      this.renderCountryDetails();
      this.showPage('details-page');
      
      DOMUtils.scrollToElement(document.body);
      
    } catch (error) {
      console.error('Error loading country details:', error);
      this.showError('Failed to load country details.');
      this.router.navigate('home');
    } finally {
      this.setState({ isLoading: false });
    }
  }

  renderCountryDetails() {
    const container = document.getElementById('country-details');
    const country = this.currentCountry;
    const isInWishlist = this.wishlistService.isInWishlist(country.cca2);

    container.innerHTML = `
      <div class="details-header">
        <button id="back-btn" class="back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Countries
        </button>
        
        <button class="btn btn-secondary" id="toggle-wishlist-btn">
          <img src="./public/heart.png" alt="Heart" />
          ${isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        </button>
      </div>

      <div class="country-header">
        <img 
          src="${country.flags.svg || country.flags.png}" 
          alt="${country.name.common} flag"
          class="country-flag-large"
          onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEzMyIgdmlld0JveD0iMCAwIDIwMCAxMzMiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTMzIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNjZMMTIwIDQ2SDE0MFY4Nkg4MFY0NkgxMDBWNjZaIiBmaWxsPSIjOUI5QkEzIi8+Cjwvc3ZnPgo='"
        />
        <h2 class="country-title">${country.name.common}</h2>
        <p class="country-subtitle">${country.name.official}</p>
      </div>

      <div class="details-grid">
        <div class="detail-card">
          <h3>Basic Information</h3>
          <ul class="detail-list">
            <li>
              <span class="detail-label">Capital</span>
              <span class="detail-value">${country.capital?.[0] || 'N/A'}</span>
            </li>
            <li>
              <span class="detail-label">Region</span>
              <span class="detail-value">${country.region}</span>
            </li>
            <li>
              <span class="detail-label">Subregion</span>
              <span class="detail-value">${country.subregion || 'N/A'}</span>
            </li>
            <li>
              <span class="detail-label">Population</span>
              <span class="detail-value">${ValidationUtils.formatPopulation(country.population)}</span>
            </li>
            <li>
              <span class="detail-label">Area</span>
              <span class="detail-value">${ValidationUtils.formatArea(country.area)}</span>
            </li>
            <li>
              <span class="detail-label">Country Code</span>
              <span class="detail-value">${country.cca2}</span>
            </li>
          </ul>
        </div>

        <div class="detail-card">
          <h3>Cultural Information</h3>
          <ul class="detail-list">
            <li>
              <span class="detail-label">Languages</span>
              <span class="detail-value">${this.getLanguages(country.languages)}</span>
            </li>
            <li>
              <span class="detail-label">Currencies</span>
              <span class="detail-value">${this.getCurrencies(country.currencies)}</span>
            </li>
            <li>
              <span class="detail-label">Timezones</span>
              <span class="detail-value">${country.timezones?.slice(0, 2).join(', ') || 'N/A'}</span>
            </li>
            <li>
              <span class="detail-label">Calling Code</span>
              <span class="detail-value">+${country.idd?.root || ''}${country.idd?.suffixes?.[0] || ''}</span>
            </li>
            <li>
              <span class="detail-label">Internet TLD</span>
              <span class="detail-value">${country.tld?.[0] || 'N/A'}</span>
            </li>
          </ul>
        </div>
      </div>

      ${country.latlng && country.latlng[0] && country.latlng[1] ? `
        <div class="map-container">
          <iframe
            src="https://www.openstreetmap.org/export/embed.html?bbox=${country.latlng[1]-2},${country.latlng[0]-2},${country.latlng[1]+2},${country.latlng[0]+2}&layer=mapnik&marker=${country.latlng[0]},${country.latlng[1]}"
            title="Map of ${country.name.common}"
            loading="lazy"
          ></iframe>
        </div>
      ` : ''}
    `;

    this.setupCountryDetailsListeners(country);
  }

  setupCountryDetailsListeners(country) {
    const backBtn = document.getElementById('back-btn');
    DOMUtils.addEventListenerWithValidation(backBtn, 'click', () => {
      this.router.navigate('home');
    });

    const toggleWishlistBtn = document.getElementById('toggle-wishlist-btn');
    DOMUtils.addEventListenerWithValidation(toggleWishlistBtn, 'click', () => {
      this.toggleWishlist(country);
    });
  }

  showWishlistPage() {
    this.setState({ currentView: 'wishlist' });
    this.showPage('wishlist-page');
    this.renderWishlist();
  }

  renderWishlist() {
    const container = document.getElementById('wishlist-container');
    const wishlistCountries = this.wishlistService.getWishlistCountries();
    
    if (wishlistCountries.length === 0) {
      container.innerHTML = `
        <div class="wishlist-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <h3>Your wishlist is empty</h3>
          <p>Start exploring countries and add them to your wishlist!</p>
          <button class="btn btn-primary" onclick="window.app.router.navigate('home')">
            Explore Countries
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = wishlistCountries.map((country, index) => `
      <div class="country-card" data-country="${country.cca2}" style="animation-delay: ${index * 0.05}s">
        <div class="country-flag-container">
          <img 
            src="${country.flags.svg || country.flags.png}" 
            alt="${country.name.common} flag"
            class="country-flag"
            loading="lazy"
            onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEzMyIgdmlld0JveD0iMCAwIDIwMCAxMzMiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTMzIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNjZMMTIwIDQ2SDE0MFY4Nkg4MFY0NkgxMDBWNjZaIiBmaWxsPSIjOUI5QkEzIi8+Cjwvc3ZnPgo='"
          />
        </div>
        <div class="country-info">
          <h3 class="country-name">${country.name.common}</h3>
          <p class="country-region">${country.region}${country.subregion && country.subregion !== country.region ? ` • ${country.subregion}` : ''}</p>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.country-card').forEach(card => {
      DOMUtils.addEventListenerWithValidation(card, 'click', () => {
        const countryCode = card.dataset.country;
        if (ValidationUtils.isValidCountryCode(countryCode)) {
          this.router.navigate('details', { country: countryCode });
        }
      });
    });
  }

  toggleWishlist(country) {
    const wasInWishlist = this.wishlistService.isInWishlist(country.cca2);
    
    if (wasInWishlist) {
      this.wishlistService.removeFromWishlist(country.cca2);
      DOMUtils.showToast(`${country.name.common} removed from wishlist`, 'info');
    } else {
      this.wishlistService.addToWishlist(country);
      DOMUtils.showToast(`${country.name.common} added to wishlist`, 'success');
    }
    
    this.updateWishlistCount();
    this.renderCountryDetails();
  }

  updateWishlistCount() {
    const count = this.wishlistService.getWishlistCount();
    const countElement = document.getElementById('wishlist-count');
    if (countElement) {
      countElement.textContent = count;
    }
  }

  showHomePage() {
    this.setState({ currentView: 'home' });
    this.showPage('home-page');
  }

  showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
  }

  showError(message) {
    DOMUtils.showToast(message, 'error', 5000);
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
  }

  initializeUI() {
    this.updateWishlistCount();
  }

  getCurrencies(currencies) {
    if (!currencies) return 'N/A';
    return Object.values(currencies)
      .map(currency => `${currency.name} (${currency.symbol || ''})`)
      .join(', ');
  }

  getLanguages(languages) {
    if (!languages) return 'N/A';
    return Object.values(languages).join(', ');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new WorldExplorerApp();
});

window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  if (window.app) {
    window.app.showError('An unexpected error occurred. Please refresh the page.');
  }
});