export class StorageUtils {
  static setItem(key, value) {
    try {
      const serializedValue = JSON.stringify({
        value,
        timestamp: Date.now()
      });
      localStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      console.error('Error saving to storage:', error);
      return false;
    }
  }

  static getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      
      if (!item) {
        return defaultValue;
      }

      const parsed = JSON.parse(item);
      return parsed.value;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return defaultValue;
    }
  }

  static getUserPreferences() {
    return this.getItem('user-preferences', {
      theme: 'light',
      region: 'all'
    });
  }

  static setUserPreferences(preferences) {
    const current = this.getUserPreferences();
    const updated = { ...current, ...preferences };
    return this.setItem('user-preferences', updated);
  }

  static addToSearchHistory(query, maxItems = 10) {
    if (!query || query.trim().length === 0) return;

    const history = this.getItem('search-history', []);
    
    const filtered = history.filter(item => item.query !== query.trim());
    
    filtered.unshift({
      query: query.trim(),
      timestamp: Date.now()
    });

    const trimmed = filtered.slice(0, maxItems);
    
    return this.setItem('search-history', trimmed);
  }

  static getSearchHistory() {
    return this.getItem('search-history', []);
  }
}