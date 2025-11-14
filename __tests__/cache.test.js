/**
 * Cache System Tests
 */

const cache = require('../src/utils/cache');

describe('Cache System', () => {
  beforeEach(async () => {
    // Clear cache before each test
    await cache.flush();
  });

  describe('Basic Operations', () => {
    it('should set and get string value', async () => {
      await cache.set('test-key', 'test-value', 60);
      const value = await cache.get('test-key');
      expect(value).toBe('test-value');
    });

    it('should set and get object value', async () => {
      const testObject = { name: 'Test', age: 30 };
      await cache.set('test-object', testObject, 60);
      const value = await cache.get('test-object');
      expect(value).toEqual(testObject);
    });

    it('should return null for non-existent key', async () => {
      const value = await cache.get('non-existent');
      expect(value).toBeNull();
    });

    it('should delete cached value', async () => {
      await cache.set('test-key', 'test-value', 60);
      await cache.del('test-key');
      const value = await cache.get('test-key');
      expect(value).toBeNull();
    });
  });

  describe('Expiration', () => {
    it('should respect TTL', async () => {
      await cache.set('expires-key', 'expires-value', 1); // 1 second

      // Should exist immediately
      let value = await cache.get('expires-key');
      expect(value).toBe('expires-value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Should be expired
      value = await cache.get('expires-key');
      expect(value).toBeNull();
    });
  });

  describe('Exists', () => {
    it('should check if key exists', async () => {
      await cache.set('exists-key', 'value', 60);

      const exists = await cache.exists('exists-key');
      expect(exists).toBe(true);

      const notExists = await cache.exists('not-exists-key');
      expect(notExists).toBe(false);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      await cache.set('cached-key', 'cached-value', 60);

      let fetchCalled = false;
      const value = await cache.getOrSet('cached-key', async () => {
        fetchCalled = true;
        return 'fetched-value';
      }, 60);

      expect(value).toBe('cached-value');
      expect(fetchCalled).toBe(false);
    });

    it('should fetch and cache if not exists', async () => {
      let fetchCalled = false;
      const value = await cache.getOrSet('new-key', async () => {
        fetchCalled = true;
        return 'fetched-value';
      }, 60);

      expect(value).toBe('fetched-value');
      expect(fetchCalled).toBe(true);

      // Verify it was cached
      const cachedValue = await cache.get('new-key');
      expect(cachedValue).toBe('fetched-value');
    });

    it('should handle async fetch functions', async () => {
      const value = await cache.getOrSet('async-key', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: 'async-data' };
      }, 60);

      expect(value).toEqual({ data: 'async-data' });
    });
  });

  describe('Flush', () => {
    it('should clear all cached values', async () => {
      await cache.set('key1', 'value1', 60);
      await cache.set('key2', 'value2', 60);
      await cache.set('key3', 'value3', 60);

      await cache.flush();

      const value1 = await cache.get('key1');
      const value2 = await cache.get('key2');
      const value3 = await cache.get('key3');

      expect(value1).toBeNull();
      expect(value2).toBeNull();
      expect(value3).toBeNull();
    });
  });

  describe('Complex Values', () => {
    it('should cache arrays', async () => {
      const array = [1, 2, 3, 4, 5];
      await cache.set('array-key', array, 60);
      const value = await cache.get('array-key');
      expect(value).toEqual(array);
    });

    it('should cache nested objects', async () => {
      const nested = {
        user: {
          name: 'Test',
          profile: {
            age: 30,
            settings: {
              theme: 'dark'
            }
          }
        }
      };
      await cache.set('nested-key', nested, 60);
      const value = await cache.get('nested-key');
      expect(value).toEqual(nested);
    });
  });

  afterAll(async () => {
    await cache.flush();
  });
});
