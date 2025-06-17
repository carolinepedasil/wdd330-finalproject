export class CountryService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000;
    this.firstApiUrl = 'https://api.first.org/data/v1/countries';
    this.restCountriesUrl = 'https://restcountries.com/v3.1';
    this.flagApiUrl = 'https://flagsapi.com';
  }

  async getAllCountries() {
    const key = 'allCountries';
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      console.log('Fetching all countries from API...');
      
      const initialResponse = await fetch(`${this.firstApiUrl}?limit=1`);
      if (!initialResponse.ok) {
        throw new Error(`API error: ${initialResponse.status}`);
      }
      
      const initialData = await initialResponse.json();
      const totalCountries = initialData.total;
      console.log(`Total countries available: ${totalCountries}`);
      
      const response = await fetch(`${this.firstApiUrl}?limit=${totalCountries}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw API response:', data);

      if (!data.data) {
        throw new Error('Invalid API response structure');
      }

      const countries = Object.entries(data.data).map(([code, countryData]) => ({
        cca2: code,
        cca3: code,
        name: {
          common: countryData.country,
          official: countryData.country
        },
        region: this.normalizeRegion(countryData.region),
        subregion: countryData.region,
        flags: {
          svg: `${this.flagApiUrl}/${code}/flat/64.png`,
          png: `${this.flagApiUrl}/${code}/flat/64.png`
        },
        population: null,
        area: null,
        capital: null,
        currencies: null,
        languages: null,
        latlng: null,
        timezones: null,
        idd: null,
        tld: null
      }));

      console.log(`Successfully processed ${countries.length} out of ${totalCountries} countries`);
      
      this.cache.set(key, { 
        data: countries, 
        timestamp: Date.now() 
      });

      return countries;
    } catch (error) {
      console.error('Error fetching countries:', error);
      
      try {
        console.log('Attempting fallback with pagination...');
        return await this.getAllCountriesWithPagination();
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        throw new Error('Failed to load countries from API');
      }
    }
  }

  async getAllCountriesWithPagination() {
    const allCountries = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      try {
        console.log(`Fetching countries with offset: ${offset}, limit: ${limit}`);
        const response = await fetch(`${this.firstApiUrl}?offset=${offset}&limit=${limit}`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.data || Object.keys(data.data).length === 0) {
          hasMore = false;
          break;
        }

        const countries = Object.entries(data.data).map(([code, countryData]) => ({
          cca2: code,
          cca3: code,
          name: {
            common: countryData.country,
            official: countryData.country
          },
          region: this.normalizeRegion(countryData.region),
          subregion: countryData.region,
          flags: {
            svg: `${this.flagApiUrl}/${code}/flat/64.png`,
            png: `${this.flagApiUrl}/${code}/flat/64.png`
          },
          population: null,
          area: null,
          capital: null,
          currencies: null,
          languages: null,
          latlng: null,
          timezones: null,
          idd: null,
          tld: null
        }));

        allCountries.push(...countries);
        
        const fetchedCount = Object.keys(data.data).length;
        if (fetchedCount < limit || allCountries.length >= data.total) {
          hasMore = false;
        } else {
          offset += limit;
        }

        console.log(`Fetched ${fetchedCount} countries, total so far: ${allCountries.length}`);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error fetching batch at offset ${offset}:`, error);
        hasMore = false;
      }
    }

    console.log(`Pagination complete. Total countries fetched: ${allCountries.length}`);
    
    this.cache.set('allCountries', { 
      data: allCountries, 
      timestamp: Date.now() 
    });

    return allCountries;
  }

  async getCountryByCode(code) {
    try {
      const countries = await this.getAllCountries();
      const basicCountry = countries.find(c => c.cca2 === code || c.cca3 === code);
      
      if (!basicCountry) {
        throw new Error('Country not found');
      }

      try {
        const detailedResponse = await fetch(`${this.restCountriesUrl}/alpha/${code}`);
        if (detailedResponse.ok) {
          const detailedData = await detailedResponse.json();
          if (detailedData && detailedData.length > 0) {
            const detailed = detailedData[0];
            
            return {
              ...basicCountry,
              name: {
                common: detailed.name?.common || basicCountry.name.common,
                official: detailed.name?.official || basicCountry.name.official
              },
              population: detailed.population || 0,
              area: detailed.area || 0,
              capital: detailed.capital || [],
              currencies: detailed.currencies || {},
              languages: detailed.languages || {},
              latlng: detailed.latlng || [0, 0],
              timezones: detailed.timezones || [],
              idd: detailed.idd || {},
              tld: detailed.tld || [],
              flags: {
                svg: detailed.flags?.svg || basicCountry.flags.svg,
                png: detailed.flags?.png || basicCountry.flags.png
              },
              coatOfArms: detailed.coatOfArms || {},
              borders: detailed.borders || [],
              gini: detailed.gini || {},
              fifa: detailed.fifa || '',
              car: detailed.car || {},
              continents: detailed.continents || [basicCountry.region]
            };
          }
        }
      } catch (detailError) {
        console.warn('Could not fetch detailed country data:', detailError);
      }

      return basicCountry;
    } catch (error) {
      console.error('Error getting country by code:', error);
      throw error;
    }
  }

  async searchCountries(query) {
    const countries = await this.getAllCountries();
    const searchTerm = query.toLowerCase();
    
    return countries.filter(country => 
      country.name.common.toLowerCase().includes(searchTerm) ||
      country.name.official.toLowerCase().includes(searchTerm) ||
      country.region.toLowerCase().includes(searchTerm) ||
      (country.subregion && country.subregion.toLowerCase().includes(searchTerm))
    );
  }

  async getCountriesByRegion(region) {
    const countries = await this.getAllCountries();
    
    if (region === 'all') {
      return countries;
    }
    
    return countries.filter(country => 
      country.region === region || 
      (country.subregion && country.subregion === region)
    );
  }

  async getDataStats() {
    const countries = await this.getAllCountries();
    const regionStats = {};
    
    countries.forEach(country => {
      const region = country.region;
      regionStats[region] = (regionStats[region] || 0) + 1;
    });

    return {
      totalCountries: countries.length,
      regions: regionStats,
      lastUpdated: new Date().toISOString(),
      apiSource: 'api.first.org'
    };
  }

  normalizeRegion(region) {
    const regionMap = {
      'Africa': 'Africa',
      'Asia': 'Asia',
      'Europe': 'Europe',
      'North America': 'Americas',
      'South America': 'Americas',
      'Central America': 'Americas',
      'Caribbean': 'Americas',
      'Oceania': 'Oceania',
      'Antarctica': 'Antarctica',
      'Antarctic': 'Antarctica'
    };

    return regionMap[region] || region;
  }

  async getCountryFlag(countryCode) {
    return {
      svg: `${this.flagApiUrl}/${countryCode}/flat/64.png`,
      png: `${this.flagApiUrl}/${countryCode}/flat/64.png`,
      large: `${this.flagApiUrl}/${countryCode}/flat/256.png`
    };
  }

  async getRegionalStats() {
    const countries = await this.getAllCountries();
    const stats = {};
    
    countries.forEach(country => {
      const region = country.region;
      if (!stats[region]) {
        stats[region] = {
          count: 0,
          countries: []
        };
      }
      stats[region].count++;
      stats[region].countries.push(country.name.common);
    });

    return stats;
  }

  clearCache() {
    this.cache.clear();
    console.log('Country service cache cleared');
  }

  setUseAPI(useAPI) {
    console.log(`API usage set to: ${useAPI}`);
  }
}