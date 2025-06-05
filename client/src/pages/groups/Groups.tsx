import { useState, useEffect, useCallback } from "react";
import {
  Paper,
  Text,
  Group,
  Button,
  ActionIcon,
  Menu,
  Table,
  TextInput,
  Stack,
  Modal,
  Loader,
  Center,
  Flex,
} from "@mantine/core";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDisclosure } from "@mantine/hooks";
import { motion } from "framer-motion";
import {
  IconPlus,
  IconDotsVertical,
  IconDownload,
  IconRefresh,
  IconEdit,
  IconTrash,
  IconUserPlus,
} from "@tabler/icons-react";
import { groupApi } from "../../services/api";
import { Group as UserGroup } from "../../types/group";
import { notifications } from "@mantine/notifications";

// Schema for creating a new group
const createGroupSchema = z.object({
  nome: z.string().min(1, "O nome do grupo é obrigatório"),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

// Schema for inviting a member
const inviteMemberSchema = z.object({
  email: z.string().email("Formato de e-mail inválido"),
});

type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;

export default function Groups() {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] =
    useDisclosure(false);
  const [inviteModalOpened, { open: openInviteModal, close: closeInviteModal }] =
    useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);

  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);

  // Forms
  const createForm = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      nome: "",
    },
  });

  const inviteForm = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
    },
  });

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedGroups = await groupApi.getUserGroups();
      setGroups(fetchedGroups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      notifications.show({
        title: "Erro",
        message: "Não foi possível carregar seus grupos.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreateGroup = async (values: CreateGroupFormValues) => {
    try {
      const newGroup = await groupApi.createGroup(values.nome);
      notifications.show({
        title: "Sucesso",
        message: `Grupo "${newGroup.nome}" criado com sucesso!`,
        color: "green",
      });
      closeCreateModal();
      createForm.reset();
      fetchGroups(); // Re-fetch groups to update the list
    } catch (error) {
      console.error("Error creating group:", error);
      notifications.show({
        title: "Erro",
        message: "Não foi possível criar o grupo.",
        color: "red",
      });
    }
  };

  const handleInviteMemberClick = (group: UserGroup) => {
    setSelectedGroup(group);
    inviteForm.reset();
    openInviteModal();
  };

  const handleInviteMember = async (values: InviteMemberFormValues) => {
    if (!selectedGroup) return;

    try {
      await groupApi.inviteMember(selectedGroup._id, values.email);
      notifications.show({
        title: "Sucesso",
        message: `Convite enviado para ${values.email} no grupo "${selectedGroup.displayName || selectedGroup.nome}"!`,
        color: "green",
      });
      closeInviteModal();
      inviteForm.reset();
    } catch (error: any) {
      console.error("Error inviting member:", error);
      notifications.show({
        title: "Erro",
        message:
          error.response?.data?.error || "Não foi possível enviar o convite.",
        color: "red",
      });
    }
  };

  const handleDeleteGroupClick = (group: UserGroup) => {
    setSelectedGroup(group);
    openDeleteModal();
  };

  const handleConfirmDeleteGroup = async () => {
    if (!selectedGroup) return;

    try {
      await groupApi.deleteGroup(selectedGroup._id);
      setGroups((prev) => prev.filter((g) => g._id !== selectedGroup._id));
      notifications.show({
        title: "Sucesso",
        message: `Grupo "${selectedGroup.displayName || selectedGroup.nome}" excluído com sucesso!`,
        color: "green",
      });
      closeDeleteModal();
      setSelectedGroup(null);
    } catch (error: any) {
      console.error("Error deleting group:", error);
      notifications.show({
        title: "Erro",
        message:
          error.response?.data?.error || "Não foi possível excluir o grupo.",
        color: "red",
      });
    }
  };

  return (
    <motion.div
      className="page-transition"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Group justify="space-between" mb="xl">
        <Text size="xl" fw={700}>
          Meus Grupos
        </Text>
        <Group>
          <Button
            variant="filled"
            leftSection={<IconPlus size={16} />}
            onClick={openCreateModal}
          >
            Novo Grupo
          </Button>

          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={fetchGroups}
            loading={isLoading}
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
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nome do Grupo</Table.Th> {/* Renamed from "Nome de Exibição" */}
              <Table.Th>Membros</Table.Th>
              <Table.Th>Criado Em</Table.Th>
              <Table.Th style={{ textAlign: "center" }}>Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={4}> {/* Adjusted colspan */}
                  <Center>
                    <Loader size="sm" />
                    <Text ml="sm" c="dimmed">
                      Carregando...
                    </Text>
                  </Center>
                </Table.Td>
              </Table.Tr>
            ) : groups.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4} style={{ textAlign: "center" }}> {/* Adjusted colspan */}
                  <Text c="dimmed">Nenhum grupo encontrado.</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              groups.map((group) => (
                <Table.Tr key={group._id}>
                  <Table.Td>{group.displayName || group.nome}</Table.Td> {/* Display displayName or nome */}
                  <Table.Td>{group.membros?.length || 0}</Table.Td>
                  <Table.Td>
                    {new Date(group.createdAt).toLocaleDateString("pt-BR")}
                  </Table.Td>
                  <Table.Td style={{ textAlign: "center" }}>
                    <Flex gap="xs" justify="center">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        size="sm"
                        onClick={() => handleInviteMemberClick(group)}
                        aria-label="Convidar membro"
                      >
                        <IconUserPlus size={14} />
                      </ActionIcon>
                      {/* Add edit functionality later if needed */}
                      {/* <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={() => handleEditClick(group)}
                        aria-label="Editar grupo"
                      >
                        <IconEdit size={14} />
                      </ActionIcon> */}
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => handleDeleteGroupClick(group)}
                        aria-label="Excluir grupo"
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

      {/* Create New Group Modal */}
      <Modal
        opened={createModalOpened}
        onClose={closeCreateModal}
        title="Criar Novo Grupo"
        centered
      >
        <form onSubmit={createForm.handleSubmit(handleCreateGroup)}>
          <Stack>
            <Controller
              name="nome"
              control={createForm.control}
              render={({ field }) => (
                <TextInput
                  label="Nome do Grupo"
                  placeholder="Ex: Família, Amigos, Trabalho"
                  error={createForm.formState.errors.nome?.message}
                  {...field}
                />
              )}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeCreateModal}>
                Cancelar
              </Button>
              <Button type="submit">Criar Grupo</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Invite Member Modal */}
      <Modal
        opened={inviteModalOpened}
        onClose={closeInviteModal}
        title={`Convidar para "${selectedGroup?.displayName || selectedGroup?.nome}"`}
        centered
      >
        {selectedGroup && (
          <form onSubmit={inviteForm.handleSubmit(handleInviteMember)}>
            <Stack>
              <Text>
                Envie um convite para um novo membro se juntar a este grupo.
              </Text>
              <Controller
                name="email"
                control={inviteForm.control}
                render={({ field }) => (
                  <TextInput
                    label="E-mail do Membro"
                    placeholder="email@example.com"
                    error={inviteForm.formState.errors.email?.message}
                    {...field}
                  />
                )}
              />
              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={closeInviteModal}>
                  Cancelar
                </Button>
                <Button type="submit">Enviar Convite</Button>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>

      {/* Delete Group Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Confirmar Exclusão do Grupo"
        centered
      >
        <Text>
          Tem certeza de que deseja excluir o grupo "
          <b>{selectedGroup?.displayName || selectedGroup?.nome}</b>"? Esta
          ação não pode ser desfeita e removerá o grupo para todos os membros.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeDeleteModal}>
            Cancelar
          </Button>
          <Button color="red" onClick={handleConfirmDeleteGroup}>
            Excluir Grupo
          </Button>
        </Group>
      </Modal>
    </motion.div>
  );
}
