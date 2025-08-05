import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate?: string;
}

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  isLoading: boolean;
}

export default function SavingsGoals({ goals, isLoading }: SavingsGoalsProps) {
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
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800" data-testid="savings-goals-loading">
        <CardHeader>
          <CardTitle>Savings Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-40" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800" data-testid="savings-goals">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Savings Goals</CardTitle>
        <Link href="/savings">
          <Button variant="ghost" size="sm" data-testid="add-goal">
            Add Goal
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map((goal) => {
              const current = parseFloat(goal.currentAmount);
              const target = parseFloat(goal.targetAmount);
              const percentage = target > 0 ? (current / target) * 100 : 0;
              const remaining = target - current;

              return (
                <div 
                  key={goal.id} 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  data-testid={`savings-goal-${goal.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium" data-testid={`goal-name-${goal.id}`}>
                      {goal.name}
                    </span>
                    {goal.targetDate && (
                      <span className="text-sm text-gray-600 dark:text-gray-400" data-testid={`goal-date-${goal.id}`}>
                        {formatDate(goal.targetDate)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold" data-testid={`goal-current-${goal.id}`}>
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400" data-testid={`goal-target-${goal.id}`}>
                      of {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                      data-testid={`goal-progress-${goal.id}`}
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <span data-testid={`goal-percentage-${goal.id}`}>
                      {percentage.toFixed(1)}% complete
                    </span>
                    {remaining > 0 && (
                      <>
                        {" • "}
                        <span data-testid={`goal-remaining-${goal.id}`}>
                          {formatCurrency(remaining.toString())} remaining
                        </span>
                      </>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8" data-testid="no-savings-goals">
            <p className="text-gray-500 dark:text-gray-400">No savings goals yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
              Set savings goals to track your progress
            </p>
            <Link href="/savings">
              <Button size="sm" data-testid="create-first-goal">
                Create Goal
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
