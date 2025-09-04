// src/App.tsx
import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "./hooks/use-auth";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Import all pages
import Dashboard from "@/pages/dashboard";
import LoginPage from "@/pages/login";
import Transactions from "@/pages/transactions";
import Budgets from "@/pages/budgets";
import Savings from "@/pages/savings";
import Upload from "@/pages/upload";
import Reports from "@/pages/reports";
import Categories from "@/pages/categories";
import NotFound from "@/pages/not-found";

// Layout components
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

function Router() {
  const { user, loading } = useAuth();

  // Show spinner while fetching user
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-lg">
        Loading...
      </div>
    );
  }

  // Not logged in → redirect everything to /login except /login itself
  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/:rest*">
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  // Logged in → render dashboard layout + routes
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/" component={() => <Redirect to="/dashboard" />} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/transactions" component={Transactions} />
            <Route path="/budgets" component={Budgets} />
            <Route path="/savings" component={Savings} />
            <Route path="/upload" component={Upload} />
            <Route path="/reports" component={Reports} />
            <Route path="/categories" component={Categories} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
