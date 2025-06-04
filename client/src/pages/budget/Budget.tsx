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
  Stack,
  Divider,
  Flex,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { motion } from "framer-motion";
import {
  IconDotsVertical,
  IconDownload,
  IconRefresh,
  IconPlus,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { budgetApi, plannedBudgetItemApi } from "../../services/api";
import GroupSelector from "../../components/ui/GroupSelector";
import { Budget as BudgetType, PlannedBudgetItem } from "../../types/budget";
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

// Define the schema for the edit entry form (similar to new, but for updates)
const editEntrySchema = z.object({
  categoryType: z.enum(["renda", "despesa", "conta", "poupanca"], {
    required_error: "Selecione uma categoria",
  }),
  nome: z.string().min(1, "O tipo da entrada é obrigatório"),
  valorPlanejado: z
    .number()
    .min(0.01, "O valor estimado deve ser maior que zero"),
});

type EditEntryFormValues = z.infer<typeof editEntrySchema>;

// Define a type for the transformed budget data for the UI
interface UIBudgetCategory {
  tipo: "renda" | "despesa" | "conta" | "poupanca";
  lancamentosPlanejados: {
    _id: string; // Add _id for editing/deleting
    nome: string;
    valorPlanejado: number;
    categoryType: "renda" | "despesa" | "conta" | "poupanca"; // Add categoryType for consistency
  }[];
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
  const [budget, setBudget] = useState<UIBudget | null>(null);
  const [isBudgetLoading, setIsBudgetLoading] = useState(false);

  // Modals for adding, editing, and deleting
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] =
    useDisclosure(false);
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false);
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);

  const [selectedItem, setSelectedItem] = useState<PlannedBudgetItem | null>(
    null
  ); // Item currently being edited or deleted

  // Form for adding new entries
  const {
    control: addControl,
    handleSubmit: handleAddSubmit,
    reset: resetAddForm,
    formState: { errors: addErrors },
  } = useForm<NewEntryFormValues>({
    resolver: zodResolver(newEntrySchema),
    defaultValues: {
      categoryType: "renda",
      nome: "",
      valorPlanejado: 0,
    },
  });

  // Form for editing existing entries
  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    reset: resetEditForm,
    setValue: setEditValue,
    formState: { errors: editErrors },
  } = useForm<EditEntryFormValues>({
    resolver: zodResolver(editEntrySchema),
    defaultValues: {
      categoryType: "renda",
      nome: "",
      valorPlanejado: 0,
    },
  });

  // Effect to set groups and initial selectedGroupId when user data is available
  useEffect(() => {
    if (!isAuthLoading && user?.grupos) {
      const mappedGroups: BudgetGroupType[] = user.grupos.map((g) => ({
        _id: g.groupId._id,
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
  }, [user, isAuthLoading, selectedGroupId]);

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

      const startDate = new Date(currentYear, currentMonth, 1);
      const endDate = new Date(currentYear, currentMonth + 1, 0);

      let currentBudget: BudgetType | null = null;

      const groupBudgets = await budgetApi.getGroupBudgets(selectedGroupId);
      currentBudget =
        groupBudgets.find(
          (b) =>
            new Date(b.dataInicio).getMonth() === currentMonth &&
            new Date(b.dataInicio).getFullYear() === currentYear
        ) || null;

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

      const plannedItems: PlannedBudgetItem[] =
        await plannedBudgetItemApi.getPlannedBudgetItemsForBudget(
          currentBudget._id
        );

      // Transform flat plannedItems into categorized structure for UI, including _id and categoryType
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
            _id: item._id, // Include _id
            nome: item.nome,
            valorPlanejado: item.valorPlanejado,
            categoryType: item.categoryType, // Include categoryType
          });
        }
      });

      setBudget(transformedBudget);
    } catch (error) {
      console.error("Error fetching or creating budget:", error);
      setBudget(null);
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

      setBudget((prevBudget) => {
        if (!prevBudget) return null;

        const updatedCategories = prevBudget.categorias.map((category) => {
          if (category.tipo === newPlannedItem.categoryType) {
            return {
              ...category,
              lancamentosPlanejados: [
                ...category.lancamentosPlanejados,
                {
                  _id: newPlannedItem._id, // Include _id
                  nome: newPlannedItem.nome,
                  valorPlanejado: newPlannedItem.valorPlanejado,
                  categoryType: newPlannedItem.categoryType, // Include categoryType
                },
              ],
            };
          }
          return category;
        });

        return {
          ...prevBudget,
          categorias: updatedCategories,
        };
      });

      closeAddModal();
      resetAddForm();
    } catch (error) {
      console.error("Error adding planned item:", error);
      // TODO: Show notification
    }
  };

  const handleEditClick = (item: PlannedBudgetItem) => {
    setSelectedItem(item);
    setEditValue("categoryType", item.categoryType);
    setEditValue("nome", item.nome);
    setEditValue("valorPlanejado", item.valorPlanejado);
    openEditModal();
  };

  const handleUpdatePlannedItem = async (data: EditEntryFormValues) => {
    if (!selectedItem) return;

    try {
      const updatedItem = await plannedBudgetItemApi.updatePlannedBudgetItem(
        selectedItem._id,
        data
      );

      setBudget((prevBudget) => {
        if (!prevBudget) return null;

        const updatedCategories = prevBudget.categorias.map((category) => {
          // If the category type changed, remove from old category and add to new
          if (
            category.tipo === selectedItem.categoryType &&
            category.tipo !== updatedItem.categoryType
          ) {
            return {
              ...category,
              lancamentosPlanejados: category.lancamentosPlanejados.filter(
                (item) => item._id !== selectedItem._id
              ),
            };
          } else if (category.tipo === updatedItem.categoryType) {
            // Update existing item or add to new category
            const itemIndex = category.lancamentosPlanejados.findIndex(
              (item) => item._id === updatedItem._id
            );
            if (itemIndex > -1) {
              const newLancamentos = [...category.lancamentosPlanejados];
              newLancamentos[itemIndex] = {
                _id: updatedItem._id,
                nome: updatedItem.nome,
                valorPlanejado: updatedItem.valorPlanejado,
                categoryType: updatedItem.categoryType,
              };
              return { ...category, lancamentosPlanejados: newLancamentos };
            } else {
              // Item moved to this category
              return {
                ...category,
                lancamentosPlanejados: [
                  ...category.lancamentosPlanejados,
                  {
                    _id: updatedItem._id,
                    nome: updatedItem.nome,
                    valorPlanejado: updatedItem.valorPlanejado,
                    categoryType: updatedItem.categoryType,
                  },
                ],
              };
            }
          }
          return category;
        });

        return {
          ...prevBudget,
          categorias: updatedCategories,
        };
      });

      closeEditModal();
      setSelectedItem(null);
    } catch (error) {
      console.error("Error updating planned item:", error);
      // TODO: Show notification
    }
  };

  const handleDeleteClick = (item: PlannedBudgetItem) => {
    setSelectedItem(item);
    openDeleteModal();
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;

    try {
      await plannedBudgetItemApi.deletePlannedBudgetItem(selectedItem._id);

      setBudget((prevBudget) => {
        if (!prevBudget) return null;

        const updatedCategories = prevBudget.categorias.map((category) => {
          if (category.tipo === selectedItem.categoryType) {
            return {
              ...category,
              lancamentosPlanejados: category.lancamentosPlanejados.filter(
                (item) => item._id !== selectedItem._id
              ),
            };
          }
          return category;
        });

        return {
          ...prevBudget,
          categorias: updatedCategories,
        };
      });

      closeDeleteModal();
      setSelectedItem(null);
    } catch (error) {
      console.error("Error deleting planned item:", error);
      // TODO: Show notification
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
              resetAddForm();
              openAddModal();
            }}
            disabled={!selectedGroupId || isBudgetLoading}
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
                      {items.map((item) => (
                        <Group
                          key={item._id}
                          justify="space-between"
                          wrap="nowrap"
                        >
                          <Text size="sm" className="truncate">
                            {item.nome}
                          </Text>
                          <Flex align="center" gap="xs">
                            <Text
                              size="sm"
                              fw={500}
                              c={color}
                              style={{ flexShrink: 0 }}
                            >
                              {formatCurrency(item.valorPlanejado)}
                            </Text>
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="sm"
                              onClick={() =>
                                handleEditClick(item as PlannedBudgetItem)
                              }
                              aria-label="Editar item"
                            >
                              <IconEdit size={14} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              size="sm"
                              onClick={() =>
                                handleDeleteClick(item as PlannedBudgetItem)
                              }
                              aria-label="Excluir item"
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Flex>
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

      {/* Add New Entry Modal */}
      <Modal
        opened={addModalOpened}
        onClose={closeAddModal}
        title="Nova Entrada de Orçamento"
        centered
      >
        <form onSubmit={handleAddSubmit(handleAddPlannedItem)}>
          <Stack>
            <Controller
              name="categoryType"
              control={addControl}
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
                  error={addErrors.categoryType?.message}
                  {...field}
                />
              )}
            />
            <Controller
              name="nome"
              control={addControl}
              render={({ field }) => (
                <TextInput
                  label="Tipo da Entrada"
                  placeholder="Ex: Salário, Aluguel, Internet"
                  error={addErrors.nome?.message}
                  {...field}
                />
              )}
            />
            <Controller
              name="valorPlanejado"
              control={addControl}
              render={({ field }) => (
                <CurrencyInput
                  label="Valor Estimado"
                  required
                  error={addErrors.valorPlanejado?.message}
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                />
              )}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeAddModal}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Registro</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Edit Entry Modal */}
      <Modal
        opened={editModalOpened}
        onClose={closeEditModal}
        title="Editar Entrada de Orçamento"
        centered
      >
        {selectedItem && (
          <form onSubmit={handleEditSubmit(handleUpdatePlannedItem)}>
            <Stack>
              <Controller
                name="categoryType"
                control={editControl}
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
                    error={editErrors.categoryType?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="nome"
                control={editControl}
                render={({ field }) => (
                  <TextInput
                    label="Tipo da Entrada"
                    placeholder="Ex: Salário, Aluguel, Internet"
                    error={editErrors.nome?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="valorPlanejado"
                control={editControl}
                render={({ field }) => (
                  <CurrencyInput
                    label="Valor Estimado"
                    required
                    error={editErrors.valorPlanejado?.message}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                  />
                )}
              />
              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={closeEditModal}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Confirmar Exclusão"
        centered
      >
        <Text>
          Tem certeza de que deseja excluir o item "<b>{selectedItem?.nome}</b>"
          ({formatCurrency(selectedItem?.valorPlanejado || 0)})? Esta ação não
          pode ser desfeita.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeDeleteModal}>
            Cancelar
          </Button>
          <Button color="red" onClick={handleConfirmDelete}>
            Excluir
          </Button>
        </Group>
      </Modal>
    </motion.div>
  );
}
