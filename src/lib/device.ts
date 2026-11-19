/**
 * Apps on Maria's home grid, kept on the device. In the managed Android version
 * this list comes from the device policy; here it lives in local storage.
 */
const KEY = "caramelo.installedApps";
const PREINSTALLED = ["com.whatsapp", "com.google.android.apps.photos"];

export function installedApps(): string[] {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? (JSON.parse(saved) as string[]) : PREINSTALLED;
  } catch {
    return PREINSTALLED;
  }
}

export function markInstalled(id: string): void {
  const apps = installedApps();
  if (apps.includes(id)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify([...apps, id]));
  } catch {
    // Storage blocked: the app shows up again after the next install.
  }
}
