import {
  Paper,
  Text,
  Skeleton,
  Group,
  RingProgress,
  Stack,
  Box,
} from "@mantine/core";
import { motion } from "framer-motion";
import { Budget } from "../../../types/budget";
import { Transaction } from "../../../types/transaction";

interface BudgetSummaryCardProps {
  title: string;
  type: "renda" | "despesa" | "conta" | "poupanca";
  budget: Budget | null;
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
  // Calculate planned total for the category
  const plannedTotal =
    budget?.categorias
      .find((cat) => cat.tipo === type)
      ?.lancamentosPlanejados.reduce(
        (sum, item) => sum + item.valorPlanejado,
        0
      ) || 0;

  // Calculate actual total for the category
  const actualTotal = transactions
    .filter((t) => t.categoria === type)
    .reduce((sum, t) => sum + t.valor, 0);

  // Calculate percentage
  const percentage =
    plannedTotal > 0
      ? Math.min(Math.round((actualTotal / plannedTotal) * 100), 100)
      : 0;

  // Get color based on type and percentage
  const getColor = () => {
    if (type === "renda") {
      return percentage >= 100 ? "green" : "blue";
    }
    if (type === "poupanca") {
      return percentage >= 100 ? "teal" : "blue";
    }
    return percentage > 100 ? "red" : percentage > 80 ? "yellow" : "teal";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper p="md" radius="md" withBorder>
        <Text size="sm" fw={500} mb="xs">
          {title}
        </Text>

        {isLoading ? (
          <Stack>
            <Skeleton height={28} width="70%" />
            <Skeleton height={90} circle />
          </Stack>
        ) : (
          <>
            <Group justify="space-between" align="center" mb="sm" wrap="nowrap">
              <Stack spacing={2}>
                <Text size="xl" fw={700}>
                  R${" "}
                  {actualTotal.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
                <Text size="xs" c="dimmed">
                  de R${" "}
                  {plannedTotal.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </Stack>

              <RingProgress
                size={90}
                thickness={8}
                roundCaps
                sections={[{ value: percentage, color: getColor() }]}
                label={
                  <Box
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text fw={700} size="lg">
                      {percentage}%
                    </Text>
                  </Box>
                }
              />
            </Group>
          </>
        )}
      </Paper>
    </motion.div>
  );
}
