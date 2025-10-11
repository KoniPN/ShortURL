import type {
  Database,
  UrlData,
  CreateUrlInput,
  AnalyticsData,
  User,
} from "./types.js";

// In-Memory Databases
const urlDatabase = new Map<string, UrlData>();
const userDatabase = new Map<string, User>(); // userId -> User

const database: Database = {
  async createUrl(urlData: CreateUrlInput): Promise<UrlData> {
    const item: UrlData = {
      ...urlData,
      clicks: 0,
      createdAt: new Date().toISOString(),
    };
    urlDatabase.set(urlData.shortCode, item);
    return item;
  },

  async getUrl(shortCode: string): Promise<UrlData | null> {
    return urlDatabase.get(shortCode) || null;
  },

  async getAllUrls(): Promise<UrlData[]> {
    return Array.from(urlDatabase.values());
  },

  async incrementClicks(shortCode: string): Promise<UrlData | null> {
    const url = urlDatabase.get(shortCode);
    if (url) {
      url.clicks++;
      return url;
    }
    return null;
  },

  async deleteUrl(shortCode: string): Promise<boolean> {
    return urlDatabase.delete(shortCode);
  },

  async exists(shortCode: string): Promise<boolean> {
    return urlDatabase.has(shortCode);
  },

  async getAnalytics(shortCode: string): Promise<AnalyticsData> {
    const url = urlDatabase.get(shortCode);
    if (!url) {
      return { url: null, clicks: 0 };
    }
    return {
      url: url,
      clicks: url.clicks,
      createdAt: url.createdAt,
    };
  },

  async getUserUrls(userId: string): Promise<UrlData[]> {
    return Array.from(urlDatabase.values()).filter(
      (url) => url.userId === userId
    );
  },

  // User operations
  async createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
    const id = `user_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const user: User = {
      id,
      ...userData,
      createdAt: new Date().toISOString(),
    };
    userDatabase.set(id, user);
    return user;
  },

  async findUserByEmail(email: string): Promise<User | null> {
    for (const user of userDatabase.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  },

  async findUserById(userId: string): Promise<User | null> {
    return userDatabase.get(userId) || null;
  },
};

export default database;
