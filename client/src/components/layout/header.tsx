import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Bell, Moon, Sun, Menu, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/budgets": "Budgets",
  "/savings": "Savings Goals",
  "/upload": "Upload CSV",
  "/reports": "Reports",
};

export default function Header() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const darkMode = localStorage.getItem("darkMode") === "true";
    setIsDark(darkMode);
    if (darkMode) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("darkMode", String(newTheme));
    document.documentElement.classList.toggle("dark", newTheme);
  };

  const pageName = pageNames[location] || "Dashboard";

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 h-20 flex items-center justify-between">
      {/* Left side: menu + page title */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-4"
          data-testid="mobile-menu-toggle"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-semibold" data-testid="page-title">
          {pageName}
        </h2>
      </div>

      {/* Right side: user + actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="notifications-button"
        >
          <Bell className="h-5 w-5" />
          {/* You can make this conditional if notifications exist */}
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          data-testid="theme-toggle"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* User Section */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-700 dark:text-gray-200 text-sm hidden sm:inline">
            {user?.email}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            data-testid="logout-button"
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
