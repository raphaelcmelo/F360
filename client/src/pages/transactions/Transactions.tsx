import { useState, useEffect, useCallback } from "react";
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
} from "@mantine/core";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DatePickerInput } from "@mantine/dates";
import { motion } from "framer-motion";
import {
  IconPlus,
  IconDotsVertical,
  IconDownload,
  IconRefresh,
  IconSearch,
  IconFilter,
} from "@tabler/icons-react";
import { mockApi, transactionApi } from "../../services/api"; // Import transactionApi
import GroupSelector from "../../components/ui/GroupSelector";
import { Transaction } from "../../types/transaction";
import { Budget as BudgetType, PlannedItem } from "../../types/budget";
import CurrencyInput from "../../components/ui/CurrencyInput";
import { notifications } from "@mantine/notifications";

// Define the schema for the transaction form
const transactionSchema = z.object({
  data: z.date({ required_error: "Data é obrigatória" }),
  categoria: z.enum(["renda", "despesa", "conta", "poupanca"], {
    required_error: "Categoria é obrigatória",
  }),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  valor: z.number().min(0.01, "O valor deve ser maior que zero"),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export default function Transactions() {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("group1"); // TODO: Replace with actual user's active group ID
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [budget, setBudget] = useState<BudgetType | null>(null);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      data: new Date(),
      categoria: "renda",
      tipo: "",
      valor: 0,
    },
  });

  const fetchTransactionsAndBudget = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentDate = new Date();
      const startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      ).toISOString();
      const endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ).toISOString();

      const [transactionsData, budgetData] = await Promise.all([
        transactionApi.getTransactionsByGroup(
          selectedGroupId,
          startDate,
          endDate
        ), // Use real API
        mockApi.budgets.getByGroup(selectedGroupId), // Keep mock for budget for now
      ]);

      setTransactions(transactionsData);
      setBudget(budgetData);
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
    fetchTransactionsAndBudget();
  }, [fetchTransactionsAndBudget]);

  const handleSubmit = async (values: TransactionFormValues) => {
    try {
      const newTransaction = await transactionApi.createTransaction(
        selectedGroupId,
        values.data.toISOString(),
        values.categoria,
        values.tipo,
        values.valor
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

  const availableTypes = budget
    ? Array.from(
        new Set(
          budget.categorias.flatMap((category) =>
            category.lancamentosPlanejados.map((item: PlannedItem) => item.nome)
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
        <GroupSelector value={selectedGroupId} onChange={setSelectedGroupId} />

        <Group>
          <Button
            variant="filled"
            leftSection={<IconPlus size={16} />}
            onClick={() => setIsModalOpen(true)}
          >
            Novo Lançamento
          </Button>

          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={fetchTransactionsAndBudget} // Refresh from backend
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
          />
        </Group>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Data</Table.Th>
              <Table.Th>Categoria</Table.Th>
              <Table.Th>Tipo</Table.Th>
              <Table.Th>Criado por</Table.Th>
              <Table.Th style={{ textAlign: "right" }}>Valor</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Center>
                    <Loader size="sm" />
                    <Text ml="sm" c="dimmed">
                      Carregando...
                    </Text>
                  </Center>
                </Table.Td>
              </Table.Tr>
            ) : sortedTransactions.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5} style={{ textAlign: "center" }}>
                  <Text c="dimmed">Nenhum lançamento encontrado</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              sortedTransactions.map((transaction) => (
                <Table.Tr key={transaction._id}>
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
                  <Table.Td>{transaction.criadoPorNome}</Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text
                      fw={500}
                      c={
                        transaction.categoria === "renda" ? "green" : undefined
                      }
                    >
                      R${" "}
                      {transaction.valor.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal
        opened={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          form.reset(); // Reset form on close
        }}
        title="Novo Lançamento"
        size="md"
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
                    value={field.value ? new Date(field.value) : null} // Ensure Date object for DatePickerInput
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
                    data={availableTypes}
                    searchable
                    clearable
                    nothingFoundMessage="Nenhum tipo encontrado. Crie em Orçamento."
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

              <Button type="submit" fullWidth mt="md">
                Salvar
              </Button>
            </Stack>
          </form>
        </FormProvider>
      </Modal>
    </motion.div>
  );
}
