import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import GoalForm from "@/components/savings/goal-form";
import GoalList from "@/components/savings/goal-list";

interface SavingsGoal {
  id: string;
  name: string;
  target_amount: string;
  current_amount: string;
  target_date?: string | null;
}

export default function Savings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const { toast } = useToast();

  // Fetch all goals
  const { data: goals = [], isLoading: goalsLoading } = useQuery<SavingsGoal[]>({
    queryKey: ["/api/v1/savings-goals"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/v1/savings-goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/savings-goals"] });
      toast({
        title: "Goal deleted",
        description: "Savings goal has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete goal.",
        variant: "destructive",
      });
    },
  });

  // Filter goals based on search
  const filteredGoals = goals.filter((goal) =>
    goal.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingGoal(null);
  };

  // Show loading state while goals are loading
  if (goalsLoading) {
    return (
      <div className="p-6" data-testid="savings-loading-page">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64" />
          </div>
          <Card>
            <CardContent className="p-6">
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
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="savings-page">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Savings Goals</h1>
        <Button 
          data-testid="add-goal-button"
          onClick={() => {
            setEditingGoal(null);
            setIsFormOpen(true);
          }} 
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search goals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-goals"
          />
        </div>
      </div>

      <GoalList
        goals={filteredGoals}
        isLoading={goalsLoading}
        onDelete={deleteMutation.mutate}
        onEdit={handleEditGoal}
        isDeleting={deleteMutation.isPending}
      />

      {isFormOpen && (
        <GoalForm 
          onSave={handleFormClose} 
          onCancel={handleFormClose} 
          initialData={editingGoal}
        />
      )}
    </div>
  );
}
