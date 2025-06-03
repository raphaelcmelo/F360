import { useState, useEffect } from 'react';
import { Select, Skeleton } from '@mantine/core';
import { mockApi } from '../../services/api';
import { Group } from '../../types/group';

interface GroupSelectorProps {
  value: string;
  onChange: (groupId: string) => void;
}

export default function GroupSelector({ value, onChange }: GroupSelectorProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await mockApi.groups.getAll();
        setGroups(data);
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, []);

  if (isLoading) {
    return <Skeleton height={36} width={200} />;
  }

  return (
    <Select
      label="Grupo financeiro"
      placeholder="Selecione um grupo"
      data={groups.map(group => ({
        value: group._id,
        label: group.nome,
      }))}
      value={value}
      onChange={(val) => val && onChange(val)}
      style={{ width: 200 }}
    />
  );
}