import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TextInput, Button, Text, Anchor, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

export default function ForgotPassword() {
  const { forgotPassword, isLoading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const form = useForm({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'E-mail inválido'),
    },
  });
  
  const handleSubmit = async (values: typeof form.values) => {
    try {
      setError('');
      await forgotPassword(values.email);
      setSubmitted(true);
    } catch (err) {
      setError('Falha ao enviar e-mail de recuperação. Tente novamente.');
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {submitted ? (
        <Stack align="center\" spacing="md">
          <Text ta="center">
            Enviamos um e-mail de recuperação para {form.values.email}.
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
          </Text>
          <Anchor component={Link} to="/login" size="sm">
            Voltar para o login
          </Anchor>
        </Stack>
      ) : (
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Text size="sm" mb="md">
              Digite seu e-mail e enviaremos instruções para redefinir sua senha.
            </Text>
            
            <TextInput
              required
              label="E-mail"
              placeholder="seu@email.com"
              {...form.getInputProps('email')}
            />
            
            {error && <Text c="red" size="sm">{error}</Text>}
            
            <Button fullWidth type="submit" loading={isLoading}>
              Enviar instruções
            </Button>
            
            <Anchor component={Link} to="/login" size="sm" ta="center">
              Voltar para o login
            </Anchor>
          </Stack>
        </form>
      )}
    </motion.div>
  );
}