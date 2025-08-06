import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

interface Transaction {
  id: string
  amount: number
  date: string
  description: string
  category_id: number
}

interface Category {
  id: number
  name: string
}

function getCategoryName(categoryId: number, categories: Category[]): string {
  return categories.find((cat) => cat.id === categoryId)?.name || "Uncategorized"
}

export default function TransactionList({
  categories = [],
}: {
  categories: Category[]
}) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      toast({
        title: "Transaction deleted",
        description: "The transaction has been successfully deleted.",
      })
      setSelectedTransaction(null)
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the transaction.",
        variant: "destructive",
      })
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : transactions.length === 0 ? (
          <p>No transactions found.</p>
        ) : (
          <ul className="space-y-4">
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between border-b pb-2"
              >
                <div>
                  <p className="font-semibold">{tx.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(tx.date)} — {getCategoryName(tx.category_id, categories)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{formatCurrency(tx.amount)}</Badge>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedTransaction(tx)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <div className="flex flex-col gap-4">
                        <p>
                          Are you sure you want to delete{" "}
                          <strong>{selectedTransaction?.description}</strong>?
                        </p>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => setSelectedTransaction(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() =>
                              deleteMutation.mutate(selectedTransaction!.id)
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
