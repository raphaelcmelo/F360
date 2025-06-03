import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  ActionIcon,
  Card,
  ThemeIcon,
} from '@mantine/core';
import { motion } from 'framer-motion';
import {
  IconArrowLeft,
  IconWallet,
  IconChartBar,
  IconUsers,
} from '@tabler/icons-react';

export default function History() {
  const navigate = useNavigate();

  // Dummy data for history entries
  const historyEntries = [
    {
      id: 'h1',
      type: 'transaction',
      description: 'Pagamento de aluguel',
      amount: 1500.0,
      date: '2023-10-26',
      category: 'Moradia',
    },
    {
      id: 'h2',
      type: 'budget_change',
      description: 'Orçamento de alimentação ajustado',
      oldValue: 500,
      newValue: 600,
      date: '2023-10-25',
    },
    {
      id: 'h3',
      type: 'transaction',
      description: 'Compra de supermercado',
      amount: 230.75,
      date: '2023-10-24',
      category: 'Alimentação',
    },
    {
      id: 'h4',
      type: 'transaction',
      description: 'Assinatura de streaming',
      amount: 39.9,
      date: '2023-10-23',
      category: 'Entretenimento',
    },
    {
      id: 'h5',
      type: 'group_activity',
      description: 'Novo membro adicionado ao "Grupo Viagem"',
      date: '2023-10-22',
    },
    {
      id: 'h6',
      type: 'transaction',
      description: 'Manutenção do carro',
      amount: 450.0,
      date: '2023-10-21',
      category: 'Transporte',
    },
    {
      id: 'h7',
      type: 'budget_change',
      description: 'Orçamento de transporte ajustado',
      oldValue: 300,
      newValue: 350,
      date: '2023-10-20',
    },
    {
      id: 'h8',
      type: 'transaction',
      description: 'Consulta médica',
      amount: 200.0,
      date: '2023-10-19',
      category: 'Saúde',
    },
    {
      id: 'h9',
      type: 'transaction',
      description: 'Presente de aniversário',
      amount: 100.0,
      date: '2023-10-18',
      category: 'Presentes',
    },
    {
      id: 'h10',
      type: 'group_activity',
      description: 'Despesa "Jantar de Grupo" adicionada',
      date: '2023-10-17',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return <IconWallet size={18} />;
      case 'budget_change':
        return <IconChartBar size={18} />;
      case 'group_activity':
        return <IconUsers size={18} />;
      default:
        return <IconWallet size={18} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'blue';
      case 'budget_change':
        return 'green';
      case 'group_activity':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const renderHistoryItem = (item: (typeof historyEntries)[0]) => {
    const formattedDate = new Date(item.date).toLocaleDateString('pt-BR');

    return (
      <Card key={item.id} withBorder mb="sm">
        <Group wrap="nowrap" gap="md">
          <ThemeIcon
            size="lg"
            radius="xl"
            color={getActivityColor(item.type)}
            variant="light"
          >
            {getActivityIcon(item.type)}
          </ThemeIcon>

          <div style={{ flex: 1 }}>
            <Text fw={500}>{item.description}</Text>
            {item.type === 'transaction' && (
              <Text size="sm" c="dimmed">
                {item.category}
              </Text>
            )}
            {item.type === 'budget_change' && (
              <Text size="sm" c="green">
                De R$ {item.oldValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para R${' '}
                {item.newValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            )}
          </div>

          <Stack gap={0} align="flex-end">
            {item.type === 'transaction' && (
              <Text fw={700}>
                R$ {item.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            )}
            <Text size="sm" c="dimmed">
              {formattedDate}
            </Text>
          </Stack>
        </Group>
      </Card>
    );
  };

  return (
    <motion.div
      className="page-transition"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Group mb="xl" align="center">
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

      <Paper p="md" radius="md" withBorder>
        {historyEntries.length > 0 ? (
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