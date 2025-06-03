import { NumberInput, NumberInputProps } from '@mantine/core';
import { useEffect, useState } from 'react';

interface CurrencyInputProps extends Omit<NumberInputProps, 'onChange'> {
  onChange: (value: number) => void;
  value: number;
}

export default function CurrencyInput({ onChange, value, ...props }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Format number to Brazilian currency
  const formatToCurrency = (num: number): string => {
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Convert string to number (removes currency formatting)
  const parseToNumber = (str: string): number => {
    // Remove all non-numeric characters except decimal separator
    const numStr = str.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(numStr) || 0;
  };

  // Handle input change
  const handleInputChange = (inputValue: string) => {
    setIsTyping(true);
    
    // Remove any non-numeric characters
    const numericValue = inputValue.replace(/\D/g, '');
    
    if (numericValue === '') {
      onChange(0);
      setDisplayValue('0,00');
      return;
    }

    // Convert to decimal format (divide by 100 to handle cents)
    const decimalValue = parseInt(numericValue, 10) / 100;
    onChange(decimalValue);
    setDisplayValue(formatToCurrency(decimalValue));
  };

  // Update display value when value prop changes
  useEffect(() => {
    if (!isTyping) {
      setDisplayValue(formatToCurrency(value));
    }
  }, [value, isTyping]);

  // Reset typing state when input loses focus
  const handleBlur = () => {
    setIsTyping(false);
    setDisplayValue(formatToCurrency(value));
  };

  return (
    <NumberInput
      {...props}
      value={displayValue}
      onChange={(val) => handleInputChange(val.toString())}
      onBlur={handleBlur}
      prefix="R$ "
      decimalSeparator=","
      thousandsSeparator="."
      parser={(value) => parseToNumber(value)}
      formatter={(value) => value}
    />
  );
}