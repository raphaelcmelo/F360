import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
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
} from '@mantine/core';
import { IconLogout, IconUserCircle, IconSun, IconMoon, IconSettings } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [opened, setOpened] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/orcamento')) return 'Orçamento Mensal';
    if (path.includes('/lancamentos')) return 'Lançamentos';
    if (path.includes('/meus-grupos')) return 'Meus Grupos';
    if (path.includes('/grupo/')) return 'Detalhes do Grupo';
    if (path.includes('/historico')) return 'Histórico';
    
    return 'Finanças360';
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
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
            <ActionIcon
              variant="light"
              onClick={toggleColorScheme}
              size="lg"
              radius="xl"
              color="blue"
            >
              {colorScheme === 'dark' ? (
                <IconSun size={18} />
              ) : (
                <IconMoon size={18} />
              )}
            </ActionIcon>

            <Menu
              shadow="md"
              width={200}
              position="bottom-end"
            >
              <Menu.Target>
                <Button variant="subtle" px={8}>
                  <Group gap={8}>
                    <Avatar color="blue" radius="xl" size="sm">
                      {user?.nome.charAt(0)}
                    </Avatar>
                    <Text size="sm" fw={500} visibleFrom="sm">
                      {user?.nome}
                    </Text>
                  </Group>
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Conta</Menu.Label>
                <Menu.Item
                  leftSection={<IconUserCircle style={{ width: rem(14), height: rem(14) }} />}
                >
                  Meu Perfil
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}
                >
                  Configurações
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
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
