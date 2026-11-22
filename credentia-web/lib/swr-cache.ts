/**
 * A small in memory cache for what the dashboards have already loaded. A page that was opened a moment ago
 * shows its last data at once while fresh data is fetched behind it, so moving between pages never starts from
 * an empty screen. It is emptied whenever a different person signs in or the person signs out.
 */
const store = new Map<string, unknown>()
let owner: string | null = null

export const cacheGet = <T>(key: string): T | undefined => store.get(key) as T | undefined
export const cacheSet = (key: string, value: unknown) => {
  store.set(key, value)
}
export const cacheClear = () => {
  store.clear()
  owner = null
}
/** Call with the signed in user. Data kept for another user is dropped. */
export const cacheClaim = (userId: string) => {
  if (owner && owner !== userId) store.clear()
  owner = userId
}
