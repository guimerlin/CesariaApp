// components/stock/ResultsTable.jsx
import React from 'react';

const ResultsTable = ({ searchResults, onRequestItem }) => {
  const hasResults = Object.keys(searchResults).length > 0;

  if (!hasResults) {
    return null;
  }

  const handleRequestClick = (product) => {
    onRequestItem(product);
  };

  return (
    <div className="overflow-x-auto w-full">
      <div className="space-y-6">
        {Object.entries(searchResults).map(([loja, produtos]) => {
          const availableProducts = produtos;
          
          if (availableProducts.length === 0) {
            return null;
          }

          return (
            <div key={loja} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Cabeçalho da Loja */}
              <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                <h3 className="font-bold text-red-700 text-lg">
                  Loja: {loja}
                </h3>
                <p className="text-sm text-red-600">
                  {availableProducts.length} produto(s) disponível(is)
                </p>
              </div>

              {/* Tabela de Produtos */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  {/* Cabeçalho da Tabela */}
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                        Código
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                        Produto
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                        Estoque
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                        Custo
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                        Preço Venda
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                        Ação
                      </th>
                    </tr>
                  </thead>

                  {/* Corpo da Tabela */}
                  <tbody className="divide-y divide-gray-200">
                    {availableProducts.map((product, index) => (
                      <ProductRow
                        key={`${loja}-${product.CODIGO || index}`}
                        product={product}
                        onRequestClick={handleRequestClick}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProductRow = ({ product, onRequestClick }) => {
  const [isRequested, setIsRequested] = React.useState(false);

  const handleClick = () => {
    if (!isRequested) {
      setIsRequested(true);
      onRequestClick(product);
    }
  };

  const formatPrice = (price) => {
    if (price == null || price === '') return 'N/A';
    const numPrice = Number(price);
    return isNaN(numPrice) ? 'N/A' : `R$ ${numPrice.toFixed(2)}`;
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900 break-words">
        {product.CODIGO || 'N/A'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
        <div
          className="truncate"
          title={`${product.PRODUTO || ''} ${product.APRESENTACAO || ''}`}
        >
          {`${product.PRODUTO || 'N/A'} ( ${product.APRESENTACAO || '/'} )`}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 text-center">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {product.ESTOQUEATUAL != null ? product.ESTOQUEATUAL : 'N/A'}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 text-center">
        {formatPrice(product.PRECOCUSTO)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 text-center font-medium">
        {formatPrice(product.PRECOVENDA)}
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={handleClick}
          disabled={isRequested}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-200 ${
            isRequested
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isRequested ? 'Solicitado!' : 'Solicitar'}
        </button>
      </td>
    </tr>
  );
};

export default ResultsTable;

