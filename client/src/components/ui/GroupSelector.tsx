import { Select } from "@mantine/core";
import { IconUsersGroup } from "@tabler/icons-react";
import { Group as UserGroup } from "../../types/group"; // Import Group type

interface GroupSelectorProps {
  value: string | null; // Allow null for initial state
  onChange: (value: string) => void;
  groups: UserGroup[]; // New prop for actual groups
}

export default function GroupSelector({
  value,
  onChange,
  groups,
}: GroupSelectorProps) {
  const data = groups.map((group) => ({
    value: group._id,
    label: group.displayName || group.nome, // Use displayName if available, otherwise nome
  }));

  return (
    <Select
      leftSection={<IconUsersGroup size={16} />}
      placeholder="Selecione um grupo"
      data={data}
      value={value}
      onChange={(val) => onChange(val || "")} // Ensure onChange receives a string
      searchable
      nothingFoundMessage="Nenhum grupo encontrado. Crie um novo."
      clearable={false} // A group should always be selected if available
      disabled={groups.length === 0} // Disable if no groups are available
    />
  );
}
