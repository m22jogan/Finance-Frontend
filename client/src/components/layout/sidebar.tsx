import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  CreditCard,
  PiggyBank,
  Upload,
  Wallet,
  BarChart,
  User,
  Tags, // ✅ New icon
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Transactions", href: "/transactions", icon: CreditCard },
  { name: "Budgets", href: "/budgets", icon: Wallet },
  { name: "Savings Goals", href: "/savings", icon: PiggyBank },
  { name: "Upload CSV", href: "/upload", icon: Upload },
  { name: "Reports", href: "/reports", icon: BarChart },
  { name: "Categories", href: "/categories", icon: Tags }, // ✅ New nav item
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, loading } = useAuth();
  const { email } = user || {};

  const userName = email?.split("@")[0] || "User";

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center h-20 px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-primary">Plex</h1>
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

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
            <User className="h-5 w-5" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium" data-testid="user-name">
              {userName}
            </p>
            <p className="text-xs text-gray-500" data-testid="user-email">
              {email}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
