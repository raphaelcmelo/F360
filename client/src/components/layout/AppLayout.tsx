import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppShell,
  Burger,
  Text,
  Group,
  Button,
  Avatar,
  Menu,
  Title,
  useMantineColorScheme,
  ActionIcon,
  rem,
} from "@mantine/core";
import {
  IconLogout,
  IconUserCircle,
  IconSun,
  IconMoon,
  IconSettings,
} from "@tabler/icons-react";
import { useAuth } from "../../contexts/AuthContext";
import Sidebar from "./Sidebar";
import GroupSelector from "../ui/GroupSelector"; // Import GroupSelector
import { groupApi } from "../../services/api"; // Import groupApi
import { Group as GroupType } from "../../types/group"; // Import GroupType

export default function AppLayout() {
  const [opened, setOpened] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, activeGroup, setActiveGroup } = useAuth(); // Get activeGroup and setActiveGroup
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [groups, setGroups] = useState<GroupType[]>([]); // State for user groups

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === "dark" ? "light" : "dark");
  };

  // Fetch user groups when user data is available
  useEffect(() => {
    const fetchGroups = async () => {
      if (user) {
        try {
          const userGroups = await groupApi.getUserGroups();
          setGroups(userGroups);
        } catch (error) {
          console.error("Failed to fetch user groups:", error);
          setGroups([]);
        }
      } else {
        setGroups([]);
      }
    };
    fetchGroups();
  }, [user]); // Depend on user object

  const getPageTitle = () => {
    const path = location.pathname;

    if (path.includes("/dashboard")) return "Dashboard";
    if (path.includes("/orcamento")) return "Orçamento Mensal";
    if (path.includes("/lancamentos")) return "Lançamentos";
    if (path.includes("/meus-grupos")) return "Meus Grupos";
    if (path.includes("/grupo/")) return "Detalhes do Grupo";
    if (path.includes("/historico")) return "Histórico";

    return "Finanças360";
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={() => setOpened((o) => !o)}
              hiddenFrom="sm"
              size="sm"
            />
            <Title order={3} c="primary">
              Finanças360
            </Title>
          </Group>

          <Group>
            {/* Group Selector in the header */}
            {user && groups.length > 0 && (
              <GroupSelector
                value={activeGroup || ""} // Use activeGroup from context
                onChange={setActiveGroup} // Use setActiveGroup from context
                groups={groups}
                w={200} // Adjust width as needed
              />
            )}

            <ActionIcon
              variant="light"
              onClick={toggleColorScheme}
              size="lg"
              radius="xl"
              color="blue"
            >
              {colorScheme === "dark" ? (
                <IconSun size={18} />
              ) : (
                <IconMoon size={18} />
              )}
            </ActionIcon>

            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <Button variant="subtle" px={8}>
                  <Group gap={8}>
                    <Avatar color="blue" radius="xl" size="sm">
                      {user?.name?.charAt(0)}
                    </Avatar>
                    <Text size="sm" fw={500} visibleFrom="sm">
                      {user?.name}
                    </Text>
                  </Group>
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Conta</Menu.Label>
                <Menu.Item
                  leftSection={
                    <IconUserCircle
                      style={{ width: rem(14), height: rem(14) }}
                    />
                  }
                >
                  Meu Perfil
                </Menu.Item>
                <Menu.Item
                  leftSection={
                    <IconSettings style={{ width: rem(14), height: rem(14) }} />
                  }
                >
                  Configurações
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={
                    <IconLogout style={{ width: rem(14), height: rem(14) }} />
                  }
                  onClick={logout}
                >
                  Sair
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Sidebar onLinkClick={() => setOpened(false)} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Title order={2} mb={24} className="page-transition">
          {getPageTitle()}
        </Title>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
