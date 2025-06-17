export class ValidationUtils {
  static validateCountryData(country) {
    const errors = [];

    if (!country) {
      errors.push('Country data is null or undefined');
      return errors;
    }

    if (!country.name || !country.name.common) {
      errors.push('Country name is missing');
    }

    return errors;
  }

  static validateSearchInput(input) {
    if (typeof input !== 'string') {
      return 'Search input must be a string';
    }

    if (input.length > 100) {
      return 'Search input is too long (max 100 characters)';
    }

    const dangerousChars = /<script|javascript:|data:/i;
    if (dangerousChars.test(input)) {
      return 'Search input contains invalid characters';
    }

    return null;
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/<[^>]*>/g, '')
      .replace(/[<>'"&]/g, '')
      .trim()
      .substring(0, 100);
  }

  static isValidCountryCode(code) {
    return typeof code === 'string' && 
           code.length >= 2 && code.length <= 3 && 
           /^[A-Z]{2,3}$/i.test(code);
  }

  static formatPopulation(population) {
    if (typeof population !== 'number' || population < 0) {
      return 'N/A';
    }

    if (population >= 1000000000) {
      return (population / 1000000000).toFixed(1) + 'B';
    } else if (population >= 1000000) {
      return (population / 1000000).toFixed(1) + 'M';
    } else if (population >= 1000) {
      return (population / 1000).toFixed(1) + 'K';
    }

    return population.toLocaleString();
  }

  static formatArea(area) {
    if (typeof area !== 'number' || area < 0) {
      return 'N/A';
    }

    return area.toLocaleString() + ' km²';
  }
}