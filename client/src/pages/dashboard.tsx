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

interface SpendingChartData {
  name: string;
  amount: number;
  color: string;
}

// Helper function to convert category spending to chart format
function convertToChartData(categorySpending: CategorySpending[]): SpendingChartData[] {
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658"];
  
  return categorySpending.map((item, index) => ({
    name: item.category,
    amount: item.amount,
    color: COLORS[index % COLORS.length]
  }));
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

  // Fetch category spending data from your backend
  const { data: categorySpending, isLoading: categorySpendingLoading } = useQuery<CategorySpending[]>({
    queryKey: ["/api/analytics/spending-by-category"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/analytics/spending-by-category');
      const data = await response.json();
      console.log('Category spending data received:', data);
      
      // Your backend returns [{category: "Food & Dining", amount: 450.20}, ...]
      // Calculate percentages from the amounts
      const totalAmount = data.reduce((sum: number, item: any) => sum + item.amount, 0);
      const categorySpendingWithPercentages = data.map((item: any) => ({
        category: item.category,
        amount: item.amount,
        percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
      }));
      
      return categorySpendingWithPercentages;
    },
  });

  // Convert category spending to chart format for SpendingChart component
  const chartData = categorySpending ? convertToChartData(categorySpending) : [];

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
      <SummaryCards summary={safeSummary as SummaryData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingChart chartData={chartData} isLoading={categorySpendingLoading} />
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
