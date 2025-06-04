import { Select } from '@mantine/core';
import { Group as BudgetGroupType } from '../../types/user'; // Alias Group to BudgetGroupType

interface GroupSelectorProps {
  value: string;
  onChange: (value: string | null) => void;
  groups: BudgetGroupType[];
}

export default function GroupSelector({ value, onChange, groups }: GroupSelectorProps) {
  const data = groups.map((group) => ({
    value: group._id,
    label: group.displayName, // Use displayName directly as it's guaranteed to exist now
  }));

  return (
    <Select
      placeholder="Selecione um grupo"
      data={data}
      value={value}
      onChange={onChange}
      searchable
      nothingFoundMessage="Nenhum grupo encontrado"
      allowDeselect={false}
      size="md"
      w={250}
    />
  );
}
