import { Card, CardContent } from "@/components/ui/card";
import { Wallet, CreditCard, PiggyBank, TrendingUp } from "lucide-react";

interface SavingsGoal {
  id: string;
  name: string;
  progress: number;
}

interface SummaryData {
  totalBalance: number;
  monthlySpending: number;
  savingsProgress: number;
  budgetRemaining: number;
  savingsGoals: SavingsGoal[];
}

interface SummaryCardsProps {
  summary?: SummaryData;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    // This function is fine, the problem is what we pass to it.
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // UPDATED: We now safely handle potentially null/undefined values from the API
  const cards = [
    {
      title: "Total Balance",
      // Use optional chaining (?.) and nullish coalescing (??) for safety
      value: formatCurrency(summary?.totalBalance ?? 0),
      icon: Wallet,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      change: "+2.5%",
      changeText: "from last month",
      changeColor: "text-green-600",
      testId: "total-balance-card"
    },
    {
      title: "Monthly Spending",
      value: formatCurrency(summary?.monthlySpending ?? 0),
      icon: CreditCard,
      iconBg: "bg-red-500/10",
      iconColor: "text-red-500",
      change: "+12.3%",
      changeText: "from last month",
      changeColor: "text-red-500",
      testId: "monthly-spending-card"
    },
    {
      title: "Savings Progress",
      // Special handling for the percentage value
      value: `${summary?.savingsProgress ?? 0}%`,
      icon: PiggyBank,
      iconBg: "bg-green-500/10",
      iconColor: "text-green-500",
      change: "On track",
      changeText: "to reach goals",
      changeColor: "text-green-600",
      testId: "savings-progress-card"
    },
    {
      title: "Budget Remaining",
      value: formatCurrency(summary?.budgetRemaining ?? 0),
      icon: TrendingUp,
      iconBg: "bg-yellow-500/10",
      iconColor: "text-yellow-500",
      change: "54% used",
      changeText: "this month",
      changeColor: "text-yellow-600",
      testId: "budget-remaining-card"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="summary-cards">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="bg-white dark:bg-gray-800" data-testid={card.testId}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid={`${card.testId}-value`}>
                    {card.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${card.changeColor}`}>
                  {card.change}
                </span>
                <span className="text-gray-600 dark:text-gray-400 text-sm ml-2">
                  {card.changeText}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}