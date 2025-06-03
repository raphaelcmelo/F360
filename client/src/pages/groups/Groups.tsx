import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Text,
  Button,
  Group,
  Stack,
  Modal,
  TextInput,
  ActionIcon,
  Menu,
  Badge,
  Paper,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { motion } from 'framer-motion';
import {
  IconPlus,
  IconDotsVertical,
  IconTrash,
  IconEdit,
  IconUsers,
  IconChartBar,
} from '@tabler/icons-react';
import { mockApi } from '../../services/api';
import { Group as GroupType } from '../../types/group';

export default function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupType | null>(null);

  const form = useForm({
    initialValues: {
      nome: '',
    },
    validate: {
      nome: (value) => (value.length >= 3 ? null : 'Nome deve ter pelo menos 3 caracteres'),
    },
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const data = await mockApi.groups.getAll();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível carregar os grupos',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (values: typeof form.values) => {
    try {
      // Mock API call - in a real app this would create the group
      await new Promise(resolve => setTimeout(resolve, 800));
      
      notifications.show({
        title: 'Sucesso',
        message: 'Grupo criado com sucesso',
        color: 'green',
      });
      
      setCreateModalOpen(false);
      form.reset();
      fetchGroups();
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível criar o grupo',
        color: 'red',
      });
    }
  };

  const handleEditGroup = async (values: typeof form.values) => {
    try {
      // Mock API call - in a real app this would update the group
      await new Promise(resolve => setTimeout(resolve, 800));
      
      notifications.show({
        title: 'Sucesso',
        message: 'Grupo atualizado com sucesso',
        color: 'green',
      });
      
      setEditingGroup(null);
      form.reset();
      fetchGroups();
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível atualizar o grupo',
        color: 'red',
      });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      // Mock API call - in a real app this would delete the group
      await new Promise(resolve => setTimeout(resolve, 800));
      
      notifications.show({
        title: 'Sucesso',
        message: 'Grupo excluído com sucesso',
        color: 'green',
      });
      
      fetchGroups();
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível excluir o grupo',
        color: 'red',
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <Stack className="page-transition">
      <Group justify="space-between" mb="xl">
        <Text size="xl" fw={700}>
          Meus Grupos Financeiros
        </Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpen(true)}
        >
          Novo Grupo
        </Button>
      </Group>

      {isLoading ? (
        <Stack>
          {[1, 2, 3].map((n) => (
            <Paper key={n} p="md" withBorder>
              <Group justify="space-between">
                <Stack gap="xs">
                  <div style={{ width: 150, height: 24, background: '#f1f3f5', borderRadius: 4 }} />
                  <div style={{ width: 100, height: 16, background: '#f1f3f5', borderRadius: 4 }} />
                </Stack>
                <div style={{ width: 40, height: 40, background: '#f1f3f5', borderRadius: 4 }} />
              </Group>
            </Paper>
          ))}
        </Stack>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {groups.length > 0 ? (
            <Stack gap="md">
              {groups.map((group) => (
                <motion.div key={group._id} variants={itemVariants}>
                  <Card withBorder>
                    <Group justify="space-between" wrap="nowrap">
                      <Stack gap="xs">
                        <Text size="lg" fw={500}>
                          {group.nome}
                        </Text>
                        <Group gap="xs">
                          <Badge
                            leftSection={<IconUsers size={12} />}
                            variant="light"
                            color="blue"
                          >
                            {Array.isArray(group.membros) ? group.membros.length : 0} membros
                          </Badge>
                          <Badge
                            leftSection={<IconChartBar size={12} />}
                            variant="light"
                            color="green"
                          >
                            {group.orcamentos.length} orçamentos
                          </Badge>
                        </Group>
                      </Stack>

                      <Group gap="xs">
                        <Button
                          variant="light"
                          onClick={() => navigate(`/grupo/${group._id}`)}
                        >
                          Acessar
                        </Button>
                        <Menu shadow="md" width={200} position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="light" size="lg" radius="md">
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>

                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={() => {
                                setEditingGroup(group);
                                form.setValues({ nome: group.nome });
                              }}
                            >
                              Editar
                            </Menu.Item>
                            <Menu.Item
                              color="red"
                              leftSection={<IconTrash size={14} />}
                              onClick={() => handleDeleteGroup(group._id)}
                            >
                              Excluir
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Group>
                  </Card>
                </motion.div>
              ))}
            </Stack>
          ) : (
            <Card withBorder py="xl">
              <Stack align="center" gap="md">
                <Text c="dimmed" ta="center">
                  Você ainda não tem nenhum grupo financeiro.
                  <br />
                  Crie seu primeiro grupo para começar!
                </Text>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => setCreateModalOpen(true)}
                >
                  Criar Grupo
                </Button>
              </Stack>
            </Card>
          )}
        </motion.div>
      )}

      <Modal
        opened={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          form.reset();
        }}
        title="Criar Novo Grupo"
      >
        <form onSubmit={form.onSubmit(handleCreateGroup)}>
          <Stack>
            <TextInput
              required
              label="Nome do grupo"
              placeholder="Ex: Família Silva"
              {...form.getInputProps('nome')}
            />
            <Button type="submit" fullWidth>
              Criar Grupo
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={!!editingGroup}
        onClose={() => {
          setEditingGroup(null);
          form.reset();
        }}
        title="Editar Grupo"
      >
        <form onSubmit={form.onSubmit(handleEditGroup)}>
          <Stack>
            <TextInput
              required
              label="Nome do grupo"
              placeholder="Ex: Família Silva"
              {...form.getInputProps('nome')}
            />
            <Button type="submit" fullWidth>
              Salvar Alterações
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
