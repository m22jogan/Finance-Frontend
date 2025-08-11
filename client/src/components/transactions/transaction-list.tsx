import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react"; // Added Edit icon for consistency
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton"; // Added Skeleton for consistency
import { formatCurrency, formatDate } from "@/lib/utils"; // Assuming these are utility functions
import type { Transaction, Category } from "@shared/schema"; // Use shared schema types

interface TransactionListProps {
  transactions: Transaction[]; // Transactions will now be passed as a prop
  isLoading: boolean; // Loading state will be passed as a prop
  categories: Category[]; // Categories will be passed as a prop
  onDelete: (id: string) => void; // Function to handle delete passed from parent
  onEdit: (transaction: Transaction) => void; // Function to handle edit passed from parent
  isDeleting?: boolean; // Optional prop to show deleting state
}

// Function to get category name (remains the same)
function getCategoryName(categoryId: string | undefined, categories: Category[]): string {
  // Ensure categoryId is a string for comparison if it's coming from `Transaction` (which is string)
  return categories.find((cat) => cat.id === categoryId)?.name || "Uncategorized";
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

  // Removed useQuery for transactions as data comes from props
  // Removed useMutation for delete as mutation handler comes from props

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
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between border-b pb-2"
                data-testid={`transaction-item-${tx.id}`}
              >
                <div>
                  <p className="font-semibold" data-testid={`transaction-item-description-${tx.id}`}>{tx.description}</p>
                  <p className="text-sm text-muted-foreground" data-testid={`transaction-item-details-${tx.id}`}>
                    {formatDate(tx.date)} — {getCategoryName(tx.categoryId, categories)}
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
                    onClick={() => onEdit(tx)} // Call onEdit prop
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
                                onDelete(selectedTransaction.id); // Call onDelete prop
                                setSelectedTransaction(null); // Close dialog
                              }
                            }}
                            disabled={isDeleting} // Disable if parent is already deleting
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
