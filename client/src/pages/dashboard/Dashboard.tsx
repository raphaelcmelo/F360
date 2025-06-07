import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import {
  Grid,
  Paper,
  Text,
  SimpleGrid,
  Button,
  Group,
  ActionIcon,
  Menu,
  Stack,
  Alert,
  Modal,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { motion } from "framer-motion";
import {
  IconDotsVertical,
  IconDownload,
  IconRefresh,
  IconInfoCircle,
} from "@tabler/icons-react";
import {
  groupApi,
  authApi,
  budgetApi,
  plannedBudgetItemApi,
  transactionApi, // Import transactionApi
} from "../../services/api";
import BudgetSummaryCard from "./components/BudgetSummaryCard";
import CategoryDistributionChart from "./components/CategoryDistributionChart";
import BudgetVsActualChart from "./components/BudgetVsActualChart";
import RecentTransactionsTable from "./components/RecentTransactionsTable";
import GroupSelector from "../../components/ui/GroupSelector";
import { Budget, PlannedBudgetItem, BudgetCategory } from "../../types/budget";
import { Transaction } from "../../types/transaction";
import { Group as BudgetGroupType, User } from "../../types/user";

export default function Dashboard() {
  const [userGroups, setUserGroups] = useState<BudgetGroupType[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNoGroups, setHasNoGroups] = useState(false);

  // State for Create Group Modal
  const [
    createGroupModalOpened,
    { open: openCreateGroupModal, close: closeCreateGroupModal },
  ] = useDisclosure(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const navigate = useNavigate(); // Initialize useNavigate

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
      console.error("Error fetching user groups:", error);
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
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // 1. Fetch all budgets for the selected group
        const groupBudgets = await budgetApi.getGroupBudgets(selectedGroupId);

        let currentMonthBudget: Budget | null = null;

        // 2. Find the budget for the current month
        for (const b of groupBudgets) {
          const budgetStartDate = new Date(b.dataInicio);
          if (
            budgetStartDate.getMonth() === currentMonth &&
            budgetStartDate.getFullYear() === currentYear
          ) {
            currentMonthBudget = b;
            break;
          }
        }

        let fetchedBudget: Budget | null = null;
        if (currentMonthBudget) {
          // 3. If a budget for the current month exists, fetch its detailed planned items
          // and enrich the budget object with them
          const plannedItems: PlannedBudgetItem[] =
            await plannedBudgetItemApi.getPlannedBudgetItemsForBudget(
              currentMonthBudget._id
            );

          // Transform flat plannedItems into categorized structure for UI
          const transformedCategories: BudgetCategory[] = [
            { tipo: "renda", lancamentosPlanejados: [] },
            { tipo: "despesa", lancamentosPlanejados: [] },
            { tipo: "conta", lancamentosPlanejados: [] },
            { tipo: "poupanca", lancamentosPlanejados: [] },
          ];

          plannedItems.forEach((item) => {
            const category = transformedCategories.find(
              (cat) => cat.tipo === item.categoryType
            );
            if (category) {
              category.lancamentosPlanejados.push(item);
            }
          });

          // Calculate aggregated planned totals
          const totalRendaPlanejado =
            transformedCategories
              .find((c) => c.tipo === "renda")
              ?.lancamentosPlanejados.reduce(
                (sum, item) => sum + item.valorPlanejado,
                0
              ) || 0;
          const totalDespesaPlanejado =
            transformedCategories
              .find((c) => c.tipo === "despesa")
              ?.lancamentosPlanejados.reduce(
                (sum, item) => sum + item.valorPlanejado,
                0
              ) || 0;
          const totalContaPlanejado =
            transformedCategories
              .find((c) => c.tipo === "conta")
              ?.lancamentosPlanejados.reduce(
                (sum, item) => sum + item.valorPlanejado,
                0
              ) || 0;
          const totalPoupancaPlanejado =
            transformedCategories
              .find((c) => c.tipo === "poupanca")
              ?.lancamentosPlanejados.reduce(
                (sum, item) => sum + item.valorPlanejado,
                0
              ) || 0;

          fetchedBudget = {
            ...currentMonthBudget,
            categorias: transformedCategories, // Add the categories array
            totalRendaPlanejado,
            totalDespesaPlanejado,
            totalContaPlanejado,
            totalPoupancaPlanejado,
          };
        } else {
          // If no budget for the current month, set a default empty budget or handle
          console.warn(
            `No budget found for current month (${
              currentMonth + 1
            }/${currentYear}) in group ${selectedGroupId}`
          );
          // Create an empty budget structure to avoid errors
          fetchedBudget = {
            _id: "", // Placeholder
            grupoId: selectedGroupId,
            dataInicio: new Date(currentYear, currentMonth, 1).toISOString(),
            dataFim: new Date(currentYear, currentMonth + 1, 0).toISOString(),
            criadoPor: "", // Placeholder
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            categorias: [
              { tipo: "renda", lancamentosPlanejados: [] },
              { tipo: "despesa", lancamentosPlanejados: [] },
              { tipo: "conta", lancamentosPlanejados: [] },
              { tipo: "poupanca", lancamentosPlanejados: [] },
            ],
            totalRendaPlanejado: 0,
            totalDespesaPlanejado: 0,
            totalContaPlanejado: 0,
            totalPoupancaPlanejado: 0,
          };
        }

        // 4. Fetch transactions using the real transactionApi
        const startDate = new Date(currentYear, currentMonth, 1).toISOString();
        const endDate = new Date(
          currentYear,
          currentMonth + 1,
          0
        ).toISOString();
        const transactionsData = await transactionApi.getTransactionsByGroup(
          selectedGroupId,
          startDate,
          endDate
        );

        setBudget(fetchedBudget); // Set the enriched budget
        setTransactions(transactionsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
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
      setNewGroupName("");
      await fetchUserGroups(); // Re-fetch groups to update the selector
    } catch (error: any) {
      console.error("Error creating group:", error);
      if (error.response && error.response.data && error.response.data.error) {
        setCreateGroupError(error.response.data.error);
      } else {
        setCreateGroupError("Erro ao criar grupo. Tente novamente.");
      }
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // New handler for card clicks
  const handleCardClick = (
    categoryType: "renda" | "despesa" | "conta" | "poupanca"
  ) => {
    navigate(`/lancamentos?category=${categoryType}`);
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
          Você não está vinculado a nenhum grupo orçamentário. Para começar a
          gerenciar suas finanças, crie um novo grupo ou peça para ser convidado
          para um grupo existente.
          <Button mt="md" onClick={openCreateGroupModal}>
            Criar Novo Grupo
          </Button>
        </Alert>

        <Modal
          opened={createGroupModalOpened}
          onClose={closeCreateGroupModal}
          title="Criar Novo Grupo Orçamentário"
          centered
        >
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
            <Button
              onClick={handleCreateGroup}
              loading={isCreatingGroup}
              disabled={!newGroupName.trim()}
            >
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
          value={selectedGroupId || ""}
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
          onCardClick={handleCardClick} // Pass the handler
        />
        <BudgetSummaryCard
          title="Despesas"
          type="despesa"
          budget={budget}
          transactions={transactions}
          isLoading={isLoading}
          onCardClick={handleCardClick} // Pass the handler
        />
        <BudgetSummaryCard
          title="Contas"
          type="conta"
          budget={budget}
          transactions={transactions}
          isLoading={isLoading}
          onCardClick={handleCardClick} // Pass the handler
        />
        <BudgetSummaryCard
          title="Poupança"
          type="poupanca"
          budget={budget}
          transactions={transactions}
          isLoading={isLoading}
          onCardClick={handleCardClick} // Pass the handler
        />
      </SimpleGrid>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="md" radius="md" withBorder>
            <Text fw={500} mb="md">
              Orçado vs Realizado
            </Text>
            <BudgetVsActualChart
              budget={budget}
              transactions={transactions}
              isLoading={isLoading}
            />
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" radius="md" withBorder>
            <Text fw={500} mb="md">
              Distribuição de Gastos
            </Text>
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
            </Group>
            <RecentTransactionsTable
              transactions={transactions}
              isLoading={isLoading}
            />
            <Group justify="center" mt="md">
              <Button
                variant="light"
                size="md"
                color="blue"
                component="a"
                href="/lancamentos"
                radius="md"
              >
                Ver todas
              </Button>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>
    </motion.div>
  );
}
