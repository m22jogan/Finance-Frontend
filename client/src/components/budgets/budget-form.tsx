import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// ---------------- SCHEMA ----------------
const budgetFormSchema = z
  .object({
    name: z.string().min(1, "Budget name is required"),
    amount: z
      .string()
      .min(1, "Amount is required")
      .refine(
        (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
        "Amount must be a positive number"
      ),
    categoryId: z.string().optional(),
    period: z.enum(["monthly", "yearly"]),
    startDate: z.date(),
    endDate: z.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

type BudgetFormData = z.infer<typeof budgetFormSchema>;

interface Category {
  id: string;
  name: string;
}

interface Budget {
  id: string;
  name: string;
  amount: string;
  categoryId?: string;
  period: "monthly" | "yearly";
  startDate: string;
  endDate: string;
}

interface BudgetFormProps {
  onClose?: () => void;
  budgetId?: string;
}

// ---------------- COMPONENT ----------------
export default function BudgetForm({ onClose, budgetId }: BudgetFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Typed categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/v1/categories"],
  });

  // Typed budget
  const { data: budget } = useQuery<Budget>({
    queryKey: ["/api/v1/budgets", budgetId],
    enabled: !!budgetId,
  });

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      name: "",
      amount: "",
      categoryId: "",
      period: "monthly",
      startDate: new Date(),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      const budgetData = {
        ...data,
        amount: parseFloat(data.amount).toString(),
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
      };

      if (budgetId) {
        return apiRequest("PUT", `/api/v1/budgets/${budgetId}`, budgetData);
      } else {
        return apiRequest("POST", "/api/v1/budgets", budgetData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/budgets"] });
      toast({
        title: budgetId ? "Budget updated" : "Budget created",
        description: `Budget has been successfully ${
          budgetId ? "updated" : "created"
        }`,
      });
      onClose?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.message || `Failed to ${budgetId ? "update" : "create"} budget`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BudgetFormData) => {
    createMutation.mutate(data);
  };

  // Set form values when editing
  useEffect(() => {
    if (budget && budgetId) {
      form.reset({
        name: budget.name,
        amount: budget.amount,
        categoryId: budget.categoryId || "",
        period: budget.period,
        startDate: new Date(budget.startDate),
        endDate: new Date(budget.endDate),
      });
    }
  }, [budget, budgetId, form]);

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="budget-form">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{budgetId ? "Edit Budget" : "Create Budget"}</CardTitle>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="close-budget-form"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Budget Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Monthly Food Budget"
                      {...field}
                      data-testid="budget-name-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      {...field}
                      data-testid="budget-amount-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="budget-category-select">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No specific category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Period */}
            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Period</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="budget-period-select">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="budget-start-date-input"
                          >
                            {field.value
                              ? format(field.value, "MMM dd, yyyy")
                              : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="budget-end-date-input"
                          >
                            {field.value
                              ? format(field.value, "MMM dd, yyyy")
                              : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={createMutation.isPending}
                data-testid="submit-budget-form"
              >
                {createMutation.isPending
                  ? budgetId
                    ? "Updating..."
                    : "Creating..."
                  : budgetId
                  ? "Update Budget"
                  : "Create Budget"}
              </Button>
              {onClose && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  data-testid="cancel-budget-form"
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
