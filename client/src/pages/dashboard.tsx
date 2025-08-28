import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SummaryCards from "@/components/dashboard/summary-cards";
import SpendingChart from "@/components/dashboard/spending-chart";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import BudgetOverview from "@/components/dashboard/budget-overview";
import SavingsGoals from "@/components/dashboard/savings-goals";
import CsvUpload from "@/components/upload/csv-upload";
import { Skeleton } from "@/components/ui/skeleton";
import type { SummaryData, Transaction, Budget, SavingsGoal } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
}

// Helper function to categorize transactions
function calculateCategorySpendingFromTransactions(transactions: Transaction[]): CategorySpending[] {
  const categoryMap = new Map<string, number>();
  let totalSpending = 0;

  transactions.forEach(transaction => {
    // Only count expenses (negative amounts or positive amounts for expenses)
    const amount = Math.abs(transaction.amount);
    if (amount > 0) {
      const category = categorizeTransaction(transaction.description || transaction.merchant || 'Other');
      categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
      totalSpending += amount;
    }
  });

  const categorySpending: CategorySpending[] = [];
  categoryMap.forEach((amount, category) => {
    categorySpending.push({
      category,
      amount,
      percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0
    });
  });

  return categorySpending.sort((a, b) => b.amount - a.amount);
}

// Simple categorization logic based on merchant/description
function categorizeTransaction(description: string): string {
  const desc = description.toLowerCase();
  
  if (desc.includes('starbucks') || desc.includes('coffee') || desc.includes('restaurant') || 
      desc.includes('chick-fil-a') || desc.includes('mcdonald') || desc.includes('food')) {
    return 'Food & Dining';
  }
  
  if (desc.includes('hobby-lobby') || desc.includes('target') || desc.includes('walmart') || 
      desc.includes('amazon') || desc.includes('shop')) {
    return 'Shopping';
  }
  
  if (desc.includes('apple.com') || desc.includes('netflix') || desc.includes('spotify') || 
      desc.includes('subscription') || desc.includes('bill')) {
    return 'Subscriptions & Bills';
  }
  
  if (desc.includes('gas') || desc.includes('shell') || desc.includes('exxon') || 
      desc.includes('transport') || desc.includes('uber') || desc.includes('lyft')) {
    return 'Transportation';
  }
  
  if (desc.includes('bank') || desc.includes('atm') || desc.includes('fee')) {
    return 'Fees & Charges';
  }
  
  return 'Other';
}

export default function Dashboard() {
  const { toast } = useToast();
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery<SummaryData>({
    queryKey: ["/api/analytics/summary"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/analytics/summary');
      const data = await response.json();
      console.log('Summary data received:', data);
      return data;
    },
  });

  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useQuery<Transaction[]>({
    queryKey: ["/api/analytics/recent-transactions"],
  });

  const { data: budgets, isLoading: budgetsLoading, error: budgetsError } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
  });

  const { data: savingsGoals, isLoading: goalsLoading } = useQuery<SavingsGoal[]>({
    queryKey: ['/api/savings-goals'],
  });

  // Add a separate query for category spending data
  const { data: categorySpending, isLoading: categorySpendingLoading } = useQuery<CategorySpending[]>({
    queryKey: ["/api/analytics/spending-by-category"],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/analytics/spending-by-category');
        const data = await response.json();
        console.log('Category spending data received:', data);
        
        // Calculate percentages from backend data
        const totalAmount = data.reduce((sum: number, item: any) => sum + item.amount, 0);
        const categorySpendingWithPercentages = data.map((item: any) => ({
          ...item,
          percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
        }));
        
        return categorySpendingWithPercentages;
      } catch (error) {
        console.warn('Category spending endpoint not available, calculating from transactions');
        // Fallback: calculate categories from transactions if API endpoint doesn't exist
        if (transactions && transactions.length > 0) {
          return calculateCategorySpendingFromTransactions(transactions);
        }
        return [];
      }
    },
  });

  // Centralized loading state for the entire dashboard
  const isLoading = summaryLoading || transactionsLoading || budgetsLoading || goalsLoading || categorySpendingLoading;

  // Handle a loading state for the entire page
  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="dashboard-loading">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-[150px] w-full" />
          <Skeleton className="h-[150px] w-full" />
          <Skeleton className="h-[150px] w-full" />
          <Skeleton className="h-[150px] w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[350px] w-full" />
          <Skeleton className="h-[350px] w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[350px] w-full" />
          <Skeleton className="h-[350px] w-full" />
        </div>
      </div>
    );
  }

  // Handle a "no data" state after loading
  const hasData = summary && (summary.totalBalance > 0 || summary.monthlySpending > 0 || summary.budgetRemaining > 0);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center" data-testid="no-data-message">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Welcome to your personal finance dashboard!
        </p>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          It looks like you don't have any data yet. To get started, please upload a CSV file with your transactions.
        </p>
        <CsvUpload />
      </div>
    );
  }

  const safeSummary: SummaryData & { categorySpending?: CategorySpending[] } = {
    totalBalance: summary?.totalBalance ?? 0,
    monthlySpending: summary?.monthlySpending ?? 0,
    savingsProgress: summary?.savingsProgress ?? 0,
    budgetRemaining: summary?.budgetRemaining ?? 0,
    savingsGoals: summary?.savingsGoals || [],
    categorySpending: categorySpending || [],
  };

  const handleAddTransactionClick = () => {
    setIsAddTransactionModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddTransactionModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6" data-testid="dashboard-page">
      <SummaryCards 
        summary={safeSummary as SummaryData} 
        categorySpending={categorySpending || []}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingChart />
        <RecentTransactions
          transactions={(transactions as Transaction[])?.slice(0, 5) || []}
          isLoading={transactionsLoading}
          onAddTransactionClick={handleAddTransactionClick}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetOverview
          budgets={(budgets as Budget[]) || []}
          isLoading={budgetsLoading}
        />
        <SavingsGoals
          goals={(savingsGoals as SavingsGoal[]) || []}
          isLoading={goalsLoading}
        />
      </div>

      <CsvUpload />

      {isAddTransactionModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md dark:bg-gray-800">
            <h2 className="text-xl font-bold mb-4">Add New Transaction</h2>
            <p>Form fields for adding a new transaction would go here.</p>
            <div className="flex justify-end mt-6">
              <Button onClick={handleCloseModal} variant="outline" className="mr-2">Cancel</Button>
              <Button onClick={handleCloseModal}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
