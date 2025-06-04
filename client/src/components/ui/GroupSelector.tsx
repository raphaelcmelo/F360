import { Select } from '@mantine/core';
import { Group } from '../../types/user'; // Import the Group type

interface GroupSelectorProps {
  value: string;
  onChange: (value: string | null) => void;
  groups: Group[]; // New prop to receive the user's groups
}

export default function GroupSelector({ value, onChange, groups }: GroupSelectorProps) {
  const data = groups.map(group => ({
    value: group._id,
    label: group.nome,
  }));

  return (
    <Select
      placeholder="Selecione um grupo"
      data={data}
      value={value}
      onChange={onChange}
      searchable
      nothingFound="Nenhum grupo encontrado"
      allowDeselect={false} // A user must always have a group selected
      size="md"
      w={250}
    />
  );
}
