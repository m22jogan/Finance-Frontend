// client/src/pages/savings.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import GoalForm from "@/components/savings/goal-form"; // <-- new form

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: string; // stored as string for consistency with GoalForm
  currentAmount: string;
  targetDate?: string | null;
}

export default function Savings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // fetch goals
  const { data: goals = [], isLoading } = useQuery<SavingsGoal[]>({
    queryKey: ["/api/savings-goals"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/savings-goals");
      return res.json();
    },
  });

  // delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/savings-goals/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-goals"] });
      toast({ title: "Goal deleted", description: "Savings goal removed." });
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive",
      }),
  });

  const formatCurrency = (amount: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(amount || "0"));

  const formatDate = (dateString?: string | null) =>
    dateString
      ? new Date(dateString).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-40" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Savings Goals</h1>
        <Button
          onClick={() => {
            setEditingGoalId(null); // new goal
            setIsFormOpen(true);
          }}
          data-testid="add-goal-button"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Goal
        </Button>
      </div>

      {/* Form modal */}
      {isFormOpen && (
        <GoalForm
          goalId={editingGoalId ?? undefined}
          onClose={() => {
            setIsFormOpen(false);
            setEditingGoalId(null);
          }}
        />
      )}

      {/* Goals list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const current = parseFloat(goal.currentAmount || "0");
          const target = parseFloat(goal.targetAmount || "0");
          const percentage = target > 0 ? (current / target) * 100 : 0;

          return (
            <Card key={goal.id}>
              <CardHeader className="flex justify-between items-center">
                <CardTitle>{goal.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingGoalId(goal.id);
                      setIsFormOpen(true);
                    }}
                    data-testid={`edit-goal-${goal.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(goal.id)}
                    data-testid={`delete-goal-${goal.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p>
                  {formatCurrency(goal.currentAmount)} of{" "}
                  {formatCurrency(goal.targetAmount)}
                </p>
                <div className="mt-2 bg-gray-200 h-3 rounded">
                  <div
                    className="h-3 rounded bg-blue-500 transition-all"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                {goal.targetDate && (
                  <p className="text-sm">
                    Target: {formatDate(goal.targetDate)}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
