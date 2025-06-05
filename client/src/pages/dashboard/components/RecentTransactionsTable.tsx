import { Table, Text, Badge, Skeleton, Group } from "@mantine/core";
import { Transaction } from "../../../types/transaction";

interface RecentTransactionsTableProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export default function RecentTransactionsTable({
  transactions,
  isLoading,
}: RecentTransactionsTableProps) {
  // Helper to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  // Helper to get category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "renda":
        return "green";
      case "despesa":
        return "red";
      case "conta":
        return "orange";
      case "poupanca":
        return "blue";
      default:
        return "gray";
    }
  };

  // Helper to get category label
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "renda":
        return "Receita";
      case "despesa":
        return "Despesa";
      case "conta":
        return "Conta";
      case "poupanca":
        return "Poupança";
      default:
        return category;
    }
  };

  if (isLoading) {
    return <Skeleton height={300} />;
  }

  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 5); // Only show the 5 most recent

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Data</Table.Th>
          <Table.Th>Categoria</Table.Th>
          <Table.Th>Descrição</Table.Th>
          <Table.Th style={{ textAlign: "right" }}>Valor</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {sortedTransactions.length > 0 ? (
          sortedTransactions.map((transaction) => (
            <Table.Tr key={transaction._id}>
              <Table.Td>{formatDate(transaction.data)}</Table.Td>
              <Table.Td>
                <Badge color={getCategoryColor(transaction.categoria)}>
                  {getCategoryLabel(transaction.categoria)}
                </Badge>
              </Table.Td>
              <Table.Td>{transaction.tipo}</Table.Td>
              <Table.Td style={{ textAlign: "right" }}>
                <Text fw={500} c={getCategoryColor(transaction.categoria)}>
                  R${" "}
                  {transaction.valor.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))
        ) : (
          <Table.Tr>
            <Table.Td colSpan={4} style={{ textAlign: "center" }}>
              <Text c="dimmed">Nenhuma transação encontrada</Text>
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
}
