import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink, Stack, Group, Text, ThemeIcon, rem } from '@mantine/core';
import {
  IconDashboard,
  IconReceipt,
  IconCash,
  IconUsers,
  IconHistory,
} from '@tabler/icons-react';

interface SidebarProps {
  onLinkClick?: () => void;
}

export default function Sidebar({ onLinkClick }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <IconDashboard style={{ width: rem(20), height: rem(20) }} stroke={1.5} />,
    },
    {
      path: '/orcamento',
      label: 'Orçamento',
      icon: <IconReceipt style={{ width: rem(20), height: rem(20) }} stroke={1.5} />,
    },
    {
      path: '/lancamentos',
      label: 'Lançamentos',
      icon: <IconCash style={{ width: rem(20), height: rem(20) }} stroke={1.5} />,
    },
    {
      path: '/meus-grupos',
      label: 'Meus Grupos',
      icon: <IconUsers style={{ width: rem(20), height: rem(20) }} stroke={1.5} />,
    },
    {
      path: '/historico',
      label: 'Histórico',
      icon: <IconHistory style={{ width: rem(20), height: rem(20) }} stroke={1.5} />,
    },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <Stack gap="xs">
      {links.map((link) => (
        <NavLink
          key={link.path}
          active={location.pathname === link.path}
          label={
            <Group gap="xs">
              <ThemeIcon variant={location.pathname === link.path ? 'filled' : 'light'} size="lg">
                {link.icon}
              </ThemeIcon>
              <Text size="sm">{link.label}</Text>
            </Group>
          }
          onClick={() => handleNavClick(link.path)}
        />
      ))}
    </Stack>
  );
}