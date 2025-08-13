import { useState } from "react"; // Added useState for modal management
import { useQuery } from "@tanstack/react-query";
import SummaryCards from "@/components/dashboard/summary-cards";
import SpendingChart from "@/components/dashboard/spending-chart";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import BudgetOverview from "@/components/dashboard/budget-overview";
import SavingsGoals from "@/components/dashboard/savings-goals";
import CsvUpload from "@/components/upload/csv-upload";
import { Skeleton } from "@/components/ui/skeleton";
import type { SummaryData, Transaction, Budget, SavingsGoal } from "@shared/schema";
import { Button } from "@/components/ui/button"; // Added Button import
import { useToast } from "@/hooks/use-toast"; // Added useToast import
import { apiRequest } from "@/lib/queryClient"; // Added apiRequest import

// Define Category type as it's used for fetching categories
interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export default function Dashboard() {
  const { toast } = useToast(); // Initialize useToast
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false); // State for modal

  const { data: summary, isLoading: summaryLoading } = useQuery<SummaryData>({
    queryKey: ["/api/analytics/summary"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/analytics/summary');
      return response.json();
    },
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/transactions');
      return response.json();
    },
  });

  const { data: budgets, isLoading: budgetsLoading } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/budgets');
      return response.json();
    },
  });

  const { data: savingsGoals, isLoading: goalsLoading } = useQuery<SavingsGoal[]>({
    queryKey: ["/api/savings-goals"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/savings-goals');
      return response.json();
    },
  });

  // Fetch categories (needed for manual transaction adding dropdowns, etc.)
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/categories');
      return response.json();
    },
  });


  // Function to handle clicking the "Add Transaction" button
  const handleAddTransactionClick = () => {
    toast({
      title: "Add Transaction",
      description: "Opening form to add a new transaction...",
    });
    setIsAddTransactionModalOpen(true);
  };

  // Function to close the add transaction modal/form
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

  return (
    <div className="p-6 space-y-6" data-testid="dashboard-page">
      <SummaryCards summary={summary as SummaryData} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingChart />
        <RecentTransactions 
          transactions={(transactions as Transaction[])?.slice(0, 5) || []} 
          isLoading={transactionsLoading} 
          onAddTransactionClick={handleAddTransactionClick} // Prop added here
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

      {/* Simple modal for Add New Transaction */}
      {isAddTransactionModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md dark:bg-gray-800">
            <h2 className="text-xl font-bold mb-4">Add New Transaction</h2>
            <p>Form fields for adding a new transaction would go here. You can use the `categories` data fetched above to populate a dropdown for transaction categories.</p>
            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={handleCloseAddTransactionModal}>Cancel</Button>
              {/* Add a submit button for the form here */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
