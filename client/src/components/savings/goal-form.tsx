import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Target } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate?: string | null;
}

interface GoalFormProps {
  onSave: () => void;
  onCancel: () => void;
  initialData?: SavingsGoal | null;
}

const GoalForm: React.FC<GoalFormProps> = ({ onSave, onCancel, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [targetAmount, setTargetAmount] = useState(initialData?.targetAmount || '');
  const [currentAmount, setCurrentAmount] = useState(initialData?.currentAmount || '0');
  const [targetDate, setTargetDate] = useState<Date | undefined>(
    initialData?.targetDate ? new Date(initialData.targetDate) : undefined
  );

  const { toast } = useToast();

  const addGoalMutation = useMutation({
    mutationFn: async (newGoal: Omit<SavingsGoal, 'id'>) => {
      return apiRequest('POST', '/api/savings-goals', newGoal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-goals"] });
      toast({
        title: "Goal created",
        description: "New savings goal has been successfully created.",
      });
      onSave();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create goal.",
        variant: "destructive",
      });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async (updatedGoal: SavingsGoal) => {
      return apiRequest('PUT', `/api/savings-goals/${updatedGoal.id}`, updatedGoal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-goals"] });
      toast({
        title: "Goal updated",
        description: "Savings goal has been successfully updated.",
      });
      onSave();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update goal.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Goal name is required.",
        variant: "destructive",
      });
      return;
    }

    const targetAmountNum = parseFloat(targetAmount);
    if (isNaN(targetAmountNum) || targetAmountNum <= 0) {
      toast({
        title: "Validation Error",
        description: "Target amount must be a positive number.",
        variant: "destructive",
      });
      return;
    }

    const currentAmountNum = parseFloat(currentAmount);
    if (isNaN(currentAmountNum) || currentAmountNum < 0) {
      toast({
        title: "Validation Error",
        description: "Current amount must be a positive number or zero.",
        variant: "destructive",
      });
      return;
    }

    const goalData = {
      name: name.trim(),
      targetAmount: targetAmountNum.toString(),
      currentAmount: currentAmountNum.toString(),
      targetDate: targetDate ? targetDate.toISOString() : null,
    };

    if (initialData?.id) {
      updateGoalMutation.mutate({ ...goalData, id: initialData.id });
    } else {
      addGoalMutation.mutate(goalData);
    }
  };

  // Calculate progress for preview
  const current = parseFloat(currentAmount || '0');
  const target = parseFloat(targetAmount || '0');
  const progress = target > 0 ? (current / target) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {initialData ? "Edit Savings Goal" : "Add New Savings Goal"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Goal Name</Label>
              <Input
                id="name"
                placeholder="e.g., Emergency Fund, Vacation, New Car"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                data-testid="goal-name-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="targetAmount">Target Amount</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                  data-testid="goal-target-amount-input"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currentAmount">Current Amount</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  required
                  data-testid="goal-current-amount-input"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Target Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !targetDate && "text-muted-foreground"
                    )}
                    data-testid="goal-target-date-input"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetDate ? format(targetDate, "MMM dd, yyyy") : "Pick a target date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={targetDate}
                    onSelect={setTargetDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Progress Preview */}
            {target > 0 && (
              <div 
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                data-testid="goal-progress-preview"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress Preview</span>
                  <span className="text-sm font-semibold">
                    {progress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>${current.toFixed(2)}</span>
                  <span>${target.toFixed(2)}</span>
                </div>
                {progress >= 100 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                    Goal achieved!
                  </p>
                )}
              </div>
            )}

            {/* Days calculation */}
            {targetDate && target > 0 && current < target && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-sm">
                {(() => {
                  const today = new Date();
                  const daysLeft = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (daysLeft > 0) {
                    const remaining = target - current;
                    const dailyRequired = remaining / daysLeft;
                    return (
                      <p className="text-blue-700 dark:text-blue-300">
                        <strong>{daysLeft}</strong> days to reach your goal.
                        <br />
                        Save <strong>${dailyRequired.toFixed(2)}</strong> per day to stay on track.
                      </p>
                    );
                  } else if (daysLeft === 0) {
                    return (
                      <p className="text-orange-700 dark:text-orange-300">
                        Target date is today!
                      </p>
                    );
                  } else {
                    return (
                      <p className="text-red-700 dark:text-red-300">
                        Target date has passed.
                      </p>
                    );
                  }
                })()}
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={onCancel} 
            disabled={addGoalMutation.isPending || updateGoalMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={addGoalMutation.isPending || updateGoalMutation.isPending}
            data-testid="submit-goal-form"
          >
            {addGoalMutation.isPending || updateGoalMutation.isPending
              ? (initialData ? "Updating..." : "Creating...")
              : (initialData ? "Save Changes" : "Create Goal")
            }
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GoalForm;
