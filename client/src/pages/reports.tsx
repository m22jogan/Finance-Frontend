import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

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

export default function Reports() {
  const [timeRange, setTimeRange] = useState("6months");
  const [reportType, setReportType] = useState("spending-trends");

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/v1/transactions"],
    select: (data) => {
      // Transform the data to handle potential field name variations from backend
      return data.map(transaction => ({
        ...transaction,
        // Ensure we have categoryId field (handle category_id from backend)
        categoryId: transaction.categoryId || (transaction as any).category_id,
        // Ensure we have proper type conversion if needed
        amount: typeof transaction.amount === 'string' ? transaction.amount : String(transaction.amount),
      }));
    }
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/v1/categories"],
  });

  const { data: summary } = useQuery<Category[]>({
    queryKey: ["/api/v1/analytics/summary"],
  });

  // Debug logging to understand data structure in reports
  useEffect(() => {
    if (transactions.length > 0 && categories.length > 0) {
      console.log('=== REPORTS DEBUG INFO ===');
      console.log('Sample transaction in reports:', transactions[0]);
      console.log('Available categories in reports:', categories.map(cat => ({ id: cat.id, name: cat.name, color: cat.color })));
      
      // Check for transactions with categories
      const transactionsWithCategories = transactions.filter(t => t.categoryId);
      console.log('Transactions with categories in reports:', transactionsWithCategories.length);
      
      if (transactionsWithCategories.length > 0) {
        const sampleWithCategory = transactionsWithCategories[0];
        const foundCategory = categories.find(cat => cat.id === sampleWithCategory.categoryId);
        console.log('Sample transaction with category in reports:', {
          id: sampleWithCategory.id,
          categoryId: sampleWithCategory.categoryId,
          foundCategory: foundCategory
        });
      }
      
      console.log('=== END REPORTS DEBUG INFO ===');
    }
  }, [transactions, categories]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTimeRangeData = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "1month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "3months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case "6months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
      case "1year":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    }

    return transactions.filter((tx: Transaction) => new Date(tx.date) >= startDate);
  }, [transactions, timeRange]);

  const monthlyTrends = useMemo(() => {
    const monthlyData: Record<string, { income: number; expenses: number; month: string }> = {};

    getTimeRangeData.forEach((tx: Transaction) => {
      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0, month: monthName };
      }

      const amount = parseFloat(tx.amount);
      if (tx.type === 'income') {
        monthlyData[monthKey].income += amount;
      } else {
        monthlyData[monthKey].expenses += amount;
      }
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }, [getTimeRangeData]);

  const categoryBreakdown = useMemo(() => {
    const categoryData: Record<string, { name: string; amount: number; color: string }> = {};

    console.log('Building category breakdown...', {
      transactionsCount: getTimeRangeData.length,
      categoriesCount: categories.length
    });

    getTimeRangeData.forEach((tx: Transaction) => {
      if (tx.type === 'expense') {
        // Handle both categoryId and category_id fields
        const transactionCategoryId = tx.categoryId || (tx as any).category_id;
        
        console.log('Processing expense transaction:', {
          id: tx.id,
          categoryId: transactionCategoryId,
          amount: tx.amount
        });
        
        const category = categories.find((cat: Category) => cat.id === transactionCategoryId);
        const categoryName = category?.name || 'Uncategorized';
        const categoryColor = category?.color || '#6B7280';

        console.log('Found category for transaction:', {
          transactionCategoryId,
          foundCategory: category,
          categoryName,
          categoryColor
        });

        if (!categoryData[categoryName]) {
          categoryData[categoryName] = { name: categoryName, amount: 0, color: categoryColor };
        }

        categoryData[categoryName].amount += parseFloat(tx.amount);
      }
    });

    const result = Object.values(categoryData).sort((a, b) => b.amount - a.amount);
    console.log('Final category breakdown:', result);
    return result;
  }, [getTimeRangeData, categories]);

  const weeklySpending = useMemo(() => {
    const weeklyData: Record<string, number> = {};

    getTimeRangeData.forEach((tx: Transaction) => {
      if (tx.type === 'expense') {
        const date = new Date(tx.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];

        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + parseFloat(tx.amount);
      }
    });

    return Object.entries(weeklyData)
      .map(([week, amount]) => ({
        week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount
      }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [getTimeRangeData]);

  const calculateGrowthRate = () => {
    if (monthlyTrends.length < 2) return 0;
    const latest = monthlyTrends[monthlyTrends.length - 1];
    const previous = monthlyTrends[monthlyTrends.length - 2];
    const latestNet = latest.income - latest.expenses;
    const previousNet = previous.income - previous.expenses;
    
    if (previousNet === 0) return 0;
    return ((latestNet - previousNet) / Math.abs(previousNet)) * 100;
  };

  const growthRate = calculateGrowthRate();

  // Show loading state while either transactions or categories are loading
  if (transactionsLoading || categoriesLoading) {
    return (
      <div className="p-6" data-testid="reports-loading">
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="reports-page">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40" data-testid="time-range-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-48" data-testid="report-type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spending-trends">Spending Trends</SelectItem>
              <SelectItem value="income-analysis">Income Analysis</SelectItem>
              <SelectItem value="category-breakdown">Category Breakdown</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Debug info - remove this section once the issue is resolved */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Reports Debug Info (Development Only):</h3>
            <div className="text-sm space-y-1">
              <p>Total Transactions: {transactions.length}</p>
              <p>Filtered Transactions (Time Range): {getTimeRangeData.length}</p>
              <p>Total Categories: {categories.length}</p>
              <p>Category Breakdown Items: {categoryBreakdown.length}</p>
              <p>Transactions with Categories: {transactions.filter(t => t.categoryId).length}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white dark:bg-gray-800" data-testid="total-transactions-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Transactions
                </p>
                <p className="text-2xl font-bold" data-testid="total-transactions-count">
                  {getTimeRangeData.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800" data-testid="avg-monthly-spending-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Monthly Spending
                </p>
                <p className="text-2xl font-bold" data-testid="avg-monthly-spending">
                  {formatCurrency(
                    monthlyTrends.length > 0 
                      ? monthlyTrends.reduce((sum, month) => sum + month.expenses, 0) / monthlyTrends.length
                      : 0
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800" data-testid="financial-growth-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Financial Growth
                </p>
                <p className="text-2xl font-bold" data-testid="financial-growth-rate">
                  {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
                </p>
              </div>
              <div className={`w-12 h-12 ${growthRate >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'} rounded-lg flex items-center justify-center`}>
                {growthRate >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card className="bg-white dark:bg-gray-800" data-testid="monthly-trends-chart">
          <CardHeader>
            <CardTitle>Monthly Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="bg-white dark:bg-gray-800" data-testid="category-breakdown-chart">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Spending Trend */}
        <Card className="bg-white dark:bg-gray-800" data-testid="weekly-spending-chart">
          <CardHeader>
            <CardTitle>Weekly Spending Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklySpending}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Summary Table */}
        <Card className="bg-white dark:bg-gray-800" data-testid="category-summary-table">
          <CardHeader>
            <CardTitle>Category Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {categoryBreakdown.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No expense data available for the selected time range.
                </div>
              ) : (
                categoryBreakdown.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium" data-testid={`category-name-${index}`}>
                        {category.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold" data-testid={`category-amount-${index}`}>
                        {formatCurrency(category.amount)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {((category.amount / categoryBreakdown.reduce((sum, cat) => sum + cat.amount, 0)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
