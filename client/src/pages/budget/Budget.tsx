import { useState, useEffect } from "react";
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
import { useCallback } from "react";
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
  const [selectedGroupId, setSelectedGroupId] = useState<string>("group1");
  const [budget, setBudget] = useState<BudgetType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  const fetchBudget = useCallback(async () => {
    setIsLoading(true);
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
      setBudget(null); // Clear budget on error
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

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

      // If the category didn't exist, add it (though mock API always provides all types)
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
    reset(); // Reset form fields after submission
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
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={fetchBudget}
            loading={isLoading}
          >
            Atualizar
          </Button>

          <Button
            variant="filled"
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              reset(); // Reset form before opening
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
                  {isLoading ? (
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
