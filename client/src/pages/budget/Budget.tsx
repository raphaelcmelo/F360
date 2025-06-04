import { useState, useEffect, useCallback } from "react";
import {
  Grid,
  Paper,
  Text,
  Group,
  Button,
  ActionIcon,
  Menu,
  Modal,
  Select,
  TextInput,
  NumberInput,
  Stack,
  Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { motion } from "framer-motion";
import {
  IconDotsVertical,
  IconDownload,
  IconRefresh,
  IconPlus,
} from "@tabler/icons-react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { budgetApi, plannedBudgetItemApi } from "../../services/api"; // Import real APIs
import GroupSelector from "../../components/ui/GroupSelector";
import { Budget as BudgetType, PlannedBudgetItem } from "../../types/budget"; // Use PlannedBudgetItem from types
import { useAuth } from "../../contexts/AuthContext";
import { Group as BudgetGroupType } from "../../types/group"; // Import Group type as BudgetGroupType
import CurrencyInput from "../../components/ui/CurrencyInput";

// Define the schema for the new entry form
const newEntrySchema = z.object({
  categoryType: z.enum(["renda", "despesa", "conta", "poupanca"], {
    required_error: "Selecione uma categoria",
  }),
  nome: z.string().min(1, "O tipo da entrada é obrigatório"),
  valorPlanejado: z
    .number()
    .min(0.01, "O valor estimado deve ser maior que zero"),
});

type NewEntryFormValues = z.infer<typeof newEntrySchema>;

// Define a type for the transformed budget data for the UI
interface UIBudgetCategory {
  tipo: "renda" | "despesa" | "conta" | "poupanca";
  lancamentosPlanejados: { nome: string; valorPlanejado: number }[];
}

interface UIBudget {
  _id: string;
  grupoId: string;
  dataInicio: string;
  dataFim: string;
  categorias: UIBudgetCategory[];
}

export default function Budget() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [groups, setGroups] = useState<BudgetGroupType[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [budget, setBudget] = useState<UIBudget | null>(null); // Use UIBudget type
  const [isBudgetLoading, setIsBudgetLoading] = useState(false);
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewEntryFormValues>({
    resolver: zodResolver(newEntrySchema),
    defaultValues: {
      categoryType: "renda",
      nome: "",
      valorPlanejado: 0,
    },
  });

  // Effect to set groups and initial selectedGroupId when user data is available
  useEffect(() => {
    if (!isAuthLoading && user?.grupos) {
      // Map the backend's UserGroupEntry to the Group type expected by GroupSelector
      const mappedGroups: BudgetGroupType[] = user.grupos.map((g) => ({
        _id: g.groupId._id, // CORRECTED: Use g.groupId._id to get the actual group ID
        nome: g.groupId.nome,
        displayName: g.displayName,
        membros: g.groupId.membros,
        criadoPor: g.groupId.criadoPor,
        orcamentos: g.groupId.orcamentos,
        createdAt: g.groupId.createdAt,
        updatedAt: g.groupId.updatedAt,
      }));
      setGroups(mappedGroups);
      if (mappedGroups.length > 0) {
        const currentIdIsValid = mappedGroups.some(
          (g) => g._id === selectedGroupId
        );
        if (!selectedGroupId || !currentIdIsValid) {
          setSelectedGroupId(mappedGroups[0]._id);
        }
      } else {
        setSelectedGroupId("");
      }
    } else if (!isAuthLoading && !user?.grupos) {
      setGroups([]);
      setSelectedGroupId("");
    }
  }, [user, isAuthLoading, selectedGroupId]); // Added selectedGroupId to dependencies

  const fetchBudget = useCallback(async () => {
    if (!selectedGroupId || !user?._id) {
      setBudget(null);
      setIsBudgetLoading(false);
      return;
    }

    setIsBudgetLoading(true);
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth(); // 0-indexed

      // Get start and end of the current month
      const startDate = new Date(currentYear, currentMonth, 1);
      const endDate = new Date(currentYear, currentMonth + 1, 0); // Last day of current month

      let currentBudget: BudgetType | null = null;

      // 1. Try to find an existing budget for the current month
      const groupBudgets = await budgetApi.getGroupBudgets(selectedGroupId);
      currentBudget =
        groupBudgets.find(
          (b) =>
            new Date(b.dataInicio).getMonth() === currentMonth &&
            new Date(b.dataInicio).getFullYear() === currentYear
        ) || null;

      // 2. If no budget exists for the current month, create one
      if (!currentBudget) {
        console.log("No budget found for current month, creating new one...");
        currentBudget = await budgetApi.createBudget(
          selectedGroupId,
          startDate.toISOString(),
          endDate.toISOString()
        );
      }

      if (!currentBudget) {
        setBudget(null);
        return;
      }

      // 3. Fetch planned items for the identified/created budget
      const plannedItems: PlannedBudgetItem[] =
        await plannedBudgetItemApi.getPlannedBudgetItemsForBudget(
          currentBudget._id
        );

      // 4. Transform flat plannedItems into categorized structure for UI
      const transformedBudget: UIBudget = {
        _id: currentBudget._id,
        grupoId: currentBudget.grupoId,
        dataInicio: currentBudget.dataInicio,
        dataFim: currentBudget.dataFim,
        categorias: [
          { tipo: "renda", lancamentosPlanejados: [] },
          { tipo: "despesa", lancamentosPlanejados: [] },
          { tipo: "conta", lancamentosPlanejados: [] },
          { tipo: "poupanca", lancamentosPlanejados: [] },
        ],
      };

      plannedItems.forEach((item) => {
        const category = transformedBudget.categorias.find(
          (cat) => cat.tipo === item.categoryType
        );
        if (category) {
          category.lancamentosPlanejados.push({
            nome: item.nome,
            valorPlanejado: item.valorPlanejado,
          });
        }
      });

      setBudget(transformedBudget);
    } catch (error) {
      console.error("Error fetching or creating budget:", error);
      setBudget(null); // Set budget to null on error to display empty state
    } finally {
      setIsBudgetLoading(false);
    }
  }, [selectedGroupId, user?._id]);

  useEffect(() => {
    if (selectedGroupId && !isAuthLoading) {
      fetchBudget();
    } else if (!selectedGroupId && !isAuthLoading) {
      setBudget(null);
      setIsBudgetLoading(false);
    }
  }, [fetchBudget, selectedGroupId, isAuthLoading]);

  const handleAddPlannedItem = async (data: NewEntryFormValues) => {
    if (!budget || !user?._id) return;

    try {
      const newPlannedItem = await plannedBudgetItemApi.createPlannedBudgetItem(
        budget._id,
        budget.grupoId,
        data.categoryType,
        data.nome,
        data.valorPlanejado
      );

      // Optimistically update UI or refetch
      setBudget((prevBudget) => {
        if (!prevBudget) return null;

        const updatedCategories = prevBudget.categorias.map((category) => {
          if (category.tipo === newPlannedItem.categoryType) {
            return {
              ...category,
              lancamentosPlanejados: [
                ...category.lancamentosPlanejados,
                {
                  nome: newPlannedItem.nome,
                  valorPlanejado: newPlannedItem.valorPlanejado,
                },
              ],
            };
          }
          return category;
        });

        // If the category didn't exist before (shouldn't happen with pre-defined categories)
        if (
          !updatedCategories.some(
            (cat) => cat.tipo === newPlannedItem.categoryType
          )
        ) {
          updatedCategories.push({
            tipo: newPlannedItem.categoryType,
            lancamentosPlanejados: [
              {
                nome: newPlannedItem.nome,
                valorPlanejado: newPlannedItem.valorPlanejado,
              },
            ],
          });
        }

        return {
          ...prevBudget,
          categorias: updatedCategories,
        };
      });

      closeModal();
      reset();
    } catch (error) {
      console.error("Error adding planned item:", error);
      // Handle error, maybe show a notification
    }
  };

  const getCategoryItems = (
    type: UIBudgetCategory["tipo"]
  ): UIBudgetCategory["lancamentosPlanejados"] => {
    return (
      budget?.categorias.find((cat) => cat.tipo === type)
        ?.lancamentosPlanejados || []
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const totalPlanned = (type: UIBudgetCategory["tipo"]) => {
    return getCategoryItems(type).reduce(
      (sum, item) => sum + item.valorPlanejado,
      0
    );
  };

  if (isAuthLoading) {
    return (
      <motion.div
        className="page-transition"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Text>Carregando dados do usuário...</Text>
      </motion.div>
    );
  }

  if (!user?.grupos || user.grupos.length === 0) {
    return (
      <motion.div
        className="page-transition"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Text>
          Você não pertence a nenhum grupo. Crie ou junte-se a um grupo para
          visualizar o orçamento.
        </Text>
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
          value={selectedGroupId}
          onChange={setSelectedGroupId}
          groups={groups}
        />

        <Group>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={fetchBudget}
            loading={isBudgetLoading}
          >
            Atualizar
          </Button>

          <Button
            variant="filled"
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              reset();
              openModal();
            }}
            disabled={!selectedGroupId || isBudgetLoading} // Enable if a group is selected and not loading
          >
            Nova entrada
          </Button>

          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="light" size="lg" radius="md">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item leftSection={<IconDownload size={14} />}>
                Exportar orçamento
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Grid>
        {["renda", "despesa", "conta", "poupanca"].map((type) => {
          const typeColorMap: Record<string, string> = {
            renda: "green",
            poupanca: "blue",
            despesa: "red",
            conta: "orange",
          };

          const color = typeColorMap[type] || "gray";
          const items = getCategoryItems(type as UIBudgetCategory["tipo"]);

          return (
            <Grid.Col span={{ base: 12, md: 6, lg: 3 }} key={type}>
              <Paper
                p="md"
                radius="md"
                withBorder
                className="h-full flex flex-col"
              >
                <Text size="lg" fw={700} mb="md" className="capitalize">
                  {type === "renda"
                    ? "Rendas"
                    : type === "despesa"
                    ? "Despesas"
                    : type === "conta"
                    ? "Contas"
                    : "Poupança"}
                </Text>
                <Divider mb="md" />
                <div className="flex-1 overflow-y-auto pr-2">
                  {" "}
                  {isBudgetLoading ? (
                    <Text c="dimmed">Carregando...</Text>
                  ) : items.length > 0 ? (
                    <Stack gap="xs">
                      {items.map((item, index) => (
                        <Group
                          key={index} // Consider using a unique ID if items had one
                          justify="space-between"
                          wrap="nowrap"
                        >
                          <Text size="sm" className="truncate">
                            {item.nome}
                          </Text>
                          <Text
                            size="sm"
                            fw={500}
                            c={color}
                            style={{ flexShrink: 0 }}
                          >
                            {formatCurrency(item.valorPlanejado)}
                          </Text>
                        </Group>
                      ))}
                    </Stack>
                  ) : (
                    <Text c="dimmed">Nenhuma entrada planejada.</Text>
                  )}
                </div>
                <Divider mt="md" />
                <Group justify="space-between" mt="md">
                  <Text size="md" fw={700}>
                    Total Planejado:
                  </Text>
                  <Text size="md" fw={700} c={color}>
                    {formatCurrency(
                      totalPlanned(type as UIBudgetCategory["tipo"])
                    )}
                  </Text>
                </Group>
              </Paper>
            </Grid.Col>
          );
        })}
      </Grid>

      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title="Nova Entrada de Orçamento"
        centered
      >
        <form onSubmit={handleSubmit(handleAddPlannedItem)}>
          <Stack>
            <Controller
              name="categoryType"
              control={control}
              render={({ field }) => (
                <Select
                  label="Categoria"
                  placeholder="Selecione a categoria"
                  data={[
                    { value: "renda", label: "Renda" },
                    { value: "despesa", label: "Despesa" },
                    { value: "conta", label: "Conta" },
                    { value: "poupanca", label: "Poupança" },
                  ]}
                  error={errors.categoryType?.message}
                  {...field}
                />
              )}
            />
            <Controller
              name="nome"
              control={control}
              render={({ field }) => (
                <TextInput
                  label="Tipo da Entrada"
                  placeholder="Ex: Salário, Aluguel, Internet"
                  error={errors.nome?.message}
                  {...field}
                />
              )}
            />
            <Controller
              name="valorPlanejado"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  label="Valor Estimado"
                  required
                  error={errors.valorPlanejado?.message}
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                />
              )}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Registro</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </motion.div>
  );
}
