import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Bell, Moon, Sun, Menu } from "lucide-react";
import { useState, useEffect } from "react";

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
    localStorage.setItem("darkMode", newTheme.toString());
    if (newTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const pageName = pageNames[location] || "Dashboard";

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="md:hidden mr-4" data-testid="mobile-menu-toggle">
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold" data-testid="page-title">{pageName}</h2>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative" 
            data-testid="notifications-button"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            data-testid="theme-toggle"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
