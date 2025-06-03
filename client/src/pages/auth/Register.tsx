import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Group, Text, Anchor, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

export default function Register() {
  const { register, isLoading } = useAuth();
  const [error, setError] = useState('');
  
  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      name: (value) => (value.length >= 3 ? null : 'Nome deve ter pelo menos 3 caracteres'),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'E-mail inválido'),
      password: (value) => (value.length >= 6 ? null : 'A senha deve ter pelo menos 6 caracteres'),
      confirmPassword: (value, values) => 
        value === values.password ? null : 'As senhas não coincidem',
    },
  });
  
  const handleSubmit = async (values: typeof form.values) => {
    try {
      setError('');
      await register(values.name, values.email, values.password);
    } catch (err) {
      setError('Falha ao criar conta. Tente novamente.');
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
            label="Nome"
            placeholder="Seu nome"
            {...form.getInputProps('name')}
          />
          
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
          
          <PasswordInput
            required
            label="Confirmar senha"
            placeholder="Confirme sua senha"
            {...form.getInputProps('confirmPassword')}
          />
          
          {error && <Text c="red" size="sm">{error}</Text>}
          
          <Button fullWidth type="submit" loading={isLoading}>
            Criar conta
          </Button>
          
          <Text c="dimmed" size="sm" ta="center" mt="sm">
            Já tem uma conta?{' '}
            <Anchor component={Link} to="/login" size="sm">
              Entrar
            </Anchor>
          </Text>
        </Stack>
      </form>
    </motion.div>
  );
}
