import { useState, useEffect } from 'react';
import { Grid, Paper, Text, SimpleGrid, Button, Group, ActionIcon, Menu, Stack, Alert, Modal, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { motion } from 'framer-motion';
import { IconDotsVertical, IconDownload, IconRefresh, IconInfoCircle } from '@tabler/icons-react';
import { mockApi, groupApi, authApi } from '../../services/api';
import BudgetSummaryCard from './components/BudgetSummaryCard';
import CategoryDistributionChart from './components/CategoryDistributionChart';
import BudgetVsActualChart from './components/BudgetVsActualChart';
import RecentTransactionsTable from './components/RecentTransactionsTable';
import GroupSelector from '../../components/ui/GroupSelector';
import { Budget } from '../../types/budget';
import { Transaction } from '../../types/transaction';
import { Group as BudgetGroupType, User } from '../../types/user';

export default function Dashboard() {
  const [userGroups, setUserGroups] = useState<BudgetGroupType[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNoGroups, setHasNoGroups] = useState(false);

  // State for Create Group Modal
  const [createGroupModalOpened, { open: openCreateGroupModal, close: closeCreateGroupModal }] = useDisclosure(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const fetchUserGroups = async () => {
    setIsLoading(true);
    try {
      const groupsData: BudgetGroupType[] = await groupApi.getUserGroups();
      if (groupsData && groupsData.length > 0) {
        setUserGroups(groupsData);
        if (!selectedGroupId) {
          setSelectedGroupId(groupsData[0]._id);
        }
        setHasNoGroups(false);
      } else {
        setHasNoGroups(true);
        setSelectedGroupId(null);
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
      setHasNoGroups(true);
      setSelectedGroupId(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserGroups();
  }, []);

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
        const currentDate = new Date();
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
        
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
  }, [selectedGroupId]);

  const handleCreateGroup = async () => {
    setCreateGroupError(null);
    setIsCreatingGroup(true);
    try {
      await groupApi.createGroup(newGroupName);
      closeCreateGroupModal();
      setNewGroupName('');
      await fetchUserGroups(); // Re-fetch groups to update the selector
    } catch (error: any) {
      console.error('Error creating group:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setCreateGroupError(error.response.data.error);
      } else {
        setCreateGroupError('Erro ao criar grupo. Tente novamente.');
      }
    } finally {
      setIsCreatingGroup(false);
    }
  };

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
          <Button mt="md" onClick={openCreateGroupModal}>
            Criar Novo Grupo
          </Button>
        </Alert>

        <Modal opened={createGroupModalOpened} onClose={closeCreateGroupModal} title="Criar Novo Grupo Orçamentário" centered>
          <Stack>
            <TextInput
              label="Nome de Grupo Orçamentário"
              placeholder="Ex: Família Silva, Casal, Viagem 2024"
              value={newGroupName}
              onChange={(event) => {
                setNewGroupName(event.currentTarget.value);
                setCreateGroupError(null); // Clear error on change
              }}
              error={createGroupError}
              required
            />
            <Button onClick={handleCreateGroup} loading={isCreatingGroup} disabled={!newGroupName.trim()}>
              Criar Grupo
            </Button>
          </Stack>
        </Modal>
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
          value={selectedGroupId || ''}
          onChange={setSelectedGroupId}
          groups={userGroups}
        />
        
        <Group>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={() => {
              if (selectedGroupId) {
                setIsLoading(true);
                setTimeout(() => {
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
