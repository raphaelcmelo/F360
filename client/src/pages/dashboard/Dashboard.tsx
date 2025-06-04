import { useState, useEffect } from 'react';
import { Grid, Paper, Text, SimpleGrid, Button, Group, ActionIcon, Menu, Stack, Alert } from '@mantine/core';
import { motion } from 'framer-motion';
import { IconDotsVertical, IconDownload, IconRefresh, IconInfoCircle } from '@tabler/icons-react';
import { mockApi, groupApi, authApi } from '../../services/api'; // Import groupApi and authApi
import BudgetSummaryCard from './components/BudgetSummaryCard';
import CategoryDistributionChart from './components/CategoryDistributionChart';
import BudgetVsActualChart from './components/BudgetVsActualChart';
import RecentTransactionsTable from './components/RecentTransactionsTable';
import GroupSelector from '../../components/ui/GroupSelector';
import { Budget } from '../../types/budget';
import { Transaction } from '../../types/transaction';
import { Group as BudgetGroupType, User } from '../../types/user'; // Alias Group to BudgetGroupType to avoid conflict

export default function Dashboard() {
  const [userGroups, setUserGroups] = useState<BudgetGroupType[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNoGroups, setHasNoGroups] = useState(false);

  useEffect(() => {
    const fetchUserAndGroups = async () => {
      setIsLoading(true);
      try {
        const profileData: User = await authApi.getProfile();
        if (profileData && profileData.grupos && profileData.grupos.length > 0) {
          setUserGroups(profileData.grupos);
          // Set the first group as default if no group is selected yet
          if (!selectedGroupId) {
            setSelectedGroupId(profileData.grupos[0]._id);
          }
          setHasNoGroups(false);
        } else {
          setHasNoGroups(true);
          setSelectedGroupId(null); // Ensure no group is selected if none exist
        }
      } catch (error) {
        console.error('Error fetching user profile or groups:', error);
        setHasNoGroups(true);
        setSelectedGroupId(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndGroups();
  }, []); // Run once on component mount to get user's groups

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedGroupId) {
        setBudget(null);
        setTransactions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Get current month for mock data
        const currentDate = new Date();
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
        
        // Fetch budget and transactions using the selected group ID
        const [budgetData, transactionsData] = await Promise.all([
          mockApi.budgets.getByGroup(selectedGroupId),
          mockApi.transactions.getByGroup(selectedGroupId, startDate, endDate)
        ]);
        
        setBudget(budgetData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setBudget(null);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedGroupId]); // Re-fetch data when selectedGroupId changes

  if (isLoading && !selectedGroupId && !hasNoGroups) {
    return (
      <motion.div
        className="page-transition"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Paper p="md" radius="md" withBorder>
          <Text>Carregando dados do grupo...</Text>
        </Paper>
      </motion.div>
    );
  }

  if (hasNoGroups) {
    return (
      <motion.div
        className="page-transition"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Alert
          variant="light"
          color="blue"
          title="Nenhum Grupo Orçamentário Encontrado"
          icon={<IconInfoCircle />}
        >
          Você não está vinculado a nenhum grupo orçamentário. Para começar a gerenciar suas finanças,
          crie um novo grupo ou peça para ser convidado para um grupo existente.
          <Button mt="md" onClick={() => alert('Funcionalidade de criar grupo em breve!')}>
            Criar Novo Grupo
          </Button>
        </Alert>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="page-transition"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Group justify="space-between" mb="xl">
        <GroupSelector
          value={selectedGroupId || ''} // Pass empty string if null
          onChange={setSelectedGroupId}
          groups={userGroups} // Pass the fetched groups to the selector
        />
        
        <Group>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={() => {
              // Trigger re-fetch of data for the current selected group
              if (selectedGroupId) {
                setIsLoading(true);
                // A small delay to simulate network request, then re-fetch
                setTimeout(() => {
                  // Re-trigger the useEffect for selectedGroupId
                  setSelectedGroupId(selectedGroupId); 
                }, 800);
              }
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
