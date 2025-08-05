import { useQuery } from "@tanstack/react-query";
import SummaryCards from "@/components/dashboard/summary-cards";
import SpendingChart from "@/components/dashboard/spending-chart";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import BudgetOverview from "@/components/dashboard/budget-overview";
import SavingsGoals from "@/components/dashboard/savings-goals";
import CsvUpload from "@/components/upload/csv-upload";
import { Skeleton } from "@/components/ui/skeleton";
import type { SummaryData, Transaction, Budget, SavingsGoal } from "@shared/schema";

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useQuery<SummaryData>({
    queryKey: ["/api/analytics/summary"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: budgets, isLoading: budgetsLoading } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
  });

  const { data: savingsGoals, isLoading: goalsLoading } = useQuery<SavingsGoal[]>({
    queryKey: ["/api/savings-goals"],
  });

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
    </div>
  );
}
