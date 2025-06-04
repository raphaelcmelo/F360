import { Select, SelectItem } from "@mantine/core";
import { Group as BudgetGroupType } from "../../types/group"; // Corrected import path

interface GroupSelectorProps {
  value: string;
  onChange: (value: string | null) => void;
  groups: BudgetGroupType[];
}

export default function GroupSelector({
  value,
  onChange,
  groups,
}: GroupSelectorProps) {
  // Ensure groups is always an array before mapping
  const data = (groups || []).map((group) => ({
    value: group._id,
    label: group.displayName,
  }));

  return (
    <Select
      placeholder="Selecione um grupo"
      data={data}
      value={value}
      onChange={(val: string | null, option: SelectItem) => {
        console.log(
          "GroupSelector onChange received val:",
          val,
          "Type:",
          typeof val
        );
        console.log("GroupSelector onChange received option:", option);
        onChange(val);
      }}
      searchable
      nothingFoundMessage="Nenhum grupo encontrado"
      allowDeselect={false}
      size="md"
      w={250}
    />
  );
}
