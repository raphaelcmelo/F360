import {
  Table,
  Text,
  Badge,
  Skeleton,
  Modal,
  Stack,
  Group,
  Divider,
  Button,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconInfoCircle } from "@tabler/icons-react";
import { Transaction } from "../../../types/transaction";
import { formatCurrency } from "../../../utils/format";
import { useState } from "react";

interface RecentTransactionsTableProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export default function RecentTransactionsTable({
  transactions,
  isLoading,
}: RecentTransactionsTableProps) {
  const [
    detailsModalOpened,
    { open: openDetailsModal, close: closeDetailsModal },
  ] = useDisclosure(false);
  const [selectedTransactionForDetails, setSelectedTransactionForDetails] =
    useState<Transaction | null>(null);

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

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransactionForDetails(transaction);
    openDetailsModal();
  };

  if (isLoading) {
    return <Skeleton height={300} />;
  }

  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 5); // Only show the 5 most recent

  return (
    <>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Data</Table.Th>
            <Table.Th>Categoria</Table.Th>
            <Table.Th>Tipo</Table.Th>
            <Table.Th>Descrição</Table.Th>
            <Table.Th style={{ textAlign: "right" }}>Valor</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sortedTransactions.length > 0 ? (
            sortedTransactions.map((transaction) => (
              <Table.Tr
                key={transaction._id}
                onClick={() => handleRowClick(transaction)}
                style={{ cursor: "pointer" }}
              >
                <Table.Td>{formatDate(transaction.data)}</Table.Td>
                <Table.Td>
                  <Badge color={getCategoryColor(transaction.categoria)}>
                    {getCategoryLabel(transaction.categoria)}
                  </Badge>
                </Table.Td>
                <Table.Td>{transaction.tipo}</Table.Td>
                <Table.Td>{transaction.description}</Table.Td>
                <Table.Td style={{ textAlign: "right" }}>
                  <Text fw={500} c={getCategoryColor(transaction.categoria)}>
                    {formatCurrency(transaction.valor)}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={5} style={{ textAlign: "center" }}>
                <Text c="dimmed">Nenhuma transação encontrada</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      {/* Transaction Details Modal */}
      <Modal
        opened={detailsModalOpened}
        onClose={closeDetailsModal}
        title={
          <Group gap="xs">
            <IconInfoCircle size={20} />
            <Text fw={700}>Detalhes do Lançamento</Text>
          </Group>
        }
        size="md"
        centered
      >
        {selectedTransactionForDetails && (
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={500}>Data:</Text>
              <Text>
                {new Date(
                  selectedTransactionForDetails.data
                ).toLocaleDateString("pt-BR")}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Categoria:</Text>
              <Badge
                color={getCategoryColor(
                  selectedTransactionForDetails.categoria
                )}
              >
                {getCategoryLabel(selectedTransactionForDetails.categoria)}
              </Badge>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Tipo:</Text>
              <Text>{selectedTransactionForDetails.tipo}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Valor:</Text>
              <Text
                fw={500}
                c={getCategoryColor(selectedTransactionForDetails.categoria)}
              >
                {formatCurrency(selectedTransactionForDetails.valor)}
              </Text>
            </Group>
            <Group justify="space-between" align="flex-start">
              <Text fw={500}>Descrição:</Text>
              <Text style={{ maxWidth: "70%", textAlign: "right" }}>
                {selectedTransactionForDetails.description || "N/A"}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Criado por:</Text>
              <Text>{selectedTransactionForDetails.criadoPorNome}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Criado em:</Text>
              <Text>
                {new Date(
                  selectedTransactionForDetails.createdAt
                ).toLocaleString("pt-BR")}
              </Text>
            </Group>
            {selectedTransactionForDetails.updatedAt && (
              <Group justify="space-between">
                <Text fw={500}>Última atualização:</Text>
                <Text>
                  {new Date(
                    selectedTransactionForDetails.updatedAt
                  ).toLocaleString("pt-BR")}
                </Text>
              </Group>
            )}
            <Divider my="sm" />
            <Group justify="flex-end">
              <Button variant="default" onClick={closeDetailsModal}>
                Fechar
              </Button>
              {/* The "Editar" button is a placeholder as editing is not requested for this component */}
              <Button onClick={closeDetailsModal}>Editar</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
