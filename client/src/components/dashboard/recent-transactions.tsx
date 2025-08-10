import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button"; // Import Button component
import { 
  Utensils, 
  Car, 
  Gamepad2, 
  ShoppingCart, 
  PlusCircle,
  Circle,
  Plus // Import Plus icon
} from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  amount: string;
  date: string;
  type: "income" | "expense";
  categoryId?: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading: boolean;
  onAddTransactionClick: () => void; // New prop for the add transaction button click
}

const categoryIcons: Record<string, any> = {
  "cat-1": Utensils,
  "cat-2": Car,
  "cat-3": Gamepad2,
  "cat-4": ShoppingCart,
  "cat-5": PlusCircle,
};

const categoryColors: Record<string, string> = {
  "cat-1": "bg-blue-500/10 text-blue-600",
  "cat-2": "bg-green-500/10 text-green-600",
  "cat-3": "bg-yellow-500/10 text-yellow-600",
  "cat-4": "bg-red-500/10 text-red-600",
  "cat-5": "bg-emerald-500/10 text-emerald-600",
};

export default function RecentTransactions({ transactions, isLoading, onAddTransactionClick }: RecentTransactionsProps) {
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800" data-testid="recent-transactions-loading">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
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
    <Card className="bg-white dark:bg-gray-800" data-testid="recent-transactions">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <div className="flex items-center gap-2"> {/* Container for buttons/links */}
          <Link href="/transactions">
            <a className="text-primary text-sm font-medium hover:underline" data-testid="view-all-transactions">
              View All
            </a>
          </Link>
          {/* New Add Transaction button */}
          <Button 
            size="sm" 
            onClick={onAddTransactionClick} 
            className="flex items-center gap-1"
            data-testid="add-transaction-button-recent"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const Icon = categoryIcons[transaction.categoryId || ""] || Circle;
              const colorClass = categoryColors[transaction.categoryId || ""] || "bg-gray-500/10 text-gray-600";
              
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  data-testid={`transaction-${transaction.id}`}
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center mr-3`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium" data-testid={`transaction-description-${transaction.id}`}>
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400" data-testid={`transaction-date-${transaction.id}`}>
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <span 
                    className={`text-sm font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                    data-testid={`transaction-amount-${transaction.id}`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8" data-testid="no-transactions">
            <p className="text-gray-500 dark:text-gray-400">No transactions yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Upload a CSV file or add transactions manually</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
