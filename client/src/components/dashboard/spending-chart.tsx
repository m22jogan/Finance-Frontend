import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Define the shape of each spending item
interface SpendingCategory {
  name: string;
  amount: number;
  color: string;
}

export default function SpendingChart() {
  const [period, setPeriod] = useState("this-month");
  
  const { data: spendingData = [], isLoading } = useQuery<SpendingCategory[]>({
    queryKey: ["/api/analytics/spending-by-category", period],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800" data-testid="spending-chart-loading">
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }

  const chartData = spendingData;
  const totalSpending = chartData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="bg-white dark:bg-gray-800" data-testid="spending-chart">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Spending by Category</CardTitle>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36" data-testid="chart-period-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="last-3-months">Last 3 Months</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <>
            <div className="h-64" data-testid="pie-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="amount"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-3" data-testid="chart-legend">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span
                      className="text-sm font-medium"
                      data-testid={`category-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span
                    className="text-sm font-semibold"
                    data-testid={`amount-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-64 flex items-center justify-center" data-testid="no-spending-data">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">No spending data available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Upload transactions to see your spending breakdown
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
