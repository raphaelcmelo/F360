import { useState, useEffect } from 'react';
import { Grid, Paper, Text, SimpleGrid, Button, Group, ActionIcon, Menu, Stack } from '@mantine/core';
import { motion } from 'framer-motion';
import { IconDotsVertical, IconDownload, IconRefresh } from '@tabler/icons-react';
import { mockApi } from '../../services/api';
import BudgetSummaryCard from './components/BudgetSummaryCard';
import CategoryDistributionChart from './components/CategoryDistributionChart';
import BudgetVsActualChart from './components/BudgetVsActualChart';
import RecentTransactionsTable from './components/RecentTransactionsTable';
import GroupSelector from '../../components/ui/GroupSelector';
import { Budget } from '../../types/budget';
import { Transaction } from '../../types/transaction';

export default function Dashboard() {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('group1');
  const [budget, setBudget] = useState<Budget | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get current month for mock data
        const currentDate = new Date();
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
        
        // Fetch budget and transactions
        const [budgetData, transactionsData] = await Promise.all([
          mockApi.budgets.getByGroup(selectedGroupId),
          mockApi.transactions.getByGroup(selectedGroupId, startDate, endDate)
        ]);
        
        setBudget(budgetData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedGroupId]);

  return (
    <motion.div
      className="page-transition"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Group justify="space-between" mb="xl">
        <GroupSelector
          value={selectedGroupId}
          onChange={setSelectedGroupId}
        />
        
        <Group>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 800);
            }}
          >
            Atualizar
          </Button>
          
          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="light" size="lg" radius="md">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconDownload size={14} />}>
                Exportar dados
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
      
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="xl">
        <BudgetSummaryCard
          title="Receitas"
          type="renda"
          budget={budget}
          transactions={transactions}
          isLoading={isLoading}
        />
        <BudgetSummaryCard
          title="Despesas"
          type="despesa"
          budget={budget}
          transactions={transactions}
          isLoading={isLoading}
        />
        <BudgetSummaryCard
          title="Contas"
          type="conta"
          budget={budget}
          transactions={transactions}
          isLoading={isLoading}
        />
        <BudgetSummaryCard
          title="Poupança"
          type="poupanca"
          budget={budget}
          transactions={transactions}
          isLoading={isLoading}
        />
      </SimpleGrid>
      
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="md" radius="md" withBorder>
            <Text fw={500} mb="md">Orçado vs Realizado</Text>
            <BudgetVsActualChart
              budget={budget}
              transactions={transactions}
              isLoading={isLoading}
            />
          </Paper>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" radius="md" withBorder>
            <Text fw={500} mb="md">Distribuição de Gastos</Text>
            <CategoryDistributionChart
              transactions={transactions}
              isLoading={isLoading}
            />
          </Paper>
        </Grid.Col>
        
        <Grid.Col span={12}>
          <Paper p="md" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={500}>Transações Recentes</Text>
              <Button variant="subtle" size="xs" component="a" href="/lancamentos">
                Ver todas
              </Button>
            </Group>
            <RecentTransactionsTable
              transactions={transactions}
              isLoading={isLoading}
            />
          </Paper>
        </Grid.Col>
      </Grid>
    </motion.div>
  );
}
