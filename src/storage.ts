// 안전한 storage wrapper (메모리 폴백)
export const safeStorage = {
  data: {} as Record<string, string>,

  async get(key: string): Promise<{ value: string } | null> {
    try {
      if (typeof window !== "undefined" && (window as any).storage) {
        return await (window as any).storage.get(key, false);
      }
      return this.data[key] ? { value: this.data[key] } : null;
    } catch {
      return this.data[key] ? { value: this.data[key] } : null;
    }
  },

  async set(key: string, value: string): Promise<boolean> {
    try {
      if (typeof window !== "undefined" && (window as any).storage) {
        await (window as any).storage.set(key, value, false);
        return true;
      }
      this.data[key] = value;
      return true;
    } catch {
      this.data[key] = value;
      return true;
    }
  },
};
