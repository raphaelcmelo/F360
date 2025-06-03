import { useState, useEffect } from "react";
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
  NumberInput,
  Stack,
  Modal,
} from "@mantine/core";
import { useForm, Controller } from "@mantine/form";
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
import { mockApi } from "../../services/api";
import GroupSelector from "../../components/ui/GroupSelector";
import { Transaction } from "../../types/transaction";
import { Budget as BudgetType, PlannedItem } from "../../types/budget";
import CurrencyInput from '../../components/ui/CurrencyInput';

export default function Transactions() {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("group1");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [budget, setBudget] = useState<BudgetType | null>(null);

  const form = useForm({
    initialValues: {
      data: new Date(),
      categoria: "",
      tipo: "",
      valor: 0,
    },
    validate: {
      categoria: (value) => (!value ? "Categoria é obrigatória" : null),
      tipo: (value) => (!value ? "Tipo é obrigatório" : null),
      valor: (value) => (value <= 0 ? "Valor deve ser maior que zero" : null),
    },
  });

  useEffect(() => {
    const fetchTransactionsAndBudget = async () => {
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
          mockApi.transactions.getByGroup(selectedGroupId, startDate, endDate),
          mockApi.budgets.getByGroup(selectedGroupId),
        ]);

        setTransactions(transactionsData);
        setBudget(budgetData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionsAndBudget();
  }, [selectedGroupId]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const newTransaction: Transaction = {
        _id: Math.random().toString(),
        grupoId: selectedGroupId,
        criadoPor: "123",
        criadoPorNome: "Demo User",
        data: values.data.toISOString(),
        categoria: values.categoria as
          | "renda"
          | "despesa"
          | "conta"
          | "poupanca",
        tipo: values.tipo,
        valor: values.valor,
        createdAt: new Date().toISOString(),
      };

      setTransactions((prev) => [...prev, newTransaction]);
      setIsModalOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating transaction:", error);
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
            {!isLoading &&
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
              ))}
            {!isLoading && sortedTransactions.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5} style={{ textAlign: "center" }}>
                  <Text c="dimmed">Nenhum lançamento encontrado</Text>
                </Table.Td>
              </Table.Tr>
            )}
            {isLoading && (
              <Table.Tr>
                <Table.Td colSpan={5} style={{ textAlign: "center" }}>
                  <Text c="dimmed">Carregando...</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Lançamento"
        size="md"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <DatePickerInput
              label="Data"
              required
              valueFormat="DD/MM/YYYY"
              locale="pt-br"
              placeholder="Selecione a data"
              {...form.getInputProps("data")}
            />

            <Select
              label="Categoria"
              required
              data={[
                { value: "renda", label: "Receita" },
                { value: "despesa", label: "Despesa" },
                { value: "conta", label: "Conta" },
                { value: "poupanca", label: "Poupança" },
              ]}
              {...form.getInputProps("categoria")}
            />

            <Select
              label="Tipo"
              required
              placeholder="Selecione o tipo de lançamento"
              data={availableTypes}
              searchable
              clearable
              nothingFoundMessage="Nenhum tipo encontrado. Crie em Orçamento."
              {...form.getInputProps("tipo")}
            />

            <Controller
              name="valor"
              control={form.control}
              render={({ field }) => (
                <CurrencyInput
                  label="Valor"
                  required
                  error={form.errors.valor?.message}
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
      </Modal>
    </motion.div>
  );
}