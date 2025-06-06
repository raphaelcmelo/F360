import { useState, useEffect, useCallback, useRef } from "react";
import {
  Paper,
  Text,
  Group,
  Button,
  ActionIcon,
  Menu,
  Table,
  Badge,
  TextInput,
  Select,
  Stack,
  Modal,
  Loader,
  Center,
  Flex,
  Divider,
} from "@mantine/core";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DatePickerInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  IconPlus,
  IconDotsVertical,
  IconDownload,
  IconRefresh,
  IconSearch,
  IconFilter,
  IconEdit,
  IconTrash,
  IconInfoCircle,
} from "@tabler/icons-react";
import {
  transactionApi,
  budgetApi,
  plannedBudgetItemApi,
  groupApi,
} from "../../services/api";
import GroupSelector from "../../components/ui/GroupSelector";
import { Transaction } from "../../types/transaction";
import {
  Budget as BudgetType,
  PlannedItem,
  PlannedBudgetItem,
  BudgetCategory,
} from "../../types/budget";
import CurrencyInput from "../../components/ui/CurrencyInput";
import { notifications } from "@mantine/notifications";
import { Group as UserGroup } from "../../types/group";
import { formatCurrency } from "../../utils/format"; // Import the formatCurrency utility

// Define the schema for the transaction form
const transactionSchema = z.object({
  data: z.date({ required_error: "Data é obrigatória" }),
  categoria: z.enum(["renda", "despesa", "conta", "poupanca"], {
    required_error: "Categoria é obrigatória",
  }),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  valor: z.number().min(0.01, "O valor deve ser maior que zero"),
  description: z
    .string()
    .max(140, "Descrição muito longa (máx. 140 caracteres)")
    .optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

// Define the schema for updating transaction (all fields optional)
const updateTransactionSchema = z.object({
  data: z.date().optional(),
  categoria: z.enum(["renda", "despesa", "conta", "poupanca"]).optional(),
  tipo: z.string().min(1, "Tipo é obrigatório").optional(),
  valor: z.number().min(0.01, "O valor deve ser maior que zero").optional(),
  description: z
    .string()
    .max(140, "Descrição muito longa (máx. 140 caracteres)")
    .optional(),
});

type UpdateTransactionFormValues = z.infer<typeof updateTransactionSchema>;

export default function Transactions() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [budget, setBudget] = useState<BudgetType | null>(null);

  // Modals for editing and deleting transactions
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false);
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  // Modal for detailed transaction view
  const [
    detailsModalOpened,
    { open: openDetailsModal, close: closeDetailsModal },
  ] = useDisclosure(false);
  const [selectedTransactionForDetails, setSelectedTransactionForDetails] =
    useState<Transaction | null>(null);

  const [searchParams] = useSearchParams();
  const [highlightedTransactionId, setHighlightedTransactionId] = useState<
    string | null
  >(null);
  const transactionRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>(
    {}
  );

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      data: new Date(),
      categoria: "renda",
      tipo: "",
      valor: 0,
      description: "",
    },
  });

  const editForm = useForm<UpdateTransactionFormValues>({
    resolver: zodResolver(updateTransactionSchema),
    defaultValues: {
      data: undefined,
      categoria: undefined,
      tipo: "",
      valor: undefined,
      description: "",
    },
  });

  const watchedCategory = form.watch("categoria");
  const watchedEditCategory = editForm.watch("categoria");

  // Fetch user groups on component mount
  useEffect(() => {
    const fetchUserGroups = async () => {
      try {
        const groups = await groupApi.getUserGroups();
        setUserGroups(groups);
        if (groups.length > 0) {
          setSelectedGroupId(groups[0]._id);
        } else {
          notifications.show({
            title: "Atenção",
            message:
              "Você não possui grupos. Crie um grupo para gerenciar lançamentos.",
            color: "yellow",
          });
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user groups:", error);
        notifications.show({
          title: "Erro",
          message: "Não foi possível carregar seus grupos.",
          color: "red",
        });
        setIsLoading(false);
      }
    };
    fetchUserGroups();
  }, []);

  // Effect to read category from URL on initial load
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      if (["renda", "despesa", "conta", "poupanca"].includes(categoryParam)) {
        setSelectedCategory(categoryParam);
      }
    }
  }, [searchParams]);

  // Effect to handle highlighting from URL
  useEffect(() => {
    const highlightId = searchParams.get("highlightId");
    if (highlightId) {
      setHighlightedTransactionId(highlightId);
      // Scroll to the item after transactions are loaded and rendered
      const timer = setTimeout(() => {
        const element = transactionRefs.current[highlightId];
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          // Remove highlight after a short delay
          setTimeout(() => setHighlightedTransactionId(null), 3000);
        }
      }, 500); // Give some time for rendering
      return () => clearTimeout(timer);
    }
  }, [searchParams, transactions]); // Depend on transactions to ensure they are loaded

  const fetchTransactionsAndBudget = useCallback(async () => {
    if (!selectedGroupId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const startDate = new Date(currentYear, currentMonth, 1).toISOString();
      const endDate = new Date(currentYear, currentMonth + 1, 0).toISOString();

      const groupBudgets = await budgetApi.getGroupBudgets(selectedGroupId);

      let currentMonthBudget: BudgetType | null = null;

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

      let fetchedBudget: BudgetType | null = null;
      if (currentMonthBudget) {
        const plannedItems: PlannedBudgetItem[] =
          await plannedBudgetItemApi.getPlannedBudgetItemsForBudget(
            currentMonthBudget._id
          );

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
          categorias: transformedCategories,
          totalRendaPlanejado,
          totalDespesaPlanejado,
          totalContaPlanejado,
          totalPoupancaPlanejado,
        };
      } else {
        fetchedBudget = {
          _id: "",
          grupoId: selectedGroupId,
          dataInicio: new Date(currentYear, currentMonth, 1).toISOString(),
          dataFim: new Date(currentYear, currentMonth + 1, 0).toISOString(),
          criadoPor: "",
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

      const transactionsData = await transactionApi.getTransactionsByGroup(
        selectedGroupId,
        startDate,
        endDate
      );

      setTransactions(transactionsData);
      setBudget(fetchedBudget);
    } catch (error) {
      console.error("Error fetching data:", error);
      notifications.show({
        title: "Erro",
        message: "Não foi possível carregar os lançamentos ou orçamento.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    if (selectedGroupId) {
      fetchTransactionsAndBudget();
    }
  }, [selectedGroupId, fetchTransactionsAndBudget]);

  const handleSubmit = async (values: TransactionFormValues) => {
    if (!selectedGroupId) {
      notifications.show({
        title: "Erro",
        message: "Nenhum grupo selecionado para criar o lançamento.",
        color: "red",
      });
      return;
    }
    try {
      const newTransaction = await transactionApi.createTransaction(
        selectedGroupId,
        values.data.toISOString(),
        values.categoria,
        values.tipo,
        values.valor,
        values.description || "" // Pass description, default to empty string if undefined
      );

      setTransactions((prev) => [...prev, newTransaction]);
      setIsModalOpen(false);
      form.reset();
      notifications.show({
        title: "Sucesso",
        message: "Lançamento criado com sucesso!",
        color: "green",
      });
    } catch (error) {
      console.error("Error creating transaction:", error);
      notifications.show({
        title: "Erro",
        message: "Não foi possível criar o lançamento.",
        color: "red",
      });
    }
  };

  const handleEditClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    editForm.reset({
      data: new Date(transaction.data),
      categoria: transaction.categoria,
      tipo: transaction.tipo,
      valor: transaction.valor,
      description: transaction.description || "", // Set description, default to empty string if undefined
    });
    openEditModal();
  };

  const handleUpdateTransaction = async (
    values: UpdateTransactionFormValues
  ) => {
    if (!selectedTransaction) return;

    try {
      const updates = {
        ...values,
        data: values.data ? values.data.toISOString() : undefined,
        // Ensure description is passed, even if empty string
        description:
          values.description !== undefined ? values.description : undefined,
      };

      const updatedTransaction = await transactionApi.updateTransaction(
        selectedTransaction._id,
        updates
      );

      setTransactions((prev) =>
        prev.map((t) =>
          t._id === updatedTransaction._id ? updatedTransaction : t
        )
      );
      closeEditModal();
      setSelectedTransaction(null);
      notifications.show({
        title: "Sucesso",
        message: "Lançamento atualizado com sucesso!",
        color: "green",
      });
    } catch (error) {
      console.error("Error updating transaction:", error);
      notifications.show({
        title: "Erro",
        message: "Não foi possível atualizar o lançamento.",
        color: "red",
      });
    }
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    openDeleteModal();
  };

  const handleConfirmDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      await transactionApi.deleteTransaction(selectedTransaction._id);
      setTransactions((prev) =>
        prev.filter((t) => t._id !== selectedTransaction._id)
      );
      closeDeleteModal();
      setSelectedTransaction(null);
      notifications.show({
        title: "Sucesso",
        message: "Lançamento excluído com sucesso!",
        color: "green",
      });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      notifications.show({
        title: "Erro",
        message: "Não foi possível excluir o lançamento.",
        color: "red",
      });
    }
  };

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransactionForDetails(transaction);
    openDetailsModal();
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.tipo
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || transaction.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  const availableTypesNew = budget
    ? Array.from(
        new Set(
          budget.categorias
            .filter((category) => category.tipo === watchedCategory)
            .flatMap((category) =>
              category.lancamentosPlanejados.map(
                (item: PlannedItem) => item.nome
              )
            )
        )
      ).map((type) => ({ value: type, label: type }))
    : [];

  const availableTypesEdit = budget
    ? Array.from(
        new Set(
          budget.categorias
            .filter((category) => category.tipo === watchedEditCategory)
            .flatMap((category) =>
              category.lancamentosPlanejados.map(
                (item: PlannedItem) => item.nome
              )
            )
        )
      ).map((type) => ({ value: type, label: type }))
    : [];

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
            variant="filled"
            leftSection={<IconPlus size={16} />}
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedGroupId}
          >
            Novo Lançamento
          </Button>

          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={fetchTransactionsAndBudget}
            disabled={!selectedGroupId}
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

      <Paper p="md" radius="md" withBorder mb="xl">
        <Group mb="md">
          <TextInput
            placeholder="Buscar por tipo..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1 }}
            disabled={!selectedGroupId}
          />

          <Select
            placeholder="Filtrar por categoria"
            leftSection={<IconFilter size={16} />}
            value={selectedCategory}
            onChange={setSelectedCategory}
            clearable
            data={[
              { value: "renda", label: "Receitas" },
              { value: "despesa", label: "Despesas" },
              { value: "conta", label: "Contas" },
              { value: "poupanca", label: "Poupança" },
            ]}
            disabled={!selectedGroupId}
          />
        </Group>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Data</Table.Th>
              <Table.Th>Categoria</Table.Th>
              <Table.Th>Tipo</Table.Th>
              <Table.Th>Descrição</Table.Th>
              <Table.Th>Criado por</Table.Th>
              <Table.Th style={{ textAlign: "right" }}>Valor</Table.Th>
              <Table.Th style={{ textAlign: "center" }}>Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Center>
                    <Loader size="sm" />
                    <Text ml="sm" c="dimmed">
                      Carregando...
                    </Text>
                  </Center>
                </Table.Td>
              </Table.Tr>
            ) : sortedTransactions.length === 0 && selectedGroupId ? (
              <Table.Tr>
                <Table.Td colSpan={7} style={{ textAlign: "center" }}>
                  <Text c="dimmed">Nenhum lançamento encontrado</Text>
                </Table.Td>
              </Table.Tr>
            ) : !selectedGroupId ? (
              <Table.Tr>
                <Table.Td colSpan={7} style={{ textAlign: "center" }}>
                  <Text c="dimmed">
                    Selecione ou crie um grupo para visualizar lançamentos.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              sortedTransactions.map((transaction) => (
                <Table.Tr
                  key={transaction._id}
                  ref={(el) => (transactionRefs.current[transaction._id] = el)}
                  style={{
                    transition: "background-color 0.5s ease-in-out",
                    backgroundColor:
                      highlightedTransactionId === transaction._id
                        ? "var(--mantine-color-yellow-light)"
                        : "transparent",
                    cursor: "pointer", // Indicate that the row is clickable
                  }}
                  onClick={() => handleRowClick(transaction)} // Add click handler
                >
                  <Table.Td>
                    {new Date(transaction.data).toLocaleDateString("pt-BR")}
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        transaction.categoria === "renda"
                          ? "green"
                          : transaction.categoria === "despesa"
                          ? "red"
                          : transaction.categoria === "conta"
                          ? "orange"
                          : "blue"
                      }
                    >
                      {transaction.categoria === "renda"
                        ? "Receita"
                        : transaction.categoria === "despesa"
                        ? "Despesa"
                        : transaction.categoria === "conta"
                        ? "Conta"
                        : "Poupança"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{transaction.tipo}</Table.Td>
                  <Table.Td>
                    <Text lineClamp={1} title={transaction.description}>
                      {transaction.description || "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>{transaction.criadoPorNome}</Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text
                      fw={500}
                      c={
                        transaction.categoria === "renda"
                          ? "green"
                          : transaction.categoria === "despesa"
                          ? "red"
                          : transaction.categoria === "conta"
                          ? "orange"
                          : "blue"
                      }
                    >
                      {formatCurrency(transaction.valor)}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "center" }}>
                    <Flex gap="xs" justify="center">
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click from firing
                          handleEditClick(transaction);
                        }}
                        aria-label="Editar lançamento"
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click from firing
                          handleDeleteClick(transaction);
                        }}
                        aria-label="Excluir lançamento"
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Flex>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Add New Transaction Modal */}
      <Modal
        opened={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          form.reset();
        }}
        title="Novo Lançamento"
        size="md"
        centered
      >
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Stack>
              <Controller
                name="data"
                control={form.control}
                render={({ field }) => (
                  <DatePickerInput
                    label="Data"
                    required
                    valueFormat="DD/MM/YYYY"
                    locale="pt-br"
                    placeholder="Selecione a data"
                    error={form.formState.errors.data?.message}
                    {...field}
                    value={field.value ? new Date(field.value) : null}
                    onChange={(val) => field.onChange(val)}
                  />
                )}
              />

              <Controller
                name="categoria"
                control={form.control}
                render={({ field }) => (
                  <Select
                    label="Categoria"
                    required
                    data={[
                      { value: "renda", label: "Receita" },
                      { value: "despesa", label: "Despesa" },
                      { value: "conta", label: "Conta" },
                      { value: "poupanca", label: "Poupança" },
                    ]}
                    error={form.formState.errors.categoria?.message}
                    {...field}
                  />
                )}
              />

              <Controller
                name="tipo"
                control={form.control}
                render={({ field }) => (
                  <Select
                    label="Tipo"
                    required
                    placeholder="Selecione o tipo de lançamento"
                    data={availableTypesNew}
                    searchable
                    clearable
                    nothingFoundMessage="Nenhum tipo encontrado para esta categoria. Crie em Orçamento."
                    error={form.formState.errors.tipo?.message}
                    {...field}
                  />
                )}
              />

              <Controller
                name="valor"
                control={form.control}
                render={({ field }) => (
                  <CurrencyInput
                    label="Valor"
                    required
                    error={form.formState.errors.valor?.message}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                  />
                )}
              />

              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <TextInput
                    label="Descrição (opcional)"
                    placeholder="Adicione uma breve descrição"
                    maxLength={140}
                    error={form.formState.errors.description?.message}
                    {...field}
                  />
                )}
              />

              <Button type="submit" fullWidth mt="md">
                Salvar
              </Button>
            </Stack>
          </form>
        </FormProvider>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal
        opened={editModalOpened}
        onClose={closeEditModal}
        title="Editar Lançamento"
        size="md"
        centered
      >
        {selectedTransaction && (
          <FormProvider {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateTransaction)}>
              <Stack>
                <Controller
                  name="data"
                  control={editForm.control}
                  render={({ field }) => (
                    <DatePickerInput
                      label="Data"
                      required
                      valueFormat="DD/MM/YYYY"
                      locale="pt-br"
                      placeholder="Selecione a data"
                      error={editForm.formState.errors.data?.message}
                      {...field}
                      value={field.value ? new Date(field.value) : null}
                      onChange={(val) => field.onChange(val)}
                    />
                  )}
                />

                <Controller
                  name="categoria"
                  control={editForm.control}
                  render={({ field }) => (
                    <Select
                      label="Categoria"
                      required
                      data={[
                        { value: "renda", label: "Receita" },
                        { value: "despesa", label: "Despesa" },
                        { value: "conta", label: "Conta" },
                        { value: "poupanca", label: "Poupança" },
                      ]}
                      error={editForm.formState.errors.categoria?.message}
                      {...field}
                    />
                  )}
                />

                <Controller
                  name="tipo"
                  control={editForm.control}
                  render={({ field }) => (
                    <Select
                      label="Tipo"
                      required
                      placeholder="Selecione o tipo de lançamento"
                      data={availableTypesEdit}
                      searchable
                      clearable
                      nothingFoundMessage="Nenhum tipo encontrado para esta categoria. Crie em Orçamento."
                      error={editForm.formState.errors.tipo?.message}
                      {...field}
                    />
                  )}
                />

                <Controller
                  name="valor"
                  control={editForm.control}
                  render={({ field }) => (
                    <CurrencyInput
                      label="Valor"
                      required
                      error={editForm.formState.errors.valor?.message}
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                    />
                  )}
                />

                <Controller
                  name="description"
                  control={editForm.control}
                  render={({ field }) => (
                    <TextInput
                      label="Descrição (opcional)"
                      placeholder="Adicione uma breve descrição"
                      maxLength={140}
                      error={editForm.formState.errors.description?.message}
                      {...field}
                    />
                  )}
                />

                <Button type="submit" fullWidth mt="md">
                  Salvar Alterações
                </Button>
              </Stack>
            </form>
          </FormProvider>
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
          Tem certeza de que deseja excluir o lançamento "
          <b>{selectedTransaction?.tipo}</b>" (
          {selectedTransaction?.valor !== undefined
            ? formatCurrency(selectedTransaction.valor)
            : ""}
          )? Esta ação não pode ser desfeita.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeDeleteModal}>
            Cancelar
          </Button>
          <Button color="red" onClick={handleConfirmDeleteTransaction}>
            Excluir
          </Button>
        </Group>
      </Modal>

      {/* Transaction Details Modal */}
      <Modal
        opened={detailsModalOpened}
        onClose={closeDetailsModal}
        title={
          <Group gap="xs">
            <IconInfoCircle size={20} />
            <Text fw={700}>Detalhes do Lançamento</Text>
          </Group>
        }
        size="md"
        centered
      >
        {selectedTransactionForDetails && (
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={500}>Data:</Text>
              <Text>
                {new Date(
                  selectedTransactionForDetails.data
                ).toLocaleDateString("pt-BR")}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Categoria:</Text>
              <Badge
                color={
                  selectedTransactionForDetails.categoria === "renda"
                    ? "green"
                    : selectedTransactionForDetails.categoria === "despesa"
                    ? "red"
                    : selectedTransactionForDetails.categoria === "conta"
                    ? "orange"
                    : "blue"
                }
              >
                {selectedTransactionForDetails.categoria === "renda"
                  ? "Receita"
                  : selectedTransactionForDetails.categoria === "despesa"
                  ? "Despesa"
                  : selectedTransactionForDetails.categoria === "conta"
                  ? "Conta"
                  : "Poupança"}
              </Badge>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Tipo:</Text>
              <Text>{selectedTransactionForDetails.tipo}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Valor:</Text>
              <Text
                fw={500}
                c={
                  selectedTransactionForDetails.categoria === "renda"
                    ? "green"
                    : selectedTransactionForDetails.categoria === "despesa"
                    ? "red"
                    : selectedTransactionForDetails.categoria === "conta"
                    ? "orange"
                    : "blue"
                }
              >
                {formatCurrency(selectedTransactionForDetails.valor)}
              </Text>
            </Group>
            <Group justify="space-between" align="flex-start">
              <Text fw={500}>Descrição:</Text>
              <Text style={{ maxWidth: "70%", textAlign: "right" }}>
                {selectedTransactionForDetails.description || "N/A"}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Criado por:</Text>
              <Text>{selectedTransactionForDetails.criadoPorNome}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Criado em:</Text>
              <Text>
                {new Date(
                  selectedTransactionForDetails.createdAt
                ).toLocaleString("pt-BR")}
              </Text>
            </Group>
            {selectedTransactionForDetails.updatedAt && (
              <Group justify="space-between">
                <Text fw={500}>Última atualização:</Text>
                <Text>
                  {new Date(
                    selectedTransactionForDetails.updatedAt
                  ).toLocaleString("pt-BR")}
                </Text>
              </Group>
            )}
            <Divider my="sm" />
            <Group justify="flex-end">
              <Button variant="default" onClick={closeDetailsModal}>
                Fechar
              </Button>
              <Button
                onClick={() => {
                  closeDetailsModal();
                  handleEditClick(selectedTransactionForDetails);
                }}
              >
                Editar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </motion.div>
  );
}
