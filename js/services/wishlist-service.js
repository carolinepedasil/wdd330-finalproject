export class WishlistService {
  constructor() {
    this.storageKey = 'world-explorer-wishlist';
    this.wishlist = this.loadWishlist();
  }

  loadWishlist() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading wishlist:', error);
      return [];
    }
  }

  saveWishlist() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.wishlist));
    } catch (error) {
      console.error('Error saving wishlist:', error);
    }
  }

  addToWishlist(country) {
    const countryId = country.cca2 || country.cca3;
    
    if (!this.isInWishlist(countryId)) {
      const countryData = {
        cca2: country.cca2,
        cca3: country.cca3,
        name: country.name,
        flags: country.flags,
        capital: country.capital,
        region: country.region,
        subregion: country.subregion,
        population: country.population,
        area: country.area,
        currencies: country.currencies,
        languages: country.languages,
        latlng: country.latlng,
        addedAt: new Date().toISOString()
      };
      
      this.wishlist.push(countryData);
      this.saveWishlist();
      return true;
    }
    return false;
  }

  removeFromWishlist(countryCode) {
    const index = this.wishlist.findIndex(country => 
      country.cca2 === countryCode || country.cca3 === countryCode
    );
    if (index !== -1) {
      this.wishlist.splice(index, 1);
      this.saveWishlist();
      return true;
    }
    return false;
  }

  isInWishlist(countryCode) {
    return this.wishlist.some(country => 
      country.cca2 === countryCode || country.cca3 === countryCode
    );
  }

  getWishlistCountries() {
    return [...this.wishlist].sort((a, b) => 
      new Date(b.addedAt) - new Date(a.addedAt)
    );
  }

  getWishlistCount() {
    return this.wishlist.length;
  }

  clearWishlist() {
    this.wishlist = [];
    this.saveWishlist();
  }

  exportWishlist() {
    const data = {
      exportDate: new Date().toISOString(),
      countries: this.wishlist
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `world-explorer-wishlist-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importWishlist(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          
          if (data.countries && Array.isArray(data.countries)) {
            data.countries.forEach(country => {
              const countryId = country.cca2 || country.cca3;
              if (!this.isInWishlist(countryId)) {
                this.wishlist.push(country);
              }
            });
            
            this.saveWishlist();
            resolve(data.countries.length);
          } else {
            reject(new Error('Invalid wishlist file format'));
          }
        } catch (error) {
          reject(new Error('Failed to parse wishlist file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  getWishlistStats() {
    const stats = {
      totalCountries: this.wishlist.length,
      regions: {},
      mostRecentlyAdded: null,
      oldestAdded: null
    };

    if (this.wishlist.length === 0) {
      return stats;
    }

    this.wishlist.forEach(country => {
      const region = country.region || 'Unknown';
      stats.regions[region] = (stats.regions[region] || 0) + 1;
    });

    const sorted = [...this.wishlist].sort((a, b) => 
      new Date(a.addedAt) - new Date(b.addedAt)
    );
    
    stats.oldestAdded = sorted[0];
    stats.mostRecentlyAdded = sorted[sorted.length - 1];

    return stats;
  }
}