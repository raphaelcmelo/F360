import { useEffect, useState } from 'react';
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
  Loader,
  Center,
} from '@mantine/core';
import { motion } from 'framer-motion';
import {
  IconArrowLeft,
  IconWallet,
  IconChartBar,
  IconUsers,
  IconPlus,
  IconEdit,
  IconTrash,
  IconUserPlus,
  IconUserMinus,
  IconBuildingBank,
} from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { activityLogApi } from '../../services/api';
import { ActivityLog } from '../../types/activityLog';

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [historyEntries, setHistoryEntries] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user || !user.activeGroup) {
        setLoading(false);
        setError('Nenhum grupo ativo selecionado.');
        return;
      }

      try {
        setLoading(true);
        const data = await activityLogApi.getActivitiesByGroup(user.activeGroup);
        setHistoryEntries(data);
      } catch (err) {
        console.error('Failed to fetch activity history:', err);
        setError('Falha ao carregar o histórico de atividades.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'transaction_created':
        return <IconPlus size={18} />;
      case 'transaction_updated':
        return <IconEdit size={18} />;
      case 'transaction_deleted':
        return <IconTrash size={18} />;
      case 'budget_item_created':
        return <IconPlus size={18} />;
      case 'budget_item_updated':
        return <IconEdit size={18} />;
      case 'budget_item_deleted':
        return <IconTrash size={18} />;
      case 'member_invited':
        return <IconUserPlus size={18} />;
      case 'member_removed':
        return <IconUserMinus size={18} />;
      case 'group_created':
        return <IconBuildingBank size={18} />;
      case 'group_updated':
        return <IconEdit size={18} />;
      case 'group_deleted':
        return <IconTrash size={18} />;
      default:
        return <IconWallet size={18} />;
    }
  };

  const getActivityColor = (actionType: string) => {
    if (actionType.includes('created')) return 'green';
    if (actionType.includes('updated')) return 'blue';
    if (actionType.includes('deleted')) return 'red';
    if (actionType.includes('invited')) return 'teal';
    if (actionType.includes('removed')) return 'orange';
    if (actionType.includes('group')) return 'violet';
    return 'gray';
  };

  const renderHistoryItem = (item: ActivityLog) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString('pt-BR');
    const formattedTime = new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
      <Card key={item._id} withBorder mb="sm">
        <Group wrap="nowrap" gap="md">
          <ThemeIcon
            size="lg"
            radius="xl"
            color={getActivityColor(item.actionType)}
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
