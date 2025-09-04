import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Transaction, Category } from "@shared/schema";
import TransactionForm from "@/components/transactions/transaction-form";
import TransactionList from "@/components/transactions/transaction-list";

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();

  // Fetch all transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/v1/transactions"],
    select: (data) => {
      // Transform the data to handle potential field name variations from backend
      return data.map(transaction => ({
        ...transaction,
        // Ensure we have categoryId field (handle category_id from backend)
        categoryId: transaction.categoryId || (transaction as any).category_id,
        // Ensure we have proper type conversion if needed
        amount: typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount,
      }));
    }
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/v1/categories"],
  });

  // Debug logging to understand data structure
  useEffect(() => {
    if (transactions.length > 0 && categories.length > 0) {
      console.log('=== DEBUGGING TRANSACTION CATEGORIES ===');
      console.log('Sample raw transaction from API:', transactions[0]);
      console.log('Available categories:', categories.map(cat => ({ id: cat.id, name: cat.name })));
      
      // Check for transactions with categories
      const transactionsWithCategories = transactions.filter(t => t.categoryId || (t as any).category_id);
      console.log('Transactions with categories:', transactionsWithCategories.length);
      
      if (transactionsWithCategories.length > 0) {
        const sampleWithCategory = transactionsWithCategories[0];
        console.log('Sample transaction with category:', {
          id: sampleWithCategory.id,
          description: sampleWithCategory.description,
          categoryId: sampleWithCategory.categoryId,
          category_id: (sampleWithCategory as any).category_id
        });
        
        // Try to find the category for this transaction
        const categoryId = sampleWithCategory.categoryId || (sampleWithCategory as any).category_id;
        const foundCategory = categories.find(cat => cat.id === categoryId);
        console.log('Found category for sample transaction:', foundCategory);
      }
      
      console.log('=== END DEBUG INFO ===');
    }
  }, [transactions, categories]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/v1/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/analytics/summary"] });
      toast({
        title: "Transaction deleted",
        description: "Transaction has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete transaction.",
        variant: "destructive",
      });
    },
  });

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    
    // Handle category filtering with both possible field names
    const transactionCategoryId = transaction.categoryId || (transaction as any).category_id;
    const matchesCategory = categoryFilter === "all" || transactionCategoryId === categoryFilter;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const handleEditTransaction = (transaction: Transaction) => {
    // Ensure the transaction has the correct categoryId field for editing
    const normalizedTransaction = {
      ...transaction,
      categoryId: transaction.categoryId || (transaction as any).category_id,
    };
    setEditingTransaction(normalizedTransaction);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  // Show loading state while either transactions or categories are loading
  if (transactionsLoading || categoriesLoading) {
    return (
      <div className="p-6" data-testid="transactions-loading-page">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Card>
            <CardContent className="p-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="transactions-page">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <Button 
          data-testid="add-transaction-button"
          onClick={() => {
            setEditingTransaction(null);
            setIsFormOpen(true);
          }} 
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-transactions"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-32" data-testid="type-filter">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40" data-testid="category-filter">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category: Category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Debug info - remove this section once the issue is resolved */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Debug Info (Development Only):</h3>
            <div className="text-sm space-y-1">
              <p>Total Transactions: {transactions.length}</p>
              <p>Total Categories: {categories.length}</p>
              <p>Filtered Transactions: {filteredTransactions.length}</p>
              <p>Transactions with Categories: {transactions.filter(t => t.categoryId || (t as any).category_id).length}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <TransactionList
        transactions={filteredTransactions}
        isLoading={transactionsLoading}
        categories={categories}
        onDelete={deleteMutation.mutate}
        onEdit={handleEditTransaction}
        isDeleting={deleteMutation.isPending}
      />

      {isFormOpen && (
        <TransactionForm 
          onSave={handleFormClose} 
          onCancel={handleFormClose} 
          initialData={editingTransaction}
        />
      )}
    </div>
  );
}
