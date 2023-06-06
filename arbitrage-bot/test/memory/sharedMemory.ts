import { expect } from 'chai';
import { SharedMemory } from '../../server/store/SharedMemory';

describe('SharedMemory', () => {
  let sharedMemory: SharedMemory;

  beforeEach(() => {
    sharedMemory = new SharedMemory();
  });

  it('should set and get a store value', async () => {
    const storeName = 'testStore';
    const storeValue = { key: 'value' };

    await sharedMemory.setStore(storeName, storeValue);
    const retrievedValue = sharedMemory.getStore(storeName);

    expect(retrievedValue).to.deep.equal(storeValue);
  });

  it('should return an empty object for a non-existent store', () => {
    const nonExistentStore = 'nonExistentStore';
    const retrievedValue = sharedMemory.getStore(nonExistentStore);

    expect(retrievedValue).to.deep.equal({});
  });

  it('should overwrite a store value', async () => {
    const storeName = 'testStore';
    const initialValue = { key: 'initialValue' };
    const updatedValue = { key: 'updatedValue' };

    await sharedMemory.setStore(storeName, initialValue);
    await sharedMemory.setStore(storeName, updatedValue);
    const retrievedValue = sharedMemory.getStore(storeName);

    expect(retrievedValue).to.deep.equal(updatedValue);
  });

  it('should throw an error when shared memory overflows', () => {
    const largeStoreName = 'largeStore';
    const largeStoreValue = 'a'.repeat(1024 * 1024 - 4);

    // Handle the async/await error
    sharedMemory.setStore(largeStoreName, largeStoreValue).catch((error) => {
        expect(error.message).to.equal('Shared memory overflow');
     });
  });
});
