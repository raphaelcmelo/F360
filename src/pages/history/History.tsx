import React from "react";
import { useNavigate } from "react-router-dom";
import { FaWallet, FaChartBar, FaUsers, FaArrowLeft } from "react-icons/fa"; // Using react-icons for web

const History = () => {
  const navigate = useNavigate();

  // Dummy data for history entries
  const historyEntries = [
    {
      id: "h1",
      type: "transaction",
      description: "Pagamento de aluguel",
      amount: 1500.0,
      date: "2023-10-26",
      category: "Moradia",
    },
    {
      id: "h2",
      type: "budget_change",
      description: "Orçamento de alimentação ajustado",
      oldValue: 500,
      newValue: 600,
      date: "2023-10-25",
    },
    {
      id: "h3",
      type: "transaction",
      description: "Compra de supermercado",
      amount: 230.75,
      date: "2023-10-24",
      category: "Alimentação",
    },
    {
      id: "h4",
      type: "transaction",
      description: "Assinatura de streaming",
      amount: 39.9,
      date: "2023-10-23",
      category: "Entretenimento",
    },
    {
      id: "h5",
      type: "group_activity",
      description: 'Novo membro adicionado ao "Grupo Viagem"',
      date: "2023-10-22",
    },
    {
      id: "h6",
      type: "transaction",
      description: "Manutenção do carro",
      amount: 450.0,
      date: "2023-10-21",
      category: "Transporte",
    },
    {
      id: "h7",
      type: "budget_change",
      description: "Orçamento de transporte ajustado",
      oldValue: 300,
      newValue: 350,
      date: "2023-10-20",
    },
    {
      id: "h8",
      type: "transaction",
      description: "Consulta médica",
      amount: 200.0,
      date: "2023-10-19",
      category: "Saúde",
    },
    {
      id: "h9",
      type: "transaction",
      description: "Presente de aniversário",
      amount: 100.0,
      date: "2023-10-18",
      category: "Presentes",
    },
    {
      id: "h10",
      type: "group_activity",
      description: 'Despesa "Jantar de Grupo" adicionada',
      date: "2023-10-17",
    },
  ];

  const renderHistoryItem = (item: (typeof historyEntries)[0]) => {
    // Format date to pt-BR
    const formattedDate = new Date(item.date).toLocaleDateString("pt-BR");

    switch (item.type) {
      case "transaction":
        return (
          <div className="flex items-center">
            <FaWallet className="text-blue-500 text-2xl mr-3" />
            <div className="flex-1">
              <p className="text-base font-medium text-gray-800">
                {item.description}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">{item.category}</p>
            </div>
            <p className="text-base font-bold text-red-600 ml-auto mr-2">
              R$ {item.amount?.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">{formattedDate}</p>
          </div>
        );
      case "budget_change":
        return (
          <div className="flex items-center">
            <FaChartBar className="text-green-600 text-2xl mr-3" />
            <div className="flex-1">
              <p className="text-base font-medium text-gray-800">
                {item.description}
              </p>
              <p className="text-sm text-green-600 mt-0.5">
                De R$ {item.oldValue?.toFixed(2)} para R${" "}
                {item.newValue?.toFixed(2)}
              </p>
            </div>
            <p className="text-sm text-gray-600 ml-auto">{formattedDate}</p>
          </div>
        );
      case "group_activity":
        return (
          <div className="flex items-center">
            <FaUsers className="text-yellow-500 text-2xl mr-3" />
            <div className="flex-1">
              <p className="text-base font-medium text-gray-800">
                {item.description}
              </p>
            </div>
            <p className="text-sm text-gray-600 ml-auto">{formattedDate}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 bg-gray-100 p-4 overflow-y-auto">
      <div className="flex items-center mb-5 mt-5">
        <button
          onClick={() => navigate(-1)}
          className="mr-2 p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <FaArrowLeft className="text-gray-700 text-2xl" />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">
          Histórico de Atividades
        </h1>
      </div>

      <div className="mt-4">
        {historyEntries.length > 0 ? (
          historyEntries.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-4 mb-3 shadow-md"
            >
              {renderHistoryItem(item)}
            </div>
          ))
        ) : (
          <p className="text-lg text-gray-600 text-center py-8">
            Nenhuma atividade recente para exibir.
          </p>
        )}
      </div>
    </div>
  );
};

export default History;
