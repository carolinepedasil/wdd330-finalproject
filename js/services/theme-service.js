export class ThemeService {
  constructor() {
    this.storageKey = 'world-explorer-theme';
    this.currentTheme = this.loadTheme();
    this.applyTheme();
  }

  loadTheme() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return stored;
      }
      
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      
      return 'light';
    } catch (error) {
      console.error('Error loading theme:', error);
      return 'light';
    }
  }

  saveTheme() {
    try {
      localStorage.setItem(this.storageKey, this.currentTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.content = this.currentTheme === 'dark' ? '#1A202C' : '#FAFAFA';
  }

  toggle() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme();
    this.saveTheme();
    
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: this.currentTheme }
    }));
  }

  setTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      this.currentTheme = theme;
      this.applyTheme();
      this.saveTheme();
      
      window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: this.currentTheme }
      }));
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  isDark() {
    return this.currentTheme === 'dark';
  }

  isLight() {
    return this.currentTheme === 'light';
  }

  watchSystemTheme() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      mediaQuery.addEventListener('change', (e) => {
        const hasManualPreference = localStorage.getItem(this.storageKey);
        if (!hasManualPreference) {
          this.currentTheme = e.matches ? 'dark' : 'light';
          this.applyTheme();
        }
      });
    }
  }
}