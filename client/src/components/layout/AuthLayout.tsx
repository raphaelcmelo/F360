import { Outlet } from "react-router-dom";
import { Container, Paper, Title, Text, Box, Group } from "@mantine/core";
import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";

export default function AuthLayout() {
  const MotionPaper = motion(Paper);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #e6f7ff 0%, #f0f8ff 100%)",
        padding: "16px",
      }}
    >
      <Container size="xs" p={0} mt={150}>
        <MotionPaper
          radius="md"
          p="xl"
          withBorder
          shadow="md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box ta="center" mb="lg">
            <Group justify="center" mb="md">
              <CreditCard size={32} strokeWidth={1.5} color="#228be6" />
            </Group>
            <Title order={2} c="primary" mb="xs">
              Finanças360
            </Title>
            <Text size="sm" c="dimmed">
              Controle financeiro colaborativo para famílias
            </Text>
          </Box>

          <Outlet />
        </MotionPaper>
      </Container>
    </Box>
  );
}
