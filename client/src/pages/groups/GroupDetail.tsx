import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper,
  Title,
  Text,
  Group,
  Avatar,
  Button,
  Stack,
  ActionIcon,
  Divider,
  Box,
  Card,
} from '@mantine/core';
import { motion } from 'framer-motion';
import {
  IconArrowLeft,
  IconPlus,
  IconEye,
  IconUsers,
  IconReceipt2,
} from '@tabler/icons-react';

export default function GroupDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Dummy data for group details
  const group = {
    id: id,
    name: `Grupo de Amigos ${id}`,
    description: 'Gerenciamento de despesas entre amigos para viagens e eventos.',
    members: [
      {
        id: '1',
        name: 'Alice',
        avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      },
      {
        id: '2',
        name: 'Bob',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      },
      {
        id: '3',
        name: 'Charlie',
        avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      },
      {
        id: '4',
        name: 'Diana',
        avatar: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      },
    ],
    recentTransactions: [
      {
        id: 't1',
        description: 'Jantar no restaurante',
        amount: 120.5,
        date: '2023-10-26',
      },
      {
        id: 't2',
        description: 'Ingressos para o cinema',
        amount: 45.0,
        date: '2023-10-25',
      },
      {
        id: 't3',
        description: 'Aluguel de carro',
        amount: 300.0,
        date: '2023-10-24',
      },
    ],
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
        <Title order={2}>{group.name}</Title>
      </Group>

      <Stack gap="lg">
        <Paper p="md" radius="md" withBorder>
          <Title order={3} mb="md">
            Descrição do Grupo
          </Title>
          <Text>{group.description}</Text>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Title order={3} mb="lg">
            Membros
          </Title>
          <Group gap="lg">
            {group.members.map((member) => (
              <Box key={member.id} style={{ textAlign: 'center' }}>
                <Avatar
                  src={member.avatar}
                  size="lg"
                  radius="xl"
                  mb="xs"
                  alt={member.name}
                />
                <Text size="sm" fw={500}>
                  {member.name}
                </Text>
              </Box>
            ))}
          </Group>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={3}>Lançamentos Recentes</Title>
            <Button
              variant="light"
              size="xs"
              component="a"
              href="/lancamentos"
            >
              Ver todos
            </Button>
          </Group>

          <Stack gap="xs">
            {group.recentTransactions.map((transaction) => (
              <Card key={transaction.id} withBorder padding="sm">
                <Group justify="space-between" wrap="nowrap">
                  <div>
                    <Text fw={500}>{transaction.description}</Text>
                    <Text size="sm" c="dimmed">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </Text>
                  </div>
                  <Text fw={700} style={{ whiteSpace: 'nowrap' }}>
                    R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                </Group>
              </Card>
            ))}
          </Stack>
        </Paper>

        <Stack gap="md">
          <Button
            fullWidth
            size="lg"
            leftSection={<IconPlus size={20} />}
          >
            Adicionar Lançamento
          </Button>
          
          <Button
            fullWidth
            size="lg"
            variant="light"
            leftSection={<IconEye size={20} />}
          >
            Ver Todos os Lançamentos
          </Button>
        </Stack>
      </Stack>
    </motion.div>
  );
}
