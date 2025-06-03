import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Group, Text, Anchor, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const { login, isLoading } = useAuth();
  const [error, setError] = useState('');
  
  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'E-mail inválido'),
      password: (value) => (value.length >= 6 ? null : 'A senha deve ter pelo menos 6 caracteres'),
    },
  });
  
  const handleSubmit = async (values: typeof form.values) => {
    try {
      setError('');
      await login(values.email, values.password);
    } catch (err) {
      setError('Falha ao fazer login. Verifique suas credenciais.');
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
          <TextInput
            required
            label="E-mail"
            placeholder="seu@email.com"
            {...form.getInputProps('email')}
          />
          
          <PasswordInput
            required
            label="Senha"
            placeholder="Sua senha"
            {...form.getInputProps('password')}
          />
          
          {error && <Text c="red" size="sm">{error}</Text>}
          
          <Group justify="space-between" mt="md">
            <Anchor component={Link} to="/forgot-password" size="sm">
              Esqueceu sua senha?
            </Anchor>
          </Group>
          
          <Button fullWidth type="submit" loading={isLoading}>
            Entrar
          </Button>
          
          <Text c="dimmed" size="sm" ta="center" mt="sm">
            Não tem uma conta?{' '}
            <Anchor component={Link} to="/register" size="sm">
              Cadastre-se
            </Anchor>
          </Text>
        </Stack>
      </form>
    </motion.div>
  );
}