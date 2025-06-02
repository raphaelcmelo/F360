import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PasswordInput, Button, Text, Anchor, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const { resetPassword, isLoading } = useAuth();
  const [error, setError] = useState('');
  
  const form = useForm({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validate: {
      password: (value) => (value.length >= 6 ? null : 'A senha deve ter pelo menos 6 caracteres'),
      confirmPassword: (value, values) => 
        value === values.password ? null : 'As senhas não coincidem',
    },
  });
  
  const handleSubmit = async (values: typeof form.values) => {
    if (!token) {
      setError('Token de redefinição inválido');
      return;
    }
    
    try {
      setError('');
      await resetPassword(token, values.password);
    } catch (err) {
      setError('Falha ao redefinir senha. O token pode ter expirado.');
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Text size="sm" mb="md">
            Digite sua nova senha.
          </Text>
          
          <PasswordInput
            required
            label="Nova senha"
            placeholder="Sua nova senha"
            {...form.getInputProps('password')}
          />
          
          <PasswordInput
            required
            label="Confirmar senha"
            placeholder="Confirme sua nova senha"
            {...form.getInputProps('confirmPassword')}
          />
          
          {error && <Text c="red" size="sm">{error}</Text>}
          
          <Button fullWidth type="submit" loading={isLoading}>
            Redefinir senha
          </Button>
          
          <Anchor component={Link} to="/login" size="sm" ta="center">
            Voltar para o login
          </Anchor>
        </Stack>
      </form>
    </motion.div>
  );
}