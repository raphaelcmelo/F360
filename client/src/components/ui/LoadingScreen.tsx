import { Center, Loader, Text, Stack } from '@mantine/core';

export default function LoadingScreen() {
  return (
    <Center style={{ height: '100vh' }}>
      <Stack align="center">
        <Loader size="lg" />
        <Text>Carregando...</Text>
      </Stack>
    </Center>
  );
}