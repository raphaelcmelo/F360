import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaEye } from "react-icons/fa"; // Using react-icons for web

const GroupDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Dummy data for group details
  const group = {
    id: id,
    name: `Grupo de Amigos ${id}`,
    description:
      "Gerenciamento de despesas entre amigos para viagens e eventos.",
    members: [
      {
        id: "1",
        name: "Alice",
        avatar:
          "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      },
      {
        id: "2",
        name: "Bob",
        avatar:
          "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      },
      {
        id: "3",
        name: "Charlie",
        avatar:
          "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      },
      {
        id: "4",
        name: "Diana",
        avatar:
          "https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      },
    ],
    recentTransactions: [
      {
        id: "t1",
        description: "Jantar no restaurante",
        amount: 120.5,
        date: "2023-10-26",
      },
      {
        id: "t2",
        description: "Ingressos para o cinema",
        amount: 45.0,
        date: "2023-10-25",
      },
      {
        id: "t3",
        description: "Aluguel de carro",
        amount: 300.0,
        date: "2023-10-24",
      },
    ],
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
        <h1 className="text-3xl font-bold text-gray-800">{group.name}</h1>
      </div>

      <div className="bg-white rounded-xl p-5 mb-4 shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
          Descrição do Grupo
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          {group.description}
        </p>
      </div>

      <div className="bg-white rounded-xl p-5 mb-4 shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
          Membros
        </h2>
        <div className="flex flex-wrap justify-start">
          {group.members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col items-center mr-4 mb-3"
            >
              <div className="w-12 h-12 rounded-full bg-blue-300 flex justify-center items-center mb-1.5">
                <span className="text-white text-xl font-bold">
                  {member.name.charAt(0)}
                </span>
              </div>
              <p className="text-sm text-gray-700 text-center">{member.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 mb-4 shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
          Lançamentos Recentes
        </h2>
        {group.recentTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0"
          >
            <p className="text-base text-gray-800 flex-2">
              {transaction.description}
            </p>
            <p className="text-base font-bold text-green-600 flex-1 text-right">
              R$ {transaction.amount.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 flex-1 text-right">
              {transaction.date}
            </p>
          </div>
        ))}
        {group.recentTransactions.length === 0 && (
          <p className="text-base text-gray-600 text-center py-5">
            Nenhum lançamento recente.
          </p>
        )}
      </div>

      <button className="bg-blue-600 text-white py-3 px-5 rounded-lg flex items-center justify-center w-full mb-3 shadow-lg hover:bg-blue-700 transition-colors">
        <FaPlus className="mr-2" />
        <span className="text-lg font-bold">Adicionar Lançamento</span>
      </button>
      <button className="bg-gray-600 text-white py-3 px-5 rounded-lg flex items-center justify-center w-full shadow-lg hover:bg-gray-700 transition-colors">
        <FaEye className="mr-2" />
        <span className="text-lg font-bold">Ver Todos os Lançamentos</span>
      </button>
    </div>
  );
};

export default GroupDetail;
