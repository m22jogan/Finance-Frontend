import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Budget {
  id: string;
  name: string;
  amount: string;
  spent: string;
  categoryId?: string;
  period: string;
  startDate: string;
  endDate: string;
}

export default function Budgets() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

const { data: budgets = [], isLoading } = useQuery<Budget[]>({
  queryKey: ["/api/v1/budgets"],
});

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/v1/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/budgets"] });
      toast({
        title: "Budget deleted",
        description: "Budget has been successfully deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete budget",
        variant: "destructive",
      });
    },
  });

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

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return "text-red-600";
    if (percentage >= 80) return "text-yellow-600";
    return "text-blue-600";
  };

  if (isLoading) {
    return (
      <div className="p-6" data-testid="budgets-loading">
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-40" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="budgets-page">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Budgets</h1>
        <Button data-testid="add-budget-button">
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </div>

      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget: Budget) => {
            const spent = parseFloat(budget.spent);
            const total = parseFloat(budget.amount);
            const percentage = total > 0 ? (spent / total) * 100 : 0;
            const remaining = total - spent;

            return (
              <Card key={budget.id} className="bg-white dark:bg-gray-800" data-testid={`budget-card-${budget.id}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-semibold" data-testid={`budget-name-${budget.id}`}>
                    {budget.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      data-testid={`edit-budget-${budget.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteMutation.mutate(budget.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`delete-budget-${budget.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold" data-testid={`budget-spent-${budget.id}`}>
                        {formatCurrency(budget.spent)}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400" data-testid={`budget-total-${budget.id}`}>
                        of {formatCurrency(budget.amount)}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                        data-testid={`budget-progress-${budget.id}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${getStatusColor(percentage)}`}>
                        {percentage.toFixed(1)}% used
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {budget.period}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Remaining:
                      </span>
                      <span className={remaining >= 0 ? "text-green-600" : "text-red-600"} data-testid={`budget-remaining-${budget.id}`}>
                        {formatCurrency(remaining.toString())}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500">
                      {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                    </div>
                  </div>

                  {percentage >= 100 && (
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                        Budget exceeded by {formatCurrency((spent - total).toString())}
                      </p>
                    </div>
                  )}
                  
                  {percentage >= 80 && percentage < 100 && (
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                        Approaching budget limit
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="text-center py-12" data-testid="no-budgets">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No budgets created yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create budgets to track your spending by category and time period
            </p>
            <Button data-testid="create-first-budget">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Budget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}