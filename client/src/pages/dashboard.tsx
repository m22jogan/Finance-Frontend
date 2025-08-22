import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SummaryCards from "@/components/dashboard/summary-cards";
import SpendingChart from "@/components/dashboard/spending-chart";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import BudgetOverview from "@/components/dashboard/budget-overview";
import CsvUpload from "@/components/upload/csv-upload";
import { Skeleton } from "@/components/ui/skeleton";
import type { SummaryData, Transaction, Budget } from "@shared/schema";
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

export default function Dashboard() {
  const { toast } = useToast();
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery<SummaryData>({
    queryKey: ["/api/analytics/summary"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/analytics/summary');
      const data = await response.json();
      console.log('Summary data received:', data); // Debug log
      return data;
    },
  });

  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/transactions');
      const data = await response.json();
      console.log('Transactions data received:', data.length, 'transactions'); // Debug log
      return data;
    },
  });

  const { data: budgets, isLoading: budgetsLoading } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/budgets');
      return response.json();
    },
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/categories');
      return response.json();
    },
  });

  // Error handling
  if (summaryError || transactionsError) {
    console.error('Dashboard errors:', { summaryError, transactionsError });
    return (
      <div className="p-6 space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <h3 className="font-bold">Error Loading Dashboard</h3>
          <p>There was an error loading your dashboard data. Please refresh the page.</p>
          <details className="mt-2">
            <summary>Error Details</summary>
            <pre className="mt-2 text-xs">
              {summaryError && `Summary Error: ${summaryError.message}\n`}
              {transactionsError && `Transactions Error: ${transactionsError.message}\n`}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  const handleAddTransactionClick = () => {
    toast({
      title: "Add Transaction",
      description: "Opening form to add a new transaction...",
    });
    setIsAddTransactionModalOpen(true);
  };

  const handleCloseAddTransactionModal = () => {
    setIsAddTransactionModalOpen(false);
  };

  if (summaryLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Add safe fallbacks for data
  const safeSummary = summary || {
    totalBalance: 0,
    monthlySpending: 0,
    budgetRemaining: 0
  };

  return (
    <div className="p-6 space-y-6" data-testid="dashboard-page">
      <SummaryCards summary={safeSummary as SummaryData} />
      
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
      </div>
      
      <CsvUpload />

      {isAddTransactionModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md dark:bg-gray-800">
            <h2 className="text-xl font-bold mb-4">Add New Transaction</h2>
            <p>Form fields for adding a new transaction would go here.</p>
            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={handleCloseAddTransactionModal}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
