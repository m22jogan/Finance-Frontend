import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trash2, Edit, Target } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";

interface SavingsGoal {
  id: string;
  name: string;
  target_amount: string;
  current_amount: string;
  target_date?: string | null;
}

interface GoalListProps {
  goals: SavingsGoal[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onEdit: (goal: SavingsGoal) => void;
  isDeleting?: boolean;
}

export default function GoalList({
  goals,
  isLoading,
  onDelete,
  onEdit,
  isDeleting,
}: GoalListProps) {
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const { toast } = useToast();

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800" data-testid="goal-list-loading">
        <CardHeader>
          <CardTitle className="text-lg">All Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3 py-4 border-b last:border-b-0">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800" data-testid="goal-list">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          All Goals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-8" data-testid="no-goals-list">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No savings goals found.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Create your first goal to start tracking your savings progress!
            </p>
          </div>
        ) : (
          <ul className="space-y-6">
            {goals.map((goal) => {
              const current = parseFloat(goal.current_amount || "0");
              const target = parseFloat(goal.target_amount || "0");
              const percentage = target > 0 ? (current / target) * 100 : 0;
              const isCompleted = percentage >= 100;

              return (
                <li
                  key={goal.id}
                  className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
                  data-testid={`goal-item-${goal.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 
                        className="font-semibold text-lg flex items-center gap-2"
                        data-testid={`goal-item-name-${goal.id}`}
                      >
                        {goal.name}
                        {isCompleted && (
                          <span className="text-green-500 text-sm">🎉</span>
                        )}
                      </h3>
                      <p 
                        className="text-sm text-muted-foreground mt-1"
                        data-testid={`goal-item-amounts-${goal.id}`}
                      >
                        {formatCurrency(current)} of {formatCurrency(target)}
                        {goal.target_date && (
                          <span className="ml-2">
                            • Target: {formatDate(goal.target_date)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span 
                        className={`text-sm font-semibold px-2 py-1 rounded ${
                          isCompleted 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}
                        data-testid={`goal-item-percentage-${goal.id}`}
                      >
                        {percentage.toFixed(1)}%
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(goal)}
                        data-testid={`goal-item-edit-${goal.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedGoal(goal)}
                            data-testid={`goal-item-delete-trigger-${goal.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <div className="flex flex-col gap-4">
                            <p>
                              Are you sure you want to delete the goal{" "}
                              <strong>{selectedGoal?.name}</strong>?
                            </p>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="secondary"
                                onClick={() => setSelectedGoal(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  if (selectedGoal) {
                                    onDelete(selectedGoal.id);
                                    setSelectedGoal(null);
                                  }
                                }}
                                disabled={isDeleting}
                              >
                                {isDeleting ? "Deleting..." : "Delete"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className="h-3"
                      data-testid={`goal-item-progress-${goal.id}`}
                    />
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>{formatCurrency(current)}</span>
                      <span>{formatCurrency(target)}</span>
                    </div>
                  </div>

                  {/* Status Messages */}
                  {isCompleted && (
                    <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded text-sm">
                      <span className="text-green-700 dark:text-green-400 font-medium">
                        🎉 Congratulations! You've reached your savings goal!
                      </span>
                    </div>
                  )}

                  {goal.target_date && !isCompleted && (
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      {(() => {
                        const today = new Date();
                        const targetDate = new Date(goal.target_date);
                        const daysLeft = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        
                        if (daysLeft < 0) {
                          return (
                            <span className="text-red-500 dark:text-red-400">
                              Target date passed
                            </span>
                          );
                        } else if (daysLeft === 0) {
                          return (
                            <span className="text-orange-500 dark:text-orange-400">
                              Target date is today!
                            </span>
                          );
                        } else {
                          const remaining = target - current;
                          const dailyRequired = remaining / daysLeft;
                          return (
                            <span>
                              {daysLeft} days left • Need to save {formatCurrency(dailyRequired)}/day
                            </span>
                          );
                        }
                      })()}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
