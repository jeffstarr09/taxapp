export async function isPrivateBrowsing(): Promise<boolean> {
  // Safari: storage quota is severely limited in private mode
  if ("storage" in navigator && "estimate" in navigator.storage) {
    try {
      const { quota } = await navigator.storage.estimate();
      // Safari private mode typically reports ~100MB quota vs ~1GB+ normal
      if (quota !== undefined && quota < 200 * 1024 * 1024) {
        return true;
      }
    } catch {
      // estimate() can throw in some private contexts
      return true;
    }
  }

  // IndexedDB test: some browsers block or limit it in private mode
  try {
    const testDb = indexedDB.open("__drop_private_test__");
    await new Promise<void>((resolve, reject) => {
      testDb.onerror = () => reject();
      testDb.onsuccess = () => {
        testDb.result.close();
        indexedDB.deleteDatabase("__drop_private_test__");
        resolve();
      };
    });
  } catch {
    return true;
  }

  return false;
}
