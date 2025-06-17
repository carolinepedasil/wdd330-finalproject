export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.currentParams = {};
  }

  addRoute(name, handler) {
    this.routes.set(name, handler);
  }

  navigate(routeName, params = {}) {
    if (!this.routes.has(routeName)) {
      console.error(`Route '${routeName}' not found`);
      return;
    }

    this.currentRoute = routeName;
    this.currentParams = params;
    
    const hashParams = Object.keys(params).length > 0 
      ? '?' + new URLSearchParams(params).toString()
      : '';
    
    window.location.hash = `#${routeName}${hashParams}`;
    
    const handler = this.routes.get(routeName);
    handler(params);
  }

  start() {
    this.handleHashChange();
    
    window.addEventListener('hashchange', () => {
      this.handleHashChange();
    });
  }

  handleHashChange() {
    const hash = window.location.hash.slice(1);
    
    if (!hash) {
      this.navigate('home');
      return;
    }

    const [routeName, queryString] = hash.split('?');
    const params = {};
    
    if (queryString) {
      const urlParams = new URLSearchParams(queryString);
      for (const [key, value] of urlParams) {
        params[key] = value;
      }
    }

    if (this.routes.has(routeName)) {
      this.currentRoute = routeName;
      this.currentParams = params;
      
      const handler = this.routes.get(routeName);
      handler(params);
    } else {
      this.navigate('home');
    }
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  getCurrentParams() {
    return { ...this.currentParams };
  }

  back() {
    window.history.back();
  }

  forward() {
    window.history.forward();
  }

  generateUrl(routeName, params = {}) {
    const hashParams = Object.keys(params).length > 0 
      ? '?' + new URLSearchParams(params).toString()
      : '';
    
    return `#${routeName}${hashParams}`;
  }
}