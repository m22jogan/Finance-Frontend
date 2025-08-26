import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  CreditCard,
  PiggyBank,
  Upload,
  Wallet,
  BarChart,
  Tags,
  Currency, // <-- Add this import
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Transactions", href: "/transactions", icon: CreditCard },
  { name: "Budgets", href: "/budgets", icon: Wallet },
  { name: "Savings Goals", href: "/savings", icon: PiggyBank },
  { name: "Upload CSV", href: "/upload", icon: Upload },
  { name: "Reports", href: "/reports", icon: BarChart },
  { name: "Categories", href: "/categories", icon: Tags },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center h-20 px-6 border-b border-gray-200 dark:border-gray-700">
        <Currency className="h-8 w-8 text-primary mr-2" /> {/* <-- Add this line */}
        <h1 className="text-4xl logo-font text-primary">Plex</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "text-white bg-primary"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </a>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
