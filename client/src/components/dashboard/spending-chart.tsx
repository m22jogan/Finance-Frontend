// spending-chart.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp } from "lucide-react";

// Define the shape of each spending item
interface SpendingCategory {
  name: string;
  amount: number;
  color: string;
}

interface SpendingChartProps {
  chartData: SpendingCategory[];
  isLoading: boolean;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

export default function SpendingChart({ 
  chartData = [], 
  isLoading, 
  selectedPeriod, 
  onPeriodChange 
}: SpendingChartProps) {
  const [showAllCategories, setShowAllCategories] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(value)); // Ensure value is a number
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

  // Filter out any invalid data items before processing.
  const validChartData = chartData.filter(item => 
    item && 
    item.name && 
    typeof item.name === 'string' && 
    item.amount !== undefined && 
    item.amount > 0
  );
  
  const totalSpending = validChartData.reduce((sum, item) => sum + item.amount, 0);

  // Determine which categories to show
  const categoriesToShow = showAllCategories ? validChartData : validChartData.slice(0, 3);
  const hasMoreCategories = validChartData.length > 3;

  return (
    <Card className="bg-white dark:bg-gray-800" data-testid="spending-chart">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Spending by Category</CardTitle>
        <Select value={selectedPeriod} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[180px]" data-testid="time-period-select">
            <SelectValue placeholder="Select a period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="this-year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {validChartData.length > 0 ? (
          <>
            <div className="h-64" data-testid="spending-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={validChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {validChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-sm font-medium mt-4" data-testid="total-spending">
              Total Spending: {formatCurrency(totalSpending)}
            </p>
            <div className="mt-6 space-y-3" data-testid="chart-legend">
              {categoriesToShow.map((item, index) => (
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
              
              {hasMoreCategories && (
                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    className="w-full flex items-center justify-center gap-2 text-sm"
                    data-testid="toggle-categories-button"
                  >
                    {showAllCategories ? (
                      <>
                        Show Less
                        <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Show More ({validChartData.length - 3} more)
                        <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
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
