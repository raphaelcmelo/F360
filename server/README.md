
# Dashboard Backend

API backend para o sistema de dashboard com autenticação e gestão de usuários.

## Tecnologias

- Node.js + Express
- MongoDB + Mongoose
- JWT para autenticação
- Zod para validação
- Docker para MongoDB

## Configuração

1. Instalar dependências:
```bash
cd server
npm install
```

2. Configurar variáveis de ambiente:
```bash
cp .env.example .env
# Editar as variáveis no arquivo .env
```

3. Subir o MongoDB com Docker:
```bash
npm run docker:up
```

4. Iniciar o servidor:
```bash
npm run dev
```

## Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Perfil do usuário logado

### Usuários (Admin apenas)
- `GET /api/users` - Listar usuários
- `GET /api/users/:id` - Obter usuário por ID
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário

### Dashboard
- `GET /api/users/dashboard/stats` - Estatísticas do dashboard

## Docker

Para gerenciar o MongoDB:
```bash
npm run docker:up    # Subir container
npm run docker:down  # Parar container
```

## Estrutura de Pastas

```
server/
├── src/
│   ├── config/          # Configurações (DB, etc)
│   ├── controllers/     # Controladores
│   ├── middleware/      # Middlewares
│   ├── models/         # Modelos do Mongoose
│   ├── routes/         # Rotas da API
│   └── server.js       # Arquivo principal
├── docker-compose.yml  # Configuração do Docker
└── package.json       # Dependências
```
