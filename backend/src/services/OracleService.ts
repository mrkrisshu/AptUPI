import axios from 'axios';

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}

export class OracleService {
  private cache: Map<string, { rate: number; timestamp: Date }> = new Map();
  private cacheTimeout = 60000; // 1 minute cache

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    const cacheKey = `${fromCurrency}-${toCurrency}`;
    const cached = this.cache.get(cacheKey);
    
    // Return cached rate if still valid
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheTimeout) {
      return cached.rate;
    }

    try {
      let rate: number;
      
      if (fromCurrency === 'USDC' && toCurrency === 'INR') {
        rate = await this.getUSDCToINRRate();
      } else if (fromCurrency === 'INR' && toCurrency === 'USDC') {
        const usdcToInr = await this.getUSDCToINRRate();
        rate = 1 / usdcToInr;
      } else {
        throw new Error(`Unsupported currency pair: ${fromCurrency}/${toCurrency}`);
      }

      // Cache the rate
      this.cache.set(cacheKey, {
        rate,
        timestamp: new Date()
      });

      return rate;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      
      // Return cached rate if available, even if expired
      if (cached) {
        console.warn('Using expired cached rate due to API error');
        return cached.rate;
      }
      
      // Fallback rate for demo purposes
      console.warn('Using fallback exchange rate');
      return fromCurrency === 'USDC' && toCurrency === 'INR' ? 84.0 : 0.012;
    }
  }

  private async getUSDCToINRRate(): Promise<number> {
    try {
      // Using CoinGecko API for demo (free tier)
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price',
        {
          params: {
            ids: 'usd-coin',
            vs_currencies: 'inr'
          },
          timeout: 5000
        }
      );

      const rate = response.data['usd-coin']?.inr;
      
      if (!rate) {
        throw new Error('Invalid response from price API');
      }

      return rate;
    } catch (error) {
      console.error('Error fetching USDC/INR rate from CoinGecko:', error);
      
      // Try alternative API or fallback
      return this.getFallbackUSDCToINRRate();
    }
  }

  private async getFallbackUSDCToINRRate(): Promise<number> {
    try {
      // Alternative: Use USD/INR rate (since USDC ≈ 1 USD)
      const response = await axios.get(
        'https://api.exchangerate-api.com/v4/latest/USD',
        { timeout: 5000 }
      );

      const inrRate = response.data.rates?.INR;
      
      if (!inrRate) {
        throw new Error('Invalid response from exchange rate API');
      }

      return inrRate;
    } catch (error) {
      console.error('Error fetching fallback rate:', error);
      
      // Final fallback - approximate rate
      return 84.0; // Approximate USD/INR rate for demo
    }
  }

  async getMultipleRates(pairs: Array<{ from: string; to: string }>): Promise<ExchangeRate[]> {
    const rates = await Promise.all(
      pairs.map(async (pair) => {
        const rate = await this.getExchangeRate(pair.from, pair.to);
        return {
          from: pair.from,
          to: pair.to,
          rate,
          timestamp: new Date()
        };
      })
    );

    return rates;
  }

  convertAmount(amount: number, fromCurrency: string, toCurrency: string, rate: number): number {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    return amount * rate;
  }

  async convertAmountWithCurrentRate(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ convertedAmount: number; rate: number }> {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = this.convertAmount(amount, fromCurrency, toCurrency, rate);
    
    return {
      convertedAmount,
      rate
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}