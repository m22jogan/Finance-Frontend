import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "./hooks/use-auth";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Import all your pages
import Dashboard from "@/pages/dashboard";
import LoginPage from "@/pages/login";
import Transactions from "@/pages/transactions";
import Budgets from "@/pages/budgets";
import Savings from "@/pages/savings";
import Upload from "@/pages/upload";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";

// Import layout components
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

// This component handles all routing and conditional rendering
function Router() {
  const { user, loading } = useAuth();

  // Step 3a: Show a loading screen while checking auth status
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // Step 3b: If the user is NOT authenticated, only show the login and not-found pages.
  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        {/* Redirects any other path to the login page */}
        <Route path="/:rest*">
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  // Step 3c: If the user IS authenticated, show the main app layout.
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto">
          <Switch>
            {/* The root path redirects to dashboard if authenticated */}
            <Route path="/">
              <Redirect to="/dashboard" />
            </Route>
            {/* All authenticated routes */}
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/transactions" component={Transactions} />
            <Route path="/budgets" component={Budgets} />
            <Route path="/savings" component={Savings} />
            <Route path="/upload" component={Upload} />
            <Route path="/reports" component={Reports} />
            {/* Catch-all for unknown authenticated routes */}
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

// This component wraps the Router with necessary providers
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