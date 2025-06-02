import { useEffect, useState } from 'react';
import { Skeleton, Stack, Text } from '@mantine/core';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Budget } from '../../../types/budget';
import { Transaction } from '../../../types/transaction';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BudgetVsActualChartProps {
  budget: Budget | null;
  transactions: Transaction[];
  isLoading: boolean;
}

export default function BudgetVsActualChart({
  budget,
  transactions,
  isLoading,
}: BudgetVsActualChartProps) {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (budget && transactions.length > 0) {
      // Define the categories to show in the chart
      const categories = ['renda', 'despesa', 'conta', 'poupanca'];
      const categoryLabels = {
        renda: 'Receitas',
        despesa: 'Despesas',
        conta: 'Contas',
        poupanca: 'Poupança',
      };
      
      // Calculate planned values for each category
      const plannedValues = categories.map(cat => {
        return budget.categorias
          .find(c => c.tipo === cat)
          ?.lancamentosPlanejados
          .reduce((sum, item) => sum + item.valorPlanejado, 0) || 0;
      });
      
      // Calculate actual values for each category
      const actualValues = categories.map(cat => {
        return transactions
          .filter(t => t.categoria === cat)
          .reduce((sum, t) => sum + t.valor, 0);
      });
      
      setChartData({
        labels: categories.map(cat => categoryLabels[cat as keyof typeof categoryLabels]),
        datasets: [
          {
            label: 'Orçado',
            data: plannedValues,
            backgroundColor: 'rgba(34, 139, 230, 0.5)',
            borderColor: 'rgba(34, 139, 230, 1)',
            borderWidth: 1,
          },
          {
            label: 'Realizado',
            data: actualValues,
            backgroundColor: 'rgba(32, 201, 151, 0.5)',
            borderColor: 'rgba(32, 201, 151, 1)',
            borderWidth: 1,
          },
        ],
      });
    }
  }, [budget, transactions]);

  if (isLoading) {
    return <Skeleton height={300} />;
  }

  if (!budget || transactions.length === 0) {
    return (
      <Stack align="center\" justify="center\" spacing="xs\" h={200}>
        <Text c="dimmed">Sem dados para exibir</Text>
      </Stack>
    );
  }

  return (
    <div style={{ height: 300 }}>
      {chartData && (
        <Bar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw as number;
                    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => {
                    return `R$ ${Number(value).toLocaleString('pt-BR', { 
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}`;
                  },
                },
              },
            },
          }}
        />
      )}
    </div>
  );
}