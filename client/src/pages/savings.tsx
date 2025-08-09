import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, Trash2, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate?: string;
}

export default function Savings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: goals = [], isLoading } = useQuery<SavingsGoal[]>({
    queryKey: ["/api/savings-goals"],
});

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/savings-goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-goals"] });
      toast({
        title: "Savings goal deleted",
        description: "Savings goal has been successfully deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete savings goal",
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-600";
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 50) return "bg-blue-500";
    if (percentage >= 25) return "bg-yellow-500";
    return "bg-gray-400";
  };

  if (isLoading) {
    return (
      <div className="p-6" data-testid="savings-loading">
        <div className="space-y-6">
          <Skeleton className="h-8 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
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
    <div className="p-6 space-y-6" data-testid="savings-page">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Savings Goals</h1>
        <Button data-testid="add-goal-button">
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal: SavingsGoal) => {
            const current = parseFloat(goal.currentAmount);
            const target = parseFloat(goal.targetAmount);
            const percentage = target > 0 ? (current / target) * 100 : 0;
            const remaining = target - current;

            return (
              <Card key={goal.id} className="bg-white dark:bg-gray-800" data-testid={`goal-card-${goal.id}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold" data-testid={`goal-name-${goal.id}`}>
                    {goal.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      data-testid={`edit-goal-${goal.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteMutation.mutate(goal.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`delete-goal-${goal.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold" data-testid={`goal-current-${goal.id}`}>
                        {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400" data-testid={`goal-target-${goal.id}`}>
                        of {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                        data-testid={`goal-progress-${goal.id}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm font-semibold" data-testid={`goal-percentage-${goal.id}`}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    
                    {remaining > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Remaining:
                        </span>
                        <span className="text-sm font-medium" data-testid={`goal-remaining-${goal.id}`}>
                          {formatCurrency(remaining.toString())}
                        </span>
                      </div>
                    )}

                    {goal.targetDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Target Date:
                        </span>
                        <span className="text-sm font-medium" data-testid={`goal-date-${goal.id}`}>
                          {formatDate(goal.targetDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  {percentage >= 100 && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-600" />
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                          Goal achieved! 🎉
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {percentage >= 75 && percentage < 100 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        Almost there! Keep it up! 💪
                      </p>
                    </div>
                  )}

                  {percentage < 25 && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Just getting started. You've got this! 🚀
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
          <CardContent className="text-center py-12" data-testid="no-goals">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No savings goals yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Set savings goals to track your progress and stay motivated
            </p>
            <Button data-testid="create-first-goal">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
