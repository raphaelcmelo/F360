import { useState, useEffect } from "react";
import { Skeleton, Stack } from "@mantine/core";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Colors,
} from "chart.js";
import { Transaction } from "../../../types/transaction";

ChartJS.register(ArcElement, Tooltip, Legend, Colors);

interface CategoryDistributionChartProps {
  transactions: Transaction[];
  isLoading: boolean;
}

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
  }[];
}

export default function CategoryDistributionChart({
  transactions,
  isLoading,
}: CategoryDistributionChartProps) {
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }],
  });

  useEffect(() => {
    if (transactions.length > 0) {
      // Focus only on expense transactions
      const expenses = transactions.filter(
        (t) => t.categoria === "despesa" || t.categoria === "conta"
      );

      // Group expenses by type
      const expensesByType = expenses.reduce<Record<string, number>>(
        (acc, t) => {
          if (acc[t.tipo]) {
            acc[t.tipo] += t.valor;
          } else {
            acc[t.tipo] = t.valor;
          }
          return acc;
        },
        {}
      );

      // Sort by value (descending)
      const sortedExpenses = Object.entries(expensesByType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6); // Take top 6 expenses

      const labels = sortedExpenses.map(([type]) => type);
      const data = sortedExpenses.map(([, value]) => value);

      // Define colors
      const colors = [
        "#fab005", // yellow
        "#228be6", // blue
        "#fa5252", // red
        "#40c057", // green
        "#7950f2", // violet
        "#fd7e14", // orange
        "#12b886", // teal
        "#be4bdb", // purple
        "#339af0", // sky blue
        "#e64980", // pink
        "#82c91e", // lime
        "#f59f00", // amber
        "#cc5de8", // magenta
        "#63e6be", // mint
        "#91a7ff", // periwinkle
        "#ff922b", // tangerine
        "#4dabf7", // light blue
        "#ff6b6b", // coral
        "#c2255c", // deep pink
        "#5c940d", // olive green
      ];

      setChartData({
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
          },
        ],
      });
    }
  }, [transactions]);

  if (isLoading) {
    return <Skeleton height={200} />;
  }

  if (transactions.length === 0) {
    return <Stack align="center">Sem dados de transações</Stack>;
  }

  return (
    <Pie
      data={chartData}
      options={{
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              boxWidth: 10,
              font: {
                size: 11,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                return `R$ ${value.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}`;
              },
            },
          },
        },
        maintainAspectRatio: true,
      }}
    />
  );
}
