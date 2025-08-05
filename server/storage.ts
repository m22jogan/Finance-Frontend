import { 
  type User, 
  type InsertUser, 
  type Category, 
  type InsertCategory,
  type Transaction, 
  type InsertTransaction,
  type Budget, 
  type InsertBudget,
  type SavingsGoal, 
  type InsertSavingsGoal,
  users,
  categories,
  transactions,
  budgets,
  savingsGoals
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

let db: any = null;
let isDbConnected = false;

// Try to initialize database connection
try {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('pooler.supabase.com')) {
    const sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql);
    isDbConnected = true;
    console.log("Database connection initialized successfully");
  }
} catch (error) {
  console.log("Database connection failed, using in-memory storage:", error);
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Categories
  getCategoriesByUserId(userId: string): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Transactions
  getTransactionsByUserId(userId: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;
  createBulkTransactions(transactions: InsertTransaction[]): Promise<Transaction[]>;

  // Budgets
  getBudgetsByUserId(userId: string): Promise<Budget[]>;
  getBudget(id: string): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: string, budget: Partial<Budget>): Promise<Budget | undefined>;
  deleteBudget(id: string): Promise<boolean>;

  // Savings Goals
  getSavingsGoalsByUserId(userId: string): Promise<SavingsGoal[]>;
  getSavingsGoal(id: string): Promise<SavingsGoal | undefined>;
  createSavingsGoal(goal: InsertSavingsGoal): Promise<SavingsGoal>;
  updateSavingsGoal(id: string, goal: Partial<SavingsGoal>): Promise<SavingsGoal | undefined>;
  deleteSavingsGoal(id: string): Promise<boolean>;
}

// Memory Storage for fallback
class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private categories: Map<string, Category> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private budgets: Map<string, Budget> = new Map();
  private savingsGoals: Map<string, SavingsGoal> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  initializeDefaultData() {
    // Create default user
    const defaultUser: User = {
      id: "default-user",
      username: "demo",
      email: "demo@example.com",
      password: "password",
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);

    // Create default categories
    const defaultCategories: Category[] = [
      { id: "cat-1", name: "Food & Dining", icon: "utensils", color: "#3B82F6", userId: defaultUser.id },
      { id: "cat-2", name: "Transportation", icon: "car", color: "#10B981", userId: defaultUser.id },
      { id: "cat-3", name: "Entertainment", icon: "gamepad", color: "#F59E0B", userId: defaultUser.id },
      { id: "cat-4", name: "Shopping", icon: "shopping-cart", color: "#EF4444", userId: defaultUser.id },
      { id: "cat-5", name: "Income", icon: "plus-circle", color: "#22C55E", userId: defaultUser.id },
    ];

    defaultCategories.forEach(cat => this.categories.set(cat.id, cat));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  // Categories
  async getCategoriesByUserId(userId: string): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(cat => cat.userId === userId);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: string, updateData: Partial<Category>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    const updated = { ...category, ...updateData };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Transactions
  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      createdAt: new Date(),
      date: new Date(insertTransaction.date),
      categoryId: insertTransaction.categoryId || null
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: string, updateData: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    const updated = { ...transaction, ...updateData };
    this.transactions.set(id, updated);
    return updated;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.transactions.delete(id);
  }

  async createBulkTransactions(insertTransactions: InsertTransaction[]): Promise<Transaction[]> {
    const transactions: Transaction[] = [];
    for (const insertTx of insertTransactions) {
      const transaction = await this.createTransaction(insertTx);
      transactions.push(transaction);
    }
    return transactions;
  }

  // Budgets
  async getBudgetsByUserId(userId: string): Promise<Budget[]> {
    return Array.from(this.budgets.values()).filter(budget => budget.userId === userId);
  }

  async getBudget(id: string): Promise<Budget | undefined> {
    return this.budgets.get(id);
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const id = randomUUID();
    const budget: Budget = { 
      ...insertBudget, 
      id, 
      spent: "0",
      createdAt: new Date(),
      startDate: new Date(insertBudget.startDate),
      endDate: new Date(insertBudget.endDate),
      categoryId: insertBudget.categoryId || null
    };
    this.budgets.set(id, budget);
    return budget;
  }

  async updateBudget(id: string, updateData: Partial<Budget>): Promise<Budget | undefined> {
    const budget = this.budgets.get(id);
    if (!budget) return undefined;
    const updated = { ...budget, ...updateData };
    this.budgets.set(id, updated);
    return updated;
  }

  async deleteBudget(id: string): Promise<boolean> {
    return this.budgets.delete(id);
  }

  // Savings Goals
  async getSavingsGoalsByUserId(userId: string): Promise<SavingsGoal[]> {
    return Array.from(this.savingsGoals.values()).filter(goal => goal.userId === userId);
  }

  async getSavingsGoal(id: string): Promise<SavingsGoal | undefined> {
    return this.savingsGoals.get(id);
  }

  async createSavingsGoal(insertGoal: InsertSavingsGoal): Promise<SavingsGoal> {
    const id = randomUUID();
    const goal: SavingsGoal = { 
      ...insertGoal, 
      id, 
      currentAmount: "0",
      createdAt: new Date(),
      targetDate: insertGoal.targetDate ? new Date(insertGoal.targetDate) : null
    };
    this.savingsGoals.set(id, goal);
    return goal;
  }

  async updateSavingsGoal(id: string, updateData: Partial<SavingsGoal>): Promise<SavingsGoal | undefined> {
    const goal = this.savingsGoals.get(id);
    if (!goal) return undefined;
    const updated = { ...goal, ...updateData };
    this.savingsGoals.set(id, updated);
    return updated;
  }

  async deleteSavingsGoal(id: string): Promise<boolean> {
    return this.savingsGoals.delete(id);
  }
}

