import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Button,
  Text,
  Anchor,
  Stack,
  Divider,
  Group,
  Paper,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const { login, register, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [inviteData, setInviteData] = useState<{ email: string; groupName: string } | null>(null);
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(true);
  
  const registerForm = useForm({
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
  
  const loginForm = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'E-mail inválido'),
      password: (value) => (value.length >= 6 ? null : 'A senha deve ter pelo menos 6 caracteres'),
    },
  });
  
  useEffect(() => {
    if (isAuthenticated) {
      // If user is already logged in, just accept the invite directly
      acceptInvite();
    } else {
      // Validate the invite token
      validateInvite();
    }
  }, [isAuthenticated, token]);
  
  const validateInvite = async () => {
    if (!token) {
      setError('Token de convite inválido');
      setIsValidating(false);
      return;
    }
    
    try {
      // Mock API call to validate the token
      // In a real implementation, this would call the backend
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock response
      setInviteData({
        email: 'convidado@example.com',
        groupName: 'Família Silva',
      });
      
      // Pre-fill the email in the forms
      registerForm.setFieldValue('email', 'convidado@example.com');
      loginForm.setFieldValue('email', 'convidado@example.com');
      
      setIsValidating(false);
    } catch (err) {
      setError('Convite inválido ou expirado');
      setIsValidating(false);
    }
  };
  
  const acceptInvite = async () => {
    try {
      // Mock API call to accept the invite
      // In a real implementation, this would call the backend
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError('Falha ao aceitar o convite. Tente novamente.');
    }
  };
  
  const handleRegister = async (values: typeof registerForm.values) => {
    try {
      setError('');
      await register(values.name, values.email, values.password);
      // After registration, redirect to login
      navigate('/login');
    } catch (err) {
      setError('Falha ao criar conta. Tente novamente.');
    }
  };
  
  const handleLogin = async (values: typeof loginForm.values) => {
    try {
      setError('');
      await login(values.email, values.password);
      // After login, the useEffect will handle accepting the invite
    } catch (err) {
      setError('Falha ao fazer login. Verifique suas credenciais.');
    }
  };
  
  if (isValidating) {
    return (
      <Stack align="center" spacing="md">
        <Text>Validando convite...</Text>
      </Stack>
    );
  }
  
  if (error && !inviteData) {
    return (
      <Stack align="center" spacing="md">
        <Text c="red">{error}</Text>
        <Anchor component={Link} to="/login" size="sm">
          Voltar para o login
        </Anchor>
      </Stack>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Text size="lg" ta="center" mb="md">
        Você foi convidado para participar do grupo <b>{inviteData?.groupName}</b>!
      </Text>
      
      <Paper withBorder p="md" radius="md" mb="md">
        <Text size="sm" mb="md">
          Já possui uma conta? Faça login para aceitar o convite.
        </Text>
        
        <form onSubmit={loginForm.onSubmit(handleLogin)}>
          <Stack>
            <TextInput
              required
              label="E-mail"
              placeholder="seu@email.com"
              {...loginForm.getInputProps('email')}
            />
            
            <PasswordInput
              required
              label="Senha"
              placeholder="Sua senha"
              {...loginForm.getInputProps('password')}
            />
            
            <Button fullWidth type="submit" loading={isLoading}>
              Entrar e aceitar convite
            </Button>
          </Stack>
        </form>
      </Paper>
      
      <Divider label="ou crie uma nova conta" labelPosition="center" my="lg" />
      
      <form onSubmit={registerForm.onSubmit(handleRegister)}>
        <Stack>
          <TextInput
            required
            label="Nome"
            placeholder="Seu nome"
            {...registerForm.getInputProps('name')}
          />
          
          <TextInput
            required
            label="E-mail"
            placeholder="seu@email.com"
            {...registerForm.getInputProps('email')}
          />
          
          <PasswordInput
            required
            label="Senha"
            placeholder="Sua senha"
            {...registerForm.getInputProps('password')}
          />
          
          <PasswordInput
            required
            label="Confirmar senha"
            placeholder="Confirme sua senha"
            {...registerForm.getInputProps('confirmPassword')}
          />
          
          {error && <Text c="red" size="sm">{error}</Text>}
          
          <Button fullWidth type="submit" loading={isLoading}>
            Criar conta e aceitar convite
          </Button>
        </Stack>
      </form>
    </motion.div>
  );
}