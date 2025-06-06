import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  ActionIcon,
  Card,
  ThemeIcon,
  Loader,
  Center,
  Select,
} from "@mantine/core";
import { motion } from "framer-motion";
import {
  IconArrowLeft,
  IconWallet,
  IconPlus,
  IconEdit,
  IconTrash,
  IconUserPlus,
  IconUserMinus,
  IconBuildingBank,
  IconCalendarStats,
} from "@tabler/icons-react";
import { useAuth } from "../../contexts/AuthContext";
import { activityLogApi, budgetApi } from "../../services/api";
import { ActivityLog } from "../../types/activityLog";
import { Budget } from "../../types/budget";

export default function History() {
  const navigate = useNavigate();
  const { user, activeGroup } = useAuth();
  const [historyEntries, setHistoryEntries] = useState<ActivityLog[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBudgets = async () => {
      if (!user || !activeGroup) {
        setBudgets([]);
        setSelectedBudgetId(null);
        console.log("No active group, budgets set to empty.");
        return;
      }

      try {
        const groupBudgets = await budgetApi.getGroupBudgets(activeGroup);
        setBudgets(groupBudgets);
        if (groupBudgets.length > 0) {
          setSelectedBudgetId(groupBudgets[0]._id);
        } else {
          setSelectedBudgetId(null);
        }
      } catch (err) {
        console.error("Failed to fetch budgets:", err);
      }
    };

    fetchBudgets();
  }, [user, activeGroup]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user || !activeGroup) {
        setLoading(false);
        setError("Nenhum grupo ativo selecionado.");
        setHistoryEntries([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await activityLogApi.getActivitiesByGroup(
          activeGroup,
          selectedBudgetId || undefined
        );
        setHistoryEntries(data);
      } catch (err) {
        console.error("Failed to fetch activity history:", err);
        setError("Falha ao carregar o histórico de atividades.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, activeGroup, selectedBudgetId]);

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case "transaction_created":
        return <IconPlus size={18} />;
      case "transaction_updated":
        return <IconEdit size={18} />;
      case "transaction_deleted":
        return <IconTrash size={18} />;
      case "budget_item_created":
        return <IconPlus size={18} />;
      case "budget_item_updated":
        return <IconEdit size={18} />;
      case "budget_item_deleted":
        return <IconTrash size={18} />;
      case "member_invited":
        return <IconUserPlus size={18} />;
      case "member_removed":
        return <IconUserMinus size={18} />;
      case "group_created":
        return <IconBuildingBank size={18} />;
      case "group_updated":
        return <IconEdit size={18} />;
      case "group_deleted":
        return <IconTrash size={18} />;
      case "budget_created":
        return <IconCalendarStats size={18} />;
      case "budget_deleted":
        return <IconTrash size={18} />;
      default:
        return <IconWallet size={18} />;
    }
  };

  const getActivityColor = (item: ActivityLog) => {
    console.log("Processing item:", item.actionType, item.description); // Log action type and description
    if (item.actionType.startsWith("transaction_")) {
      const transactionCategory = item.details?.categoria;
      console.log("  Transaction category:", transactionCategory); // Log the extracted category

      switch (transactionCategory) {
        case "renda":
          console.log("  Returning green for renda");
          return "green";
        case "poupanca":
          console.log("  Returning blue for poupanca");
          return "blue";
        case "despesa":
          console.log("  Returning red for despesa");
          return "red";
        case "conta":
          console.log("  Returning orange for conta");
          return "orange";
        default:
          console.log(
            "  Returning gray for unknown transaction category:",
            transactionCategory
          );
          return "gray";
      }
    }

    if (item.actionType.includes("created")) {
      console.log("  Returning green for created");
      return "green";
    }
    if (item.actionType.includes("updated")) {
      console.log("  Returning blue for updated");
      return "blue";
    }
    if (item.actionType.includes("deleted")) {
      console.log("  Returning red for deleted");
      return "red";
    }
    if (item.actionType.includes("invited")) {
      console.log("  Returning teal for invited");
      return "teal";
    }
    if (item.actionType.includes("removed")) {
      console.log("  Returning orange for removed");
      return "orange";
    }
    if (item.actionType.includes("group")) {
      console.log("  Returning violet for group");
      return "violet";
    }
    if (item.actionType.includes("budget")) {
      console.log("  Returning indigo for budget");
      return "indigo";
    }
    console.log("  Returning gray for default");
    return "gray";
  };

  const renderHistoryItem = (item: ActivityLog) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString("pt-BR");
    const formattedTime = new Date(item.createdAt).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <Card key={item._id} withBorder mb="sm">
        <Group wrap="nowrap" gap="md">
          <ThemeIcon
            size="lg"
            radius="xl"
            color={getActivityColor(item)}
            variant="light"
          >
            {getActivityIcon(item.actionType)}
          </ThemeIcon>

          <div style={{ flex: 1 }}>
            <Text fw={500}>{item.description}</Text>
            <Text size="sm" c="dimmed">
              Por: {item.criadoPorNome}
            </Text>
          </div>

          <Stack gap={0} align="flex-end">
            <Text size="sm" c="dimmed">
              {formattedDate}
            </Text>
            <Text size="xs" c="dimmed">
              {formattedTime}
            </Text>
          </Stack>
        </Group>
      </Card>
    );
  };

  const budgetSelectData = budgets.map((budget) => ({
    value: budget._id,
    label: `Orçamento de ${new Date(budget.dataInicio).toLocaleDateString(
      "pt-BR"
    )} a ${new Date(budget.dataFim).toLocaleDateString("pt-BR")}`,
  }));

  return (
    <motion.div
      className="page-transition"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Group mb="xl" align="center" justify="space-between">
        <Group align="center">
          <ActionIcon
            variant="light"
            size="lg"
            radius="xl"
            onClick={() => navigate(-1)}
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Title order={2}>Histórico de Atividades</Title>
        </Group>
        <Select
          leftSection={<IconCalendarStats size={16} />}
          placeholder="Filtrar por orçamento"
          data={budgetSelectData}
          value={selectedBudgetId}
          onChange={setSelectedBudgetId}
          searchable
          clearable
          nothingFoundMessage="Nenhum orçamento encontrado."
          disabled={budgets.length === 0}
          w={250}
        />
      </Group>

      <Paper p="md" radius="md" withBorder>
        {loading ? (
          <Center py="xl">
            <Loader />
            <Text ml="sm">Carregando histórico...</Text>
          </Center>
        ) : error ? (
          <Text c="red" ta="center" py="xl">
            {error}
          </Text>
        ) : historyEntries.length > 0 ? (
          historyEntries.map((item) => renderHistoryItem(item))
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            Nenhuma atividade recente para exibir.
          </Text>
        )}
      </Paper>
    </motion.div>
  );
}
