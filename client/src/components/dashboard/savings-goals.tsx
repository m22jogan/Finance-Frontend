import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Updated SavingsGoal interface to match the backend API
interface SavingsGoal {
  id: string;
  name: string;
  target_amount: string;
  current_amount: string;
  target_date?: string | null;
}

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  isLoading: boolean;
}

export default function SavingsGoals({ goals, isLoading }: SavingsGoalsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // NEW: State for managing the modal and the selected goal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [amountToAdd, setAmountToAdd] = useState("");

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num) ? "$0.00" : new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  // NEW: `useMutation` hook to handle the API call for updating the goal
  const mutation = useMutation({
    mutationFn: ({ goalId, amount }: { goalId: string; amount: number }) => {
      return apiRequest('PATCH', `/api/v1/savings-goals/${goalId}/add-funds`, { amount });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Funds have been added to your goal.",
      });
      // After a successful update, refetch the savings goals to update the UI
      queryClient.invalidateQueries({ queryKey: ["/api/v1/savings-goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/analytics/summary"] }); // Also refetch summary data
      handleCloseModal();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Could not add funds: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // NEW: Handler functions for the modal
  const handleAddFundsClick = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGoal(null);
    setAmountToAdd("");
  };

  const handleSaveChanges = () => {
    if (selectedGoal && amountToAdd) {
      const amount = parseFloat(amountToAdd);
      if (!isNaN(amount) && amount > 0) {
        mutation.mutate({ goalId: selectedGoal.id, amount });
      } else {
        toast({ title: "Invalid Amount", description: "Please enter a valid positive number.", variant: "destructive" });
      }
    }
  };

  if (isLoading) {
    // Skeleton loading state remains the same...
    return (
      <Card className="bg-white dark:bg-gray-800" data-testid="savings-goals-loading">
        <CardHeader><CardTitle>Savings Goals</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">{[...Array(2)].map((_, i) => (<div key={i} className="p-4 border rounded-lg space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-6 w-24" /><Skeleton className="h-2 w-full" /><Skeleton className="h-3 w-40" /></div>))}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
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
                // Correctly use snake_case keys for parsing
                const current = parseFloat(goal.current_amount || "0");
                const target = parseFloat(goal.target_amount || "0");
                const percentage = target > 0 ? (current / target) * 100 : 0;

                return (
                  <div key={goal.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg" data-testid={`savings-goal-${goal.id}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-medium" data-testid={`goal-name-${goal.id}`}>{goal.name}</span>
                        {goal.target_date && (<span className="block text-xs text-gray-500 dark:text-gray-400" data-testid={`goal-date-${goal.id}`}>{formatDate(goal.target_date)}</span>)}
                      </div>
                      {/* NEW: "Add Funds" button for each goal */}
                      <Button variant="outline" size="sm" onClick={() => handleAddFundsClick(goal)}>
                        Add Funds
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold" data-testid={`goal-current-${goal.id}`}>{formatCurrency(goal.current_amount)}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400" data-testid={`goal-target-${goal.id}`}>of {formatCurrency(goal.target_amount)}</span>
                    </div>
                    <Progress value={percentage} className="h-2 mb-2" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      <span data-testid={`goal-percentage-${goal.id}`}>{percentage.toFixed(1)}% complete</span>
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8" data-testid="no-savings-goals">
              <p className="text-gray-500 dark:text-gray-400">No savings goals yet</p>
              <Link href="/savings"><Button size="sm" data-testid="create-first-goal">Create Goal</Button></Link>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* NEW: Dialog (Modal) for adding funds */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={handleCloseModal}>
          <DialogHeader>
            <DialogTitle>Add Funds to "{selectedGoal?.name}"</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="e.g., 50.00"
                value={amountToAdd}
                onChange={(e) => setAmountToAdd(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button></DialogClose>
            <Button type="submit" onClick={handleSaveChanges} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