export class DrizzleStorage implements IStorage {
  async initializeDefaultData() {
    // Skip initialization since we've already set up data via SQL
    console.log("Database already initialized with default data");
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    if (!isDbConnected) throw new Error("Database not connected");
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!isDbConnected) throw new Error("Database not connected");
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!isDbConnected) throw new Error("Database not connected");
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!isDbConnected) throw new Error("Database not connected");
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Categories
  async getCategoriesByUserId(userId: string): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.userId, userId));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return result[0];
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(id: string, updateData: Partial<Category>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(updateData).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  // Transactions
  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return result[0];
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }

  async updateTransaction(id: string, updateData: Partial<Transaction>): Promise<Transaction | undefined> {
    const [updated] = await db.update(transactions).set(updateData).where(eq(transactions.id, id)).returning();
    return updated;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id)).returning();
    return result.length > 0;
  }

  async createBulkTransactions(insertTransactions: InsertTransaction[]): Promise<Transaction[]> {
    const result = await db.insert(transactions).values(insertTransactions).returning();
    return result;
  }

  // Budgets
  async getBudgetsByUserId(userId: string): Promise<Budget[]> {
    return await db.select().from(budgets).where(eq(budgets.userId, userId));
  }

  async getBudget(id: string): Promise<Budget | undefined> {
    const result = await db.select().from(budgets).where(eq(budgets.id, id)).limit(1);
    return result[0];
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const [budget] = await db.insert(budgets).values(insertBudget).returning();
    return budget;
  }

  async updateBudget(id: string, updateData: Partial<Budget>): Promise<Budget | undefined> {
    const [updated] = await db.update(budgets).set(updateData).where(eq(budgets.id, id)).returning();
    return updated;
  }

  async deleteBudget(id: string): Promise<boolean> {
    const result = await db.delete(budgets).where(eq(budgets.id, id)).returning();
    return result.length > 0;
  }

  // Savings Goals
  async getSavingsGoalsByUserId(userId: string): Promise<SavingsGoal[]> {
    return await db.select().from(savingsGoals).where(eq(savingsGoals.userId, userId));
  }

  async getSavingsGoal(id: string): Promise<SavingsGoal | undefined> {
    const result = await db.select().from(savingsGoals).where(eq(savingsGoals.id, id)).limit(1);
    return result[0];
  }

  async createSavingsGoal(insertGoal: InsertSavingsGoal): Promise<SavingsGoal> {
    const [goal] = await db.insert(savingsGoals).values(insertGoal).returning();
    return goal;
  }

  async updateSavingsGoal(id: string, updateData: Partial<SavingsGoal>): Promise<SavingsGoal | undefined> {
    const [updated] = await db.update(savingsGoals).set(updateData).where(eq(savingsGoals.id, id)).returning();
    return updated;
  }

  async deleteSavingsGoal(id: string): Promise<boolean> {
    const result = await db.delete(savingsGoals).where(eq(savingsGoals.id, id)).returning();
    return result.length > 0;
  }
}

// Choose storage implementation based on database connection
let storageInstance: IStorage;

if (isDbConnected) {
  storageInstance = new DrizzleStorage();
  // Initialize default data on startup
  (storageInstance as DrizzleStorage).initializeDefaultData();
  console.log("Using Supabase database storage");
} else {
  storageInstance = new MemStorage();
  console.log("Using in-memory storage (database connection failed)");
}

export const storage = storageInstance;
