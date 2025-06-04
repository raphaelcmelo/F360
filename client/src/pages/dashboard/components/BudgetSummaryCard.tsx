import { Card, Text, Group, Skeleton } from "@mantine/core";
import { Transaction } from "../../../types/transaction";
import { Budget } from "../../../types/budget"; // Import Budget type
import { formatCurrency } from "../../../utils/format";

interface BudgetSummaryCardProps {
  title: string;
  type: "renda" | "despesa" | "conta" | "poupanca";
  budget: Budget | null; // Now includes planned totals
  transactions: Transaction[];
  isLoading: boolean;
}

export default function BudgetSummaryCard({
  title,
  type,
  budget,
  transactions,
  isLoading,
}: BudgetSummaryCardProps) {
  const totalActual = transactions
    .filter((t) => t.categoria === type)
    .reduce((sum, t) => sum + t.valor, 0);

  // Dynamically access the correct planned total from the budget object
  const totalPlanned = budget
    ? budget[`total${type.charAt(0).toUpperCase() + type.slice(1)}Planejado`] ||
      0
    : 0;

  const isOverBudget =
    type === "despesa" || type === "conta" ? totalActual > totalPlanned : false;
  const isUnderBudget =
    type === "renda" || type === "poupanca"
      ? totalActual < totalPlanned
      : false;

  const valueColor =
    type === "renda" || type === "poupanca"
      ? isUnderBudget
        ? "red"
        : "green"
      : isOverBudget
      ? "red"
      : "green";

  return (
    <Card withBorder radius="md" p="md">
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed">
          {title}
        </Text>
        {/* You can add an icon here if desired */}
      </Group>

      <Group align="flex-end" gap="xs" mb="xs">
        {isLoading ? (
          <Skeleton height={28} width="70%" />
        ) : (
          <Text size="xl" fw={700} style={{ lineHeight: 1 }}>
            {formatCurrency(totalActual)}
          </Text>
        )}
        {isLoading ? (
          <Skeleton height={18} width="30%" />
        ) : (
          <Text size="sm" c="dimmed" style={{ lineHeight: 1 }}>
            de {formatCurrency(totalPlanned)}
          </Text>
        )}
      </Group>

      {isLoading ? (
        <Skeleton height={16} width="50%" />
      ) : (
        <Text size="xs" c={valueColor}>
          {type === "renda" || type === "poupanca"
            ? totalActual >= totalPlanned
              ? "Meta atingida!"
              : `Faltam ${formatCurrency(totalPlanned - totalActual)}`
            : totalActual <= totalPlanned
            ? "Dentro do orçamento"
            : `Acima do orçamento em ${formatCurrency(
                totalActual - totalPlanned
              )}`}
        </Text>
      )}
    </Card>
  );
}
