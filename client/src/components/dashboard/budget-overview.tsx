import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface Budget {
  id: string;
  name: string;
  amount: string;
  spent: string;
  categoryId?: string;
}

interface BudgetOverviewProps {
  budgets: Budget[];
  isLoading: boolean;
}

export default function BudgetOverview({ budgets, isLoading }: BudgetOverviewProps) {
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-blue-500";
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800" data-testid="budget-overview-loading">
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800" data-testid="budget-overview">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Budget Overview</CardTitle>
        <Link href="/budgets">
          <Button variant="ghost" size="sm" data-testid="manage-budgets">
            Manage
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {budgets.length > 0 ? (
          <div className="space-y-4">
            {budgets.map((budget) => {
              const spent = parseFloat(budget.spent);
              const total = parseFloat(budget.amount);
              const percentage = total > 0 ? (spent / total) * 100 : 0;

              return (
                <div key={budget.id} className="space-y-2" data-testid={`budget-${budget.id}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" data-testid={`budget-name-${budget.id}`}>
                      {budget.name}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400" data-testid={`budget-amount-${budget.id}`}>
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                      data-testid={`budget-progress-${budget.id}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${
                      percentage >= 100 ? 'text-red-600' : 
                      percentage >= 80 ? 'text-yellow-600' : 
                      'text-blue-600'
                    }`}>
                      {percentage.toFixed(1)}% used
                    </span>
                    <span className="text-gray-500">
                      {formatCurrency((total - spent).toString())} remaining
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8" data-testid="no-budgets">
            <p className="text-gray-500 dark:text-gray-400">No budgets created yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
              Create budgets to track your spending by category
            </p>
            <Link href="/budgets">
              <Button size="sm" data-testid="create-first-budget">
                Create Budget
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
