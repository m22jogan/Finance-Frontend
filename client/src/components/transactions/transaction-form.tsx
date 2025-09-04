// src/components/transactions/transaction-form.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@shared/schema";

interface TransactionFormProps {
  onSave: () => void;
  onCancel: () => void;
  initialData?: any; // Optional for editing
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSave, onCancel, initialData }) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [type, setType] = useState(initialData?.type || 'expense'); // 'income' or 'expense'
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || ''); // store ID
  const [date, setDate] = useState(
    initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );

  const { toast } = useToast();

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/v1/categories"],
  });

  // Mutation for adding a new transaction
  const addTransactionMutation = useMutation({
    mutationFn: async (newTransaction: Omit<any, 'id'>) => apiRequest('POST', '/api/v1/transactions', newTransaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/analytics/summary"] });
      toast({ title: "Transaction added", description: "New transaction has been successfully recorded." });
      onSave();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add transaction.", variant: "destructive" });
    },
  });

  // Mutation for editing an existing transaction
  const updateTransactionMutation = useMutation({
    mutationFn: async (updatedTransaction: any) => 
      apiRequest('PUT', `/api/v1/transactions/${updatedTransaction.id}`, updatedTransaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/analytics/summary"] });
      toast({ title: "Transaction updated", description: "Transaction has been successfully updated." });
      onSave();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update transaction.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const transactionData = {
      description,
      amount: parseFloat(amount),
      type,
      category_id: categoryId || null, // send ID or null
      date: new Date(date).toISOString(),
    };

    if (initialData?.id) {
      updateTransactionMutation.mutate({ ...transactionData, id: initialData.id });
    } else {
      addTransactionMutation.mutate(transactionData);
    }
  };

  // Keep selected category name synced with ID for display
  const selectedCategoryName = categoryId ? categories.find(cat => cat.id === categoryId)?.name : "No Category";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <CardTitle>{initialData ? "Edit Transaction" : "Add New Transaction"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue placeholder={selectedCategoryName} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={addTransactionMutation.isPending || updateTransactionMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={addTransactionMutation.isPending || updateTransactionMutation.isPending}
          >
            {initialData ? "Save Changes" : "Add Transaction"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TransactionForm;
