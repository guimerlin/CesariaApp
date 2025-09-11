import React from 'react';

function PaginaExterna() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <iframe
        src="https://interno.redecesaria.com.br/login"
        title="Página Externa"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
}

export default PaginaExterna;
