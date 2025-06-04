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
import { mockApi } from "../../services/api";
import GroupSelector from "../../components/ui/GroupSelector";
import {
  Budget as BudgetType,
  BudgetCategory,
  PlannedItem,
} from "../../types/budget";
import { useAuth } from "../../contexts/AuthContext";
import { Group as BudgetGroupType } from "../../types/group";
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

export default function Budget() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [groups, setGroups] = useState<BudgetGroupType[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [budget, setBudget] = useState<BudgetType | null>(null);
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
      // Map user.grupos to BudgetGroupType, assuming groupId is _id and displayName is nome
      const mappedGroups: BudgetGroupType[] = user.grupos.map((g) => ({
        _id: g._id, // Changed from g.groupId to g._id
        nome: g.displayName,
        displayName: g.displayName,
        membros: [],
        criadoPor: "",
        orcamentos: [],
        createdAt: "",
      }));
      setGroups(mappedGroups);
      if (mappedGroups.length > 0) {
        // Set initial selectedGroupId if it's not set or if the current one is no longer valid
        // Removed selectedGroupId from dependency array to prevent re-triggering on its own changes
        const currentIdIsValid = mappedGroups.some(
          (g) => g._id === selectedGroupId
        );
        if (!selectedGroupId || !currentIdIsValid) {
          console.log(
            "Setting initial selectedGroupId to:",
            mappedGroups[0]._id
          ); // Added log
          setSelectedGroupId(mappedGroups[0]._id); // FIX: Set _id as string
        }
      } else {
        setSelectedGroupId("");
      }
    } else if (!isAuthLoading && !user?.grupos) {
      setGroups([]);
      setSelectedGroupId("");
    }
  }, [user, isAuthLoading]); // Removed selectedGroupId from dependencies

  const fetchBudget = useCallback(async () => {
    if (!selectedGroupId) {
      setBudget(null);
      setIsBudgetLoading(false);
      return;
    }

    setIsBudgetLoading(true);
    try {
      const budgetData = await mockApi.budgets.getByGroup(selectedGroupId);
      setBudget({
        ...budgetData,
        categorias: budgetData.categorias.map((cat: any) => ({
          ...cat,
          tipo: cat.tipo as BudgetCategory["tipo"],
        })),
      });
    } catch (error) {
      console.error("Error fetching budget:", error);
      setBudget(null); // Set budget to null on error to display empty state
    } finally {
      setIsBudgetLoading(false);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    if (selectedGroupId && !isAuthLoading) {
      fetchBudget();
    } else if (!selectedGroupId && !isAuthLoading) {
      setBudget(null);
      setIsBudgetLoading(false);
    }
  }, [fetchBudget, selectedGroupId, isAuthLoading]);

  const handleAddPlannedItem = (data: NewEntryFormValues) => {
    if (!budget) return;

    const newPlannedItem: PlannedItem = {
      nome: data.nome,
      valorPlanejado: data.valorPlanejado,
    };

    setBudget((prevBudget) => {
      if (!prevBudget) return null;

      const updatedCategories = prevBudget.categorias.map((category) => {
        if (category.tipo === data.categoryType) {
          return {
            ...category,
            lancamentosPlanejados: [
              ...category.lancamentosPlanejados,
              newPlannedItem,
            ],
          };
        }
        return category;
      });

      if (!updatedCategories.some((cat) => cat.tipo === data.categoryType)) {
        updatedCategories.push({
          tipo: data.categoryType,
          lancamentosPlanejados: [newPlannedItem],
        } as BudgetCategory);
      }

      return {
        ...prevBudget,
        categorias: updatedCategories,
      };
    });

    closeModal();
    reset();
  };

  const getCategoryItems = (type: BudgetCategory["tipo"]) => {
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

  const totalPlanned = (type: BudgetCategory["tipo"]) => {
    return getCategoryItems(type).reduce(
      (sum, item) => sum + item.valorPlanejado,
      0
    );
  };

  // --- Debugging Logs ---
  console.log("Budget Component Render - isAuthLoading:", isAuthLoading);
  console.log("Budget Component Render - user:", user);
  console.log("Budget Component Render - user.grupos:", user?.grupos);
  console.log("Budget Component Render - groups state:", groups);
  console.log("Budget Component Render - selectedGroupId:", selectedGroupId);
  // --- End Debugging Logs ---

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
                  ) : getCategoryItems(type as BudgetCategory["tipo"]).length >
                    0 ? (
                    <Stack gap="xs">
                      {getCategoryItems(type as BudgetCategory["tipo"]).map(
                        (item, index) => (
                          <Group
                            key={index}
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
                        )
                      )}
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
                      totalPlanned(type as BudgetCategory["tipo"])
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
