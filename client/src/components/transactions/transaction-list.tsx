import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction, Category } from "@shared/schema";

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  isDeleting?: boolean;
}

// Enhanced function to get category name with debugging and better error handling
function getCategoryName(categoryId: string | undefined, categories: Category[]): string {
  // Debug logging - remove these console.logs once issue is resolved
  console.log('getCategoryName called with:', { 
    categoryId, 
    categoryIdType: typeof categoryId,
    categoriesLength: categories?.length 
  });
  
  // Handle edge cases
  if (!categories || categories.length === 0) {
    console.warn('No categories available');
    return "Uncategorized";
  }
  
  if (!categoryId || categoryId === '' || categoryId === 'null' || categoryId === 'undefined') {
    console.log('No valid categoryId provided');
    return "Uncategorized";
  }
  
  // Convert to string and normalize for comparison
  const normalizedCategoryId = String(categoryId).trim();
  
  console.log('Looking for category with ID:', normalizedCategoryId);
  console.log('Available category IDs:', categories.map(cat => ({ id: cat.id, name: cat.name })));
  
  // Try to find the category
  const foundCategory = categories.find((cat) => {
    const normalizedCatId = String(cat.id).trim();
    return normalizedCatId === normalizedCategoryId;
  });
  
  if (foundCategory) {
    console.log('Found category:', foundCategory.name);
    return foundCategory.name;
  } else {
    console.warn(`Category not found for ID: ${categoryId}`, {
      searchedFor: normalizedCategoryId,
      availableIds: categories.map(cat => cat.id)
    });
    return "Uncategorized";
  }
}

export default function TransactionList({
  transactions,
  isLoading,
  categories,
  onDelete,
  onEdit,
  isDeleting,
}: TransactionListProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();

  // Debug logging to understand the data structure
  useEffect(() => {
    if (transactions.length > 0) {
      console.log('Sample transaction structure:', transactions[0]);
      console.log('Sample transaction keys:', Object.keys(transactions[0]));
      
      // Check specifically for category field variations
      const sampleTx = transactions[0];
      console.log('Category field variations in transaction:', {
        categoryId: sampleTx.categoryId,
        category_id: (sampleTx as any).category_id,
        category: (sampleTx as any).category
      });
    }
    
    if (categories.length > 0) {
      console.log('Available categories:', categories.map(cat => ({ id: cat.id, name: cat.name })));
    }
  }, [transactions, categories]);

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800" data-testid="transaction-list-loading">
        <CardHeader>
          <CardTitle className="text-lg">All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading if categories haven't loaded yet
  if (!categories || categories.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-800" data-testid="transaction-list-loading-categories">
        <CardHeader>
          <CardTitle className="text-lg">All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Loading categories...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800" data-testid="transaction-list">
      <CardHeader>
        <CardTitle className="text-lg">All Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8" data-testid="no-transactions-list">
            <p className="text-gray-500 dark:text-gray-400">No transactions found.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {transactions.map((tx) => {
              // Handle potential field name variations from backend
              const categoryId = tx.categoryId || (tx as any).category_id;
              const categoryName = getCategoryName(categoryId, categories);
              
              return (
                <li
                  key={tx.id}
                  className="flex items-center justify-between border-b pb-2"
                  data-testid={`transaction-item-${tx.id}`}
                >
                  <div>
                    <p className="font-semibold" data-testid={`transaction-item-description-${tx.id}`}>
                      {tx.description}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`transaction-item-details-${tx.id}`}>
                      {formatDate(tx.date)} — {categoryName}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant={tx.type === 'income' ? 'default' : 'secondary'}
                      className={`${tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} dark:${tx.type === 'income' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}
                      data-testid={`transaction-item-amount-${tx.id}`}
                    >
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(tx)}
                      data-testid={`transaction-item-edit-${tx.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedTransaction(tx)}
                          data-testid={`transaction-item-delete-trigger-${tx.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <div className="flex flex-col gap-4">
                          <p>
                            Are you sure you want to delete{" "}
                            <strong>{selectedTransaction?.description}</strong>?
                          </p>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => setSelectedTransaction(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                if (selectedTransaction) {
                                  onDelete(selectedTransaction.id);
                                  setSelectedTransaction(null);
                                }
                              }}
                              disabled={isDeleting}
                            >
                              {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
