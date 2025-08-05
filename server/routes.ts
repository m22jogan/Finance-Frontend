import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { 
  insertTransactionSchema, 
  insertBudgetSchema, 
  insertSavingsGoalSchema, 
  insertCategorySchema 
} from "@shared/schema";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const DEFAULT_USER_ID = "default-user";

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategoriesByUserId(DEFAULT_USER_ID);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID
      });
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  // Transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByUserId(DEFAULT_USER_ID);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID
      });
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  app.post("/api/transactions/bulk", async (req, res) => {
    try {
      const transactionsData = req.body.transactions.map((tx: any) => 
        insertTransactionSchema.parse({
          ...tx,
          userId: DEFAULT_USER_ID
        })
      );
      const transactions = await storage.createBulkTransactions(transactionsData);
      res.json({ transactions, count: transactions.length });
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  app.put("/api/transactions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const transaction = await storage.updateTransaction(id, updateData);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Failed to update transaction" });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTransaction(id);
      if (!deleted) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // CSV Upload
  app.post("/api/upload/csv", upload.single('csvFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV file must contain header and at least one data row" });
      }

      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
      const transactions = [];

      // Simple CSV parsing - expect columns: date, description, amount, type
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < 4) continue;

        const date = new Date(values[0].trim());
        const description = values[1].trim();
        const amount = parseFloat(values[2].trim());
        const type = values[3].trim().toLowerCase();

        if (isNaN(amount) || isNaN(date.getTime())) continue;

        // Auto-categorize based on description keywords
        let categoryId = "cat-4"; // Default to Shopping
        const desc = description.toLowerCase();
        if (desc.includes('restaurant') || desc.includes('food') || desc.includes('starbucks')) {
          categoryId = "cat-1"; // Food & Dining
        } else if (desc.includes('gas') || desc.includes('uber') || desc.includes('transport')) {
          categoryId = "cat-2"; // Transportation
        } else if (desc.includes('movie') || desc.includes('entertainment') || desc.includes('netflix')) {
          categoryId = "cat-3"; // Entertainment
        } else if (type === 'income' || amount > 0 && desc.includes('salary')) {
          categoryId = "cat-5"; // Income
        }

        transactions.push({
          description,
          amount: Math.abs(amount).toString(),
          date,
          type: type === 'income' || amount > 0 ? 'income' : 'expense',
          categoryId,
          userId: DEFAULT_USER_ID
        });
      }

      const savedTransactions = await storage.createBulkTransactions(transactions);
      res.json({ 
        message: "CSV uploaded successfully", 
        transactions: savedTransactions,
        count: savedTransactions.length 
      });

    } catch (error) {
      console.error('CSV upload error:', error);
      res.status(500).json({ message: "Failed to process CSV file" });
    }
  });

  // Budgets
  app.get("/api/budgets", async (req, res) => {
    try {
      const budgets = await storage.getBudgetsByUserId(DEFAULT_USER_ID);
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  app.post("/api/budgets", async (req, res) => {
    try {
      const budgetData = insertBudgetSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID
      });
      const budget = await storage.createBudget(budgetData);
      res.json(budget);
    } catch (error) {
      res.status(400).json({ message: "Invalid budget data" });
    }
  });

  app.put("/api/budgets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const budget = await storage.updateBudget(id, updateData);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      res.json(budget);
    } catch (error) {
      res.status(400).json({ message: "Failed to update budget" });
    }
  });

  app.delete("/api/budgets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteBudget(id);
      if (!deleted) {
        return res.status(404).json({ message: "Budget not found" });
      }
      res.json({ message: "Budget deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete budget" });
    }
  });

  // Savings Goals
  app.get("/api/savings-goals", async (req, res) => {
    try {
      const goals = await storage.getSavingsGoalsByUserId(DEFAULT_USER_ID);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch savings goals" });
    }
  });

  app.post("/api/savings-goals", async (req, res) => {
    try {
      const goalData = insertSavingsGoalSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID
      });
      const goal = await storage.createSavingsGoal(goalData);
      res.json(goal);
    } catch (error) {
      res.status(400).json({ message: "Invalid savings goal data" });
    }
  });

  app.put("/api/savings-goals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const goal = await storage.updateSavingsGoal(id, updateData);
      if (!goal) {
        return res.status(404).json({ message: "Savings goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(400).json({ message: "Failed to update savings goal" });
    }
  });

  app.delete("/api/savings-goals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSavingsGoal(id);
      if (!deleted) {
        return res.status(404).json({ message: "Savings goal not found" });
      }
      res.json({ message: "Savings goal deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete savings goal" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/summary", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByUserId(DEFAULT_USER_ID);
      const budgets = await storage.getBudgetsByUserId(DEFAULT_USER_ID);
      const goals = await storage.getSavingsGoalsByUserId(DEFAULT_USER_ID);

      // Calculate totals
      const totalIncome = transactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

      const totalExpenses = transactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

      const totalBalance = totalIncome - totalExpenses;

      // Calculate monthly spending (current month)
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyExpenses = transactions
        .filter(tx => tx.type === 'expense' && new Date(tx.date) >= monthStart)
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

      // Calculate savings progress
      const totalTargetSavings = goals.reduce((sum, goal) => sum + parseFloat(goal.targetAmount || "0"), 0);
      const totalCurrentSavings = goals.reduce((sum, goal) => sum + parseFloat(goal.currentAmount || "0"), 0);
      const savingsProgress = totalTargetSavings > 0 ? (totalCurrentSavings / totalTargetSavings) * 100 : 0;

      // Calculate budget remaining
      const totalBudget = budgets.reduce((sum, budget) => sum + parseFloat(budget.amount || "0"), 0);
      const totalBudgetSpent = budgets.reduce((sum, budget) => sum + parseFloat(budget.spent || "0"), 0);
      const budgetRemaining = totalBudget - totalBudgetSpent;

      res.json({
        totalBalance,
        monthlySpending: monthlyExpenses,
        savingsProgress: Math.round(savingsProgress),
        budgetRemaining
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics summary" });
    }
  });

  app.get("/api/analytics/spending-by-category", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByUserId(DEFAULT_USER_ID);
      const categories = await storage.getCategoriesByUserId(DEFAULT_USER_ID);

      const categorySpending = categories.map(category => {
        const spent = transactions
          .filter(tx => tx.type === 'expense' && tx.categoryId === category.id)
          .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
        
        return {
          id: category.id,
          name: category.name,
          amount: spent,
          color: category.color
        };
      }).filter(cat => cat.amount > 0);

      res.json(categorySpending);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch spending by category" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
