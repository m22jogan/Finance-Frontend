import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X, Target } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import React from "react";

// -------------------- Schema --------------------
const goalFormSchema = z.object({
  name: z.string().min(1, "Goal name is required"),
  targetAmount: z
    .string()
    .min(1, "Target amount is required")
    .refine(
      (val: string) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "Target amount must be a positive number"
    ),
  currentAmount: z
    .string()
    .refine(
      (val: string) =>
        val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      "Current amount must be a positive number or empty"
    ),
  targetDate: z.date().optional(),
});

type GoalFormData = z.infer<typeof goalFormSchema>;

// -------------------- Types --------------------
interface Goal {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate?: string | null;
}

interface GoalFormProps {
  onClose?: () => void;
  goalId?: string;
}

// -------------------- Component --------------------
export default function GoalForm({ onClose, goalId }: GoalFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: goal } = useQuery<Goal>({
    queryKey: ["/api/savings-goals", goalId],
    enabled: !!goalId,
  });

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: "",
      targetAmount: "",
      currentAmount: "0",
      targetDate: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      const goalData = {
        name: data.name,
        targetAmount: parseFloat(data.targetAmount).toString(),
        currentAmount: data.currentAmount
          ? parseFloat(data.currentAmount).toString()
          : "0",
        targetDate: data.targetDate?.toISOString() || null,
      };

      if (goalId) {
        return apiRequest("PUT", `/api/savings-goals/${goalId}`, goalData);
      } else {
        return apiRequest("POST", "/api/savings-goals", goalData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-goals"] });
      toast({
        title: goalId ? "Goal updated" : "Goal created",
        description: `Savings goal has been successfully ${
          goalId ? "updated" : "created"
        }`,
      });
      onClose?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.message ||
          `Failed to ${goalId ? "update" : "create"} savings goal`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GoalFormData) => {
    createMutation.mutate(data);
  };

  // Set form values when editing
  React.useEffect(() => {
    if (goal && goalId) {
      form.reset({
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        targetDate: goal.targetDate ? new Date(goal.targetDate) : undefined,
      });
    }
  }, [goal, goalId, form]);

  const currentAmount = parseFloat(form.watch("currentAmount") || "0");
  const targetAmount = parseFloat(form.watch("targetAmount") || "0");
  const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="goal-form">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {goalId ? "Edit Savings Goal" : "Create Savings Goal"}
        </CardTitle>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="close-goal-form"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Goal Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Emergency Fund, Vacation, New Car"
                      {...field}
                      data-testid="goal-name-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Amount */}
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      {...field}
                      data-testid="goal-target-amount-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Current Amount */}
            <FormField
              control={form.control}
              name="currentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      {...field}
                      data-testid="goal-current-amount-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Date */}
            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Target Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          data-testid="goal-target-date-input"
                        >
                          {field.value ? (
                            format(field.value, "MMM dd, yyyy")
                          ) : (
                            <span>Pick a target date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Progress Preview */}
            {targetAmount > 0 && (
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
                  <span>${currentAmount.toFixed(2)}</span>
                  <span>${targetAmount.toFixed(2)}</span>
                </div>
                {progress >= 100 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                    🎉 Goal achieved!
                  </p>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={createMutation.isPending}
                data-testid="submit-goal-form"
              >
                {createMutation.isPending
                  ? goalId
                    ? "Updating..."
                    : "Creating..."
                  : goalId
                  ? "Update Goal"
                  : "Create Goal"}
              </Button>
              {onClose && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  data-testid="cancel-goal-form"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
