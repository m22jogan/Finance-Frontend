// client/src/pages/savings.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, Trash2, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
}

export default function Savings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Add form state
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTargetAmount, setNewGoalTargetAmount] = useState<number | "">("");
  const [newGoalTargetDate, setNewGoalTargetDate] = useState("");

  // Edit form state
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [editCurrentAmount, setEditCurrentAmount] = useState<number | "">("");

  // Fetch goals
  const { data: goals = [], isLoading } = useQuery<SavingsGoal[]>({
    queryKey: ["/api/savings-goals"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/savings-goals");
      return response.json();
    },
  });

  // Create
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: {
      name: string;
      target_amount: number;
      current_amount: number;
      target_date?: string | null;
    }) => {
      const response = await apiRequest("POST", "/api/savings-goals", goalData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-goals"] });
      toast({ title: "Savings goal created", description: "Goal added." });
      setIsAddFormOpen(false);
      setNewGoalName("");
      setNewGoalTargetAmount("");
      setNewGoalTargetDate("");
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to create savings goal",
        variant: "destructive",
      }),
  });

  // Update
  const updateGoalMutation = useMutation({
    mutationFn: async (goalData: { id: string; current_amount: number }) => {
      const response = await apiRequest(
        "PUT",
        `/api/savings-goals/${goalData.id}`,
        goalData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-goals"] });
      toast({ title: "Savings goal updated", description: "Progress updated." });
      setEditingGoal(null);
      setEditCurrentAmount("");
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to update savings goal",
        variant: "destructive",
      }),
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/savings-goals/${id}`);
      return response.json();
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

  const handleAddGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim() || newGoalTargetAmount === "") {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createGoalMutation.mutate({
      name: newGoalName,
      target_amount: newGoalTargetAmount as number,
      current_amount: 0,
      target_date: newGoalTargetDate || undefined,
    });
  };

  const handleEditGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || editCurrentAmount === "") return;
    updateGoalMutation.mutate({
      id: editingGoal.id,
      current_amount: editCurrentAmount as number,
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const formatDate = (dateString?: string) =>
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
        <Button onClick={() => setIsAddFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Goal
        </Button>
      </div>

      {/* Add form */}
      {isAddFormOpen && (
        <Card className="p-6">
          <CardTitle>Add New Savings Goal</CardTitle>
          <form onSubmit={handleAddGoalSubmit} className="space-y-4 mt-4">
            <input
              type="text"
              value={newGoalName}
              onChange={(e) => setNewGoalName(e.target.value)}
              placeholder="Goal Name"
              required
              className="w-full border rounded p-2"
            />
            <input
              type="number"
              value={newGoalTargetAmount}
              onChange={(e) => setNewGoalTargetAmount(parseFloat(e.target.value) || "")}
              placeholder="Target Amount"
              required
              className="w-full border rounded p-2"
            />
            <input
              type="date"
              value={newGoalTargetDate}
              onChange={(e) => setNewGoalTargetDate(e.target.value)}
              className="w-full border rounded p-2"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Edit form */}
      {editingGoal && (
        <Card className="p-6">
          <CardTitle>Edit Goal: {editingGoal.name}</CardTitle>
          <form onSubmit={handleEditGoalSubmit} className="space-y-4 mt-4">
            <input
              type="number"
              value={editCurrentAmount}
              onChange={(e) => setEditCurrentAmount(parseFloat(e.target.value) || "")}
              placeholder="Current Amount"
              required
              className="w-full border rounded p-2"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingGoal(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateGoalMutation.isPending}>
                {updateGoalMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Goals list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const percentage =
            goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
          return (
            <Card key={goal.id}>
              <CardHeader className="flex justify-between">
                <CardTitle>{goal.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingGoal(goal);
                      setEditCurrentAmount(goal.current_amount);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(goal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p>
                  {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
                </p>
                <div className="mt-2 bg-gray-200 h-3 rounded">
                  <div
                    className="h-3 rounded bg-blue-500"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                {goal.target_date && <p className="text-sm">Target: {formatDate(goal.target_date)}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
