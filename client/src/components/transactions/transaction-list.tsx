import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  description: string;
  amount: string;
  date: string;
  type: "income" | "expense";
  categoryId?: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  title?: string;
  showAddButton?: boolean;
  maxItems?: number;
}

export default function TransactionList({ 
  transactions, 
  categories, 
  title = "Transactions",
  showAddButton = true,
  maxItems 
}: TransactionListProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      toast({
        title: "Transaction deleted",
        description: "Transaction has been successfully deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryName = (categoryId?: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  const displayTransactions = maxItems ? transactions.slice(0, maxItems) : transactions;

  return (
    <Card className="bg-white dark:bg-gray-800" data-testid="transaction-list">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title} ({transactions.length})</CardTitle>
        {showAddButton && (
          <Button size="sm" data-testid="add-transaction-button">
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {displayTransactions.length > 0 ? (
          <div className="space-y-2">
            {displayTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors group border border-gray-200 dark:border-gray-600"
                data-testid={`transaction-item-${transaction.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium" data-testid={`transaction-description-${transaction.id}`}>
                      {transaction.description}
                    </p>
                    <Badge 
                      variant={transaction.type === 'income' ? 'default' : 'secondary'}
                      className={`text-xs ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                      data-testid={`transaction-type-${transaction.id}`}
                    >
                      {transaction.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span data-testid={`transaction-date-${transaction.id}`}>
                      {formatDate(transaction.date)}
                    </span>
                    <span data-testid={`transaction-category-${transaction.id}`}>
                      {getCategoryName(transaction.categoryId)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span 
                    className={`text-lg font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                    data-testid={`transaction-amount-${transaction.id}`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </span>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      data-testid={`edit-transaction-${transaction.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteMutation.mutate(transaction.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`delete-transaction-${transaction.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {maxItems && transactions.length > maxItems && (
              <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Showing {maxItems} of {transactions.length} transactions
                </p>
                <Button variant="outline" size="sm" data-testid="view-all-transactions">
                  View All Transactions
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12" data-testid="no-transactions">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No transactions found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Upload a CSV file or add transactions manually to get started
            </p>
            <Button data-testid="add-first-transaction">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Transaction
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
