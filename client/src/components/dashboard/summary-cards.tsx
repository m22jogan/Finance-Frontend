import { Card, CardContent } from "@/components/ui/card";
import { Wallet, CreditCard, PiggyBank, TrendingUp } from "lucide-react";

interface SummaryData {
  totalBalance: number;
  monthlySpending: number;
  savingsProgress: number;
  budgetRemaining: number;
}

interface SummaryCardsProps {
  summary?: SummaryData;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const cards = [
    {
      title: "Total Balance",
      value: summary ? formatCurrency(summary.totalBalance) : "$0.00",
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
      value: summary ? formatCurrency(summary.monthlySpending) : "$0.00",
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
      value: summary ? `${summary.savingsProgress}%` : "0%",
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
      value: summary ? formatCurrency(summary.budgetRemaining) : "$0.00",
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
