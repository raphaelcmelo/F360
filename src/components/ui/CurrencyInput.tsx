import { TextInput, TextInputProps } from "@mantine/core";
import { useEffect, useState } from "react";

interface CurrencyInputProps
  extends Omit<TextInputProps, "onChange" | "value"> {
  onChange: (value: number) => void;
  value: number;
}

export default function CurrencyInput({
  onChange,
  value,
  ...props
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("");

  // Format number to Brazilian currency string
  const formatCurrency = (num: number): string => {
    return num.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Converts string with digits only into formatted currency
  const handleChange = (input: string) => {
    // Remove all non-digit characters
    const digitsOnly = input.replace(/\D/g, "");

    // Prevent leading zeros
    const cleaned = digitsOnly.replace(/^0+/, "") || "0";

    // Convert to number with cents
    const valueInCents = parseInt(cleaned, 10);
    const floatValue = valueInCents / 100;

    setDisplayValue(formatCurrency(floatValue));
    onChange(floatValue);
  };

  useEffect(() => {
    setDisplayValue(formatCurrency(value));
  }, [value]);

  return (
    <TextInput
      {...props}
      value={`R$ ${displayValue}`}
      onChange={(event) => handleChange(event.currentTarget.value)}
    />
  );
}
